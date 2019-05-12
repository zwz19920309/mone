const DBHelper = require('../../common/db/db-helper')
/**
  * 获取日期类型列表
  * @method getPlatFormList
  * @param  {object} params - 参数
  * @return {object}
 */
const getPlatFormList = async (params) => {
  let platFormList = await DBHelper.getPlatFormList()
  return platFormList
}
/**
  * 增加平台
  * @method addPrize
  * @param  {object} params -奖品参数
  * @return {object} 增加结果
 */
const addPlatForm = async (params) => {
  let result = await DBHelper.savePrize(params)
  return result
}

/**
  * 获取日期类型列表
  * @method getPlatFormList
  * @param  {object} params - 参数
  * @return {object}
 */
const getPlatFormById = async (params) => {
  let platFormList = await DBHelper.getPlatFormById(params)
  return platFormList
}

module.exports = {
  getPlatFormList,
  getPlatFormById,
  addPlatForm
}
