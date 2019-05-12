// require('./models')
const Koa = require('koa')
const app = new Koa()
const onerror = require('koa-onerror')
const koastatic = require('koa-static')
const koaBody = require('koa-body')
const config = require('./config/config')
const path = require('path')
const logUtil = require('./common/utils/log-utils')
const index = require('./routes/index')
const cors = require('koa2-cors')
// error handler

onerror(app)
// 静态资源目录对于相对入口文件index.js的路径
app.use(koastatic(path.join(__dirname, config.staticPath), { maxage: 7 * 86400 * 1000 }))
console.log('@__dirname: ', __dirname)
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

app.use(koaBody({
  multipart: true,
  formLimit: '5mb',
  jsonLimit: '5mb',
  textLimit: '5mb',
  formidable: {
    uploadDir: path.join(__dirname, 'dist'),
    keepExtensions: true,
    hash: 'sha1'
  },
  onError() {
    console.log(arguments)
  }
}))
app.use(async (ctx, next) => {
  const start = new Date()
  try {
    await next()
    let ms = new Date() - start
    console.log('ms: ', ms)
    // 记录响应日志
    logUtil.logResponse(ctx, ms)
  } catch (error) {
    let ms = new Date() - start
    // 记录异常日志
    console.log(error)
    ctx.throw(503, logUtil.logError(ctx, error, ms))
  }
})

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})
app.listen(process.env.PORT || 3001)
console.log('OT App started at port 3001...')
module.exports = app
