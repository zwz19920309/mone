const HttpResult = require('../../common/http/http-result')
const resignDateService = require('../../services/admin/resigndate-service')

// 获取补签默认配置日期
const getResignDateList = async (ctx) => {
  let resignDateList = await resignDateService.getResignDateList()
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, { list: resignDateList }, 'SUCCESS')
}

// 修改补签默认配置日期
const addResignDate = async (ctx) => {
  let { resignDates } = ctx.request.body
  if (!resignDates) {
    return (ctx.body = HttpResult.response(HttpResult.HttpStatus.ERROR_PARAMS, null, '参数resignDates缺失'))
  }
  let resignDateList = await resignDateService.addResignDate({ resign: JSON.stringify(resignDates) })
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, { list: resignDateList }, 'SUCCESS')
}

module.exports = {
  getResignDateList,
  addResignDate
}
