
const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const broserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins') // 得到一个方法
const bs = broserSync.create() // 会自动创建一个开发服务器
const cwd = process.cwd() // 返回当前命令行所在工作目录，此时当前工作目录是 zce-gulp-demo，有了这个工作目录后，这个工作目录下应该有这个配置文件，
let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`) // 因为 require 一个不存在的地址的话它会报错。最好的方式是用path.join 把这两个路径${cwd}/pages.config.js连接到一起
  // 如果有默认配置，应该是把导入进来的配置和默认配置合并，而不是把它覆盖掉
  config = Object.assign({}, config, loadConfig) // 先传一个空对象，这样的话就是复制出来一个新的对象
} catch(e) {}

const plugins = loadPlugins() // plugins是一个对象，所有插件都会成为这个对象上面的一个属性，命名方式就是把 gulp-删除掉，如果是 gulp-a-b 这种形式，会把 a-b 换成驼峰 aB 方式。自动加载所有插件
// const plugins.sass = require('gulp-sass') // 在 sass 上右键，rename 重命名这个变量，加上 plugins.，下面所有使用 sass 这个变量的地方都会被修改过来。下面使用插件的地方都会被修改为 plugins 对应的那个属性
// const plugins.babel = require('gulp-babel')
// const plugins.swig = require('gulp-swig')
// const plugins.imagemin = require('gulp-imagemin')

// 模板引擎需要的数据，把网页中经常写死的数据提取出来，可以在代码中配置，还可以单独写一个 json 文件，通过代码把这个 json 文件载入进来
/* const data = {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'Features',
        link: 'features.html'
      },
      {
        name: 'About',
        link: 'about.html'
      },
      {
        name: 'Contact',
        link: '#',
        children: [
          {
            name: 'Twitter',
            link: 'https://twitter.com/w_zce'
          },
          {
            name: 'About',
            link: 'https://weibo.com/zceme'
          },
          {
            name: 'divider'
          },
          {
            name: 'About',
            link: 'https://github.com/zce'
          }
        ]
      }
    ],
    pkg: require('./package.json'),
    date: new Date()
} */

const clean = () => {
  return del([config.build.dist, config.build.temp]) // 指定一个数组，数组可以放任意文件路径。del 方法返回一个 Promise，del 完成后可以标记 clean 任务完成。需要和生成文件串行执行，先删除，再生成，否则会出现生成的文件被删除的情况。还要清除useref之前的临时目录 temp。
}

// 定义一个 style 任务，先定义成一个私有任务，也就是私有函数，然后通过 module.exports 选择性的导出哪些函数
const style = () => {
    // return 将创建的读取流 return 出去，这样 gulp 就可以控制我们这个任务的完成
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src }) // 通过 src 创建一个读取流，base: 转换的时候基准路径是什么，这样它就会把 src 后面的目录结构assets/styles/*.scss保留下来。cwd: 你去找这个路径，你从哪个路径去找，默认 cwd 是当前项目所在的目录，也就是 zce-gulp-demo 这个目录。
        .pipe(plugins.sass({ outputStyle: 'expanded' })) // 基本上每个插件提供的都是一个函数，这个函数的调用结果会返回一个文件的转换流。生成的 css 文件中末尾花括号}紧跟着加在了样式后面，我们希望它单独占一行，可以通过给 sass 指定一个选项outputStyle去完成。outputStyle: 'expanded'按照完全展开的格式生成样式代码。
        .pipe(dest(config.build.temp)) // 通过 dest 创建一个写入流，写入 dist 目录。dest：destnation，目标位置；dist: 分发、发布，也就是这个目录一般是用来发布的，一般编译后的结果放在 dist 目录中。此时编译后不是最终结果，还要经过 useref处理，所以把此时结果放入临时目录 temp。
        .pipe(bs.reload({stream: true}))
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
        .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) // presets: ['@babel/preset-env'] 如果忘记加 presets的话，会出现转换没有效果。这是因为 babel 只是 ECMAScript 的转换平台，平台其实是不做任何事情的，它只是提供一个环境，具体去做转换的其实是 babel 内部的一些插件，而 preset 就是插件的集合，比如preset-env就是最新的一些所有特性的整体的打包，我们使用它就会把所有的特性全部做转换，也可以根据自己需要安装对应的 babel 转换插件，并在这里指定 babel 对应的那个插件就好了，这样它就会转换对应的特性。我们对 babel 的配置一般我们会单独添加一个 .babelrc 文件去配置，那也是可以的。我们这只是把它写在了代码里面，没有什么区别
        .pipe(dest(config.build.temp)) // 放到临时目录
        .pipe(bs.reload({stream: true}))
}

const page = () => {
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src }) // 如果你的 html 不只是在 src 目录下，src的子文件夹下也有，那就要使用src/**/*.html，这样就代表 src 下的任意子目录下的 html 文件，这是一种子目录的通配方式。我们这要求所有的 html 都放在根目录下，其它的是部分页或布局页。这里设置 base 其实就没有什么意义了，因为通配符所在目录就是 src 目录，这里为了统一加上这个 base。
        .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // swig 转换插件，把 data 传入模板中， cache: false, 防止模板缓存导致页面不能及时更新
        .pipe(dest(config.build.temp)) // 放到临时目录
        .pipe(bs.reload({stream: true}))
}

const image = () => {
    return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

// imagemin 会处理能压缩的 svg 文件，对于不能压缩的文件不会处理
const font = () => {
  return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
      .pipe(plugins.imagemin())
      .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 将开发服务器单独定义到一个任务中启动
const serve = () => {

  // 可以在 serve 命令开始的时候监视一些文件，这些文件修改后，它就会执行相应的任务，这些任务一旦触发，就会把对应 dist 下面的文件覆盖掉，一旦被覆盖掉 browser-sync 就会监视到文件的变化，再去同步到浏览器。
  watch(config.build.paths.styles, {cwd: config.build.src}, style) // watch 可以指定两个参数，第一个参数是 globs，也就是我们的通配符，实际上要监视的其实就是之前所有产生构建任务的这些路径, 第二个参数是任务，任务的指定方式直接指定任务函数就可以。cwd 可以通过传第二个参数的方式传进去
  watch(config.build.paths.scripts, {cwd: config.build.src}, script)
  watch(config.build.paths.pages, {cwd: config.build.src}, page) // 如果不用files，可以在对应的任务后面 .pipe(bs.reload({stream: true})) bs.reload({stream: true})会把流里面的信息推到浏览器，这种方式相对于指定files来说更常见一些，此时files就不需要了
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)

  // 希望开发阶段修改图片、字体、public下的文件后也更新浏览器，这时候我们就不是构建，我们减少的是构建的次数。这三种文件变化后我们只需要调用 browser-sync 模块提供的 reload 方法，这个 reload 可以理解为一个任务，因为 gulp 中一个任务就是一个函数，所以第二个参数传一个函数进去没问题。这样，这些文件变化后它自动更新浏览器bs.reload，浏览器会重新发起对这个文件的请求，这样就可以拿到最新的文件了。
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], {cwd: config.build.src}, bs.reload) // public目录 和 images/fonts 的cwd肯定是不一样的，所以不能放在同一个 watch 中，如果放在同一个 watch 中可以拼接一下路径。这里单独抽出来一个 watch。
  watch('**', {cwd: config.build.public}, bs.reload) // public 目录

  // 上面对于 scss、js、html的编译是有意义的（不编译无法在浏览器兼容），而 images、fonts、public 的转换在开发阶段没有太大意义，因为图片、字体我们只是对它做了压缩，在开发阶段监视更多文件、做更多任务，你的开销也就更大，所以如果你开发阶段做压缩，会降低开发阶段构建的效率。这个工作可以放到上线前做，减少文件体积，从而提高网站运行的效率。

  // 启动这个 web 服务器的时候，baseDir 指定两个目录，一个是 dist 目录，一个是 src 目录，对于图片、字体、public 我们把它们放在原位置，不让它们参与这次构建，它只是最终在发布上线之前做一下构建就可以了

  bs.init({ // 初始化 web 服务器的相关配置
    notify: false, // 启动的一瞬间网页右上角会有一个提示，提示 browser-sync 是否已经连接上，这个提示会影响我们在页面中去调试一些样式，我们可以把 notify 关掉，设置为 false，这样我们重启服务器或页面重新刷新的时候就不会再有这样一个提示了。
    port: 2080,// browser-sync 的端口，默认是 3000
    // open: false, // browser-sync 启动的时候会帮你自动打开浏览器，可以设置为 false 取消自动打开
    // files: 'dist/**', // 这个参数可以指定一个字符串，这个字符串就是用来去被 browser-sync 启动后监听的一个路径通配符，你想要哪些文件改变后 browser-sync 自动更新浏览器，那你就设置哪些文件，这里指定 dist 下的所有文件
    server: { // 最核心的配置，server中需要指定网站的根目录，也就是我们 web 服务器需要帮你把哪个目录作为网站的根目录
      baseDir: [config.build.temp, config.build.src, config.build.public], // 我们把加工后的代码放在 dist 当中，浏览器运行的肯定是加工后的结果，当请求过来后，先到数组中第一个目录去找，如果找不到这个文件的话，它就会依次往后去找.把useref 之前加工的文件放入临时目录temp，这里也把dist 改为temp.dist 目录是最终上线需要构建打包的目录，跟这个过程没有关系。
      routes: { // 这里面会优先于 baseDir 的配置，也就是一个请求发生了以后会先去看 routes 里面看有没有配置，如果有会先走 routes 里面的配置，否则就会找 baseDir 对应的文件
        '/node_modules': 'node_modules' // 把 /node_modules（请求的前缀） 路由指到目录 node_modules(这里是一个相对路径，相对于项目的根目录下面的 node_modules)，此时我们针对于bootstrap 这些库文件的请求就会自动映射到我们项目下的 node_modules 中
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, {base: config.build.temp, cwd: config.build.temp}) // 我们要找的并不是 src下的html,而是 dist 下面的 html,因为 src下面的html都是模板，模板里做useref操作是没有意义的。为了统一，指定 base。
  .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] })) // 做文件合并肯定先找这些文件，要去哪个目录找，用 searchPath设置去哪个目录找。例如找 main.css肯定是在 dist目录找，对于 node_modules这种是在项目的根目录去找。对于数组这种值的设置，我们把使用的更多的情况(dist)放在前面，使用更少的(.)放后面。'.' 不用修改成变量形式的路径，因为它表示根目录，项目的根目录肯定是不会变的。
    // 对 html、css、js进行压缩，此时读取流中有三种类型的文件，需要对它们分别做不同的操作，这时候我们就要判断一下读取流中是什么文件就做什么操作，这需要一个 gulp-if 的插件，这个if 会自动创建一个转换流，只不过在这个转换流内部，它会根据 if 指定的条件决定是否执行具体的转换流。第一个参数指定一个正则，它会去匹配文件路径，第二个参数就是指定我们去工作的转换流。
    .pipe(plugins.if(/\.js$/, plugins.uglify()))  // js 结尾，用uglify插件压缩
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true, // 删除空格和换行符
      minifyCSS: true,
      minifyJS: true // 会自动把页面中 script 标签中的脚本压缩
    })))
    .pipe(dest(config.build.dist)) // 指定到这存在一定的不合理，一会解决
}

// 编译任务，是一个组合任务，组合 css、js、page编译任务，这几个任务互不干涉，所以并行，可以提高构建效率
// compile 的作用就是把 src 下的文件做一下转换
const compile = parallel(style, script, page)

// build 上线之前执行的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
) // 启动 build 任务后，可以看到日志显示先 clean，clean 结束后才会启动其它任务，其它任务基本是同时启动的

// 以最小的代价在开发阶段把应用跑起来了
const develop = parallel(compile, serve)

module.exports = {
    clean,
    // style, // style 是一个私有任务，并不能通过 gulp 直接去执行，我们想测试它的话就要导出
    // script,
    // page,
    // compile,
    // image,
    // font
    build, // 所有文件的转换
    // serve,
    develop,
    // useref
}



























