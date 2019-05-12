const ToolUtil = require('../../common/utils/tool-util')
const FileUtil = require('../../common/utils/file-util')
const HttpResult = require('../../common/http/http-result')
const prizeService = require('../../services/admin/prize-service')

// 获取奖品类表
const getPrizeList = async (ctx) => {
  let { page, pageSize, pid } = ctx.request.body
  if (!pid) {
    return (ctx.body = HttpResult.response(HttpResult.HttpStatus.ERROR_PARAMS, null, '参数缺失'))
  }
  let { total, rows } = await prizeService.getPrizeList({ page: page, pageSize: pageSize, platform_id: pid })
  ToolUtil.prefixImgUrl(rows)
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, { list: rows, total: total }, 'SUCCESS')
}

// 增加奖品
const addPrize = async (ctx) => {
  let { note, name, pid } = ctx.request.body
  if (!pid || !note || !name) {
    return (ctx.body = HttpResult.response(HttpResult.HttpStatus.ERROR_PARAMS, null, '参数缺失'))
  }
  let files = ctx.request.files
  let iconPath = await FileUtil.moveFileToTarget(files, 'icon', 'prizes')
  let prize = await prizeService.addPrize({ name: name, note: note, icon: iconPath, platform_id: pid })
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, prize, 'SUCCESS')
}

// 修改奖品
const updatePrize = async (ctx) => {
  let { note, name, id } = ctx.request.body
  let files = ctx.request.files
  let prize = await prizeService.getPrizeById({ id: id })
  let iconPath
  if (files['icon']) {
    iconPath = await FileUtil.moveFileToTarget(files, 'icon', 'prizes')
  }
  let res = await prizeService.updatePrize({ name: name || prize.name, note: note || prize.note, icon: iconPath || prize.icon }, { id: id })
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, res, 'SUCCESS')
}

// 批量删除奖品
const bulkDeletePrize = async (ctx) => {
  let { ids } = ctx.request.body
  let result = await prizeService.bulkDeletePrize({ ids: ids })
  ctx.body = HttpResult.response(HttpResult.HttpStatus.SUCCESS, { res: result }, 'SUCCESS')
}

module.exports = {
  getPrizeList,
  addPrize,
  bulkDeletePrize,
  updatePrize
}
