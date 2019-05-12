const apiRouter = require('koa-router')()
const sceneCtrl = require('../../controllers/admin/scene-ctrl')
const authUtil = require('../../common/utils/auth-util')
// 获取场景列表
apiRouter.post('/getSceneList', sceneCtrl.getSceneList)
// 添加场景
apiRouter.post('/addScene', sceneCtrl.addScene)
// 更新场景
apiRouter.post('/updateScene', sceneCtrl.updateScene)
// 删除场景
apiRouter.post('/bulkDeleteScene', sceneCtrl.bulkDeleteScene)

module.exports = router => {
  router.use('/admin/scene', apiRouter.routes(), apiRouter.allowedMethods())
}
