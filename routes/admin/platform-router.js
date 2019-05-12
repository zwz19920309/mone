const apiRouter = require('koa-router')()
const platformCtrl = require('../../controllers/admin/platform-ctrl')

// 获取签到类型列表
apiRouter.post('/getPlatFormList', platformCtrl.getPlatFormList)

module.exports = router => {
  router.use('/admin/platform', apiRouter.routes(), apiRouter.allowedMethods())
}
