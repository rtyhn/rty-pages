#!/usr/bin/env node

// console.log('rty page')
// console.log(process.argv) // argv 是一个数组，执行 $rty-pages --sdfs sdfs，结果：[ '/usr/local/bin/node','/usr/local/bin/rty-pages','--sdfs','sdfs' ]，第一个是 node.exe 这是固定的，第二个是当前文件的路径，这也是固定的，后面就是我们所有的参数

process.argv.push('--cwd') // 因为 argv 是数组，传入的每个成员都应该是独立的数组成员，所以我们单独 push
process.argv.push(process.cwd()) // 工作目录，当前命令行所在的目录
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) // rty-pages/lib/index.js。require 是载入这个模块，resolve是找到这个模块对应的路径，它里面传递的参数是相同的，都是通过相对路径的方式去传。../lib/index，对于这个项目直接传 .. 就行了，因为你找的上层目录是 rty-pages 所在目录，它会自动去找 package.json 下 main 自动对应的文件。

// console.log(process.argv)

require('gulp/bin/gulp') // 载入它，它就会自动载入 gulp-cli，执行require('gulp-cli')();



