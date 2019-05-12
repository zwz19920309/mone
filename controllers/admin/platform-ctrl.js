const HttpResult = require('../../common/http/http-result')
const platformService = require('../../services/admin/platform-service')

// 获取日期类型类表
const getPlatFormList = async (ctx) => {
  let platformList = await platformService.getPlatFormList()
  platformList.forEach(platform => {
    platform.submenus = [{ index: 1, path: 'sceneList?platformId=' + platform.id, name: '应用' }, { index: 2, path: 'signonList?platformId=' + platform.id, name: '模板' }, { index: 3, path: 'awardList?platformId=' + platform.id, name: '奖品' }]
  })
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, { list: platformList }, 'SUCCESS')
}

module.exports = {
  getPlatFormList
}
