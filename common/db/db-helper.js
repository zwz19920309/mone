require('./env')
const moment = require('moment')
const mysql = require('mysql2/promise')
const ToolUtil = require('../../common/utils/tool-util')
const DataDb = mysql.createPool({
  host: process.env['SIGN_IP'],
  user: process.env['SIGN_USER'],
  password: process.env['SIGN_PASS'],
  database: process.env['SIGN_DATABASE'],
  dateStrings: true
})
class DBHelper {
  static async getCheckInTypeList() {
    let [rows] = await DataDb.query('SELECT id, type, name FROM checkin_type')
    return rows
  }
  static async findOneCheckInType(id) {
    let [rows] = await DataDb.query('SELECT id, type, name FROM checkin_type WHERE id = ?', [id])
    return rows
  }

  static async getDateTypeList() {
    let [rows] = await DataDb.query('SELECT id, type, name FROM date_type')
    return rows
  }

  static async getDateTypeById(params) {
    let [rows] = await DataDb.query('SELECT id, type, name FROM date_type where id = ?', [params.id])
    let res = rows.length ? rows[0] : {}
    return res
  }

  static async getDateTypeByType(params) {
    let [rows] = await DataDb.query('SELECT id, type, name FROM date_type where type = ? limit 1', [params.type])
    return rows
  }

  static async getDateTypeListByTypes(typeIds) {
    let sql = 'SELECT id, type, name FROM date_type where type in (?)'
    let [rows] = await DataDb.query(sql, [typeIds])
    return rows
  }

  static async findOneDateType(id) {
    let [rows] = await DataDb.query('SELECT id, type, name FROM date_type WHERE id = ? limit 1', [id])
    return rows
  }
  static async saveDateType(type, name) {
    let [rows] = await DataDb.query('insert into date_type SET ?', [{ type, name }])
    return rows
  }

  static async deleteDateType(params) {
    let [rows] = await DataDb.query('delete from datetype where id = ?', [params.id])
    return rows
  }

  static async getSceneList(params) {
    let [rows] = await DataDb.query('SELECT id, name, note, app_id, app_secret, created_at FROM scene where platform_id = ? limit ?, ?', [params.platform_id, (params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(*) as total FROM scene')
    return { total: total[0][0].total, rows: rows }
  }

  static async findOneScene(id) {
    let [rows] = await DataDb.query('SELECT id, name, note, app_id, app_secret FROM scene WHERE id = ? limit 1', [id])
    let res = rows.length ? rows[0] : {}
    return res
  }

  static async saveScene(params) {
    let con = await DataDb.getConnection()
    let result
    try {
      await con.beginTransaction()
      let [rows] = await DataDb.query('INSERT INTO SCENE SET ?', [{ name: params.name, note: params.note, platform_id: params.platform_id }])
      result = rows
      if (result.insertId) {
        let appId = ToolUtil.randomString(20)
        let appScrect = ToolUtil.cryptoPassFunc((result.insertId + appId))
        let [res] = await DataDb.query('update scene SET ?  WHERE id = ?', [{ app_id: appId, app_secret: appScrect }, result.insertId])
        if (res.affectedRows) {
          await con.commit()
          await con.release()
        } else {
          await con.rollback()
          await con.release()
        }
      } else {
        await con.rollback()
        await con.release()
      }
    } catch (e) {
      await con.rollback()
      await con.release()
      throw e
    }
    return result
  }

  static async updateScene(params) {
    let [rows] = await DataDb.query('update scene SET ?  WHERE id = ?', [{ name: params.name, note: params.note }, params.id])
    return rows
  }

  static async bulkDeleteScene(params) {
    let [rows] = await DataDb.query('DELETE FROM SCENE WHERE id in (?)', [params.ids])
    return rows
  }

  // static async getSignonById(params) {
  //   let [rows] = await DataDb.query('SELECT * FROM signon WHERE id = ? limit 1', [params.id])
  //   let res = rows.length ? rows[0] : null
  //   return res
  // }

  static async getSignonList(params) {
    let [rows] = await DataDb.query('SELECT a.id as id, a.name as name, cycle_text, extra_text, prizes_text, b.name as checktypename, b.type as checktypetype, rule_desc,  checkintype_id  FROM signon a left join checkin_type b on (a.checkintype_id = b.id) where a.remove = 0 and a.platform_id = ? limit ?, ?', [params.platform_id, (params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(1) as total FROM signon where remove = 0')
    return { total: total[0][0].total, rows: rows }
  }

  static async getSignonListInId(params) {
    // let sql = 'SELECT a.id as id, a.name as name, cycle_text, prizes_text, b.name as checktypename, b.type as checktypetype, rule_desc,  checkintype_id  FROM signon a left join checkin_type b on a.checkintype_id = b.id  where a.id in (select distinct signon_id from scene_sign where scene_id = ?)'
    let sql = 'SELECT a.id as scene_sign_id, a.start_at start_at, a.end_at as end_at, b.id as id, b.name as name, rule_desc, cycle_text, prizes_text, extra_text, checkintype_id, c.name as checktypename from scene_sign a LEFT JOIN signon b  on b.id = a.signon_id  LEFT JOIN checkin_type c on b.checkintype_id = c.id WHERE a.scene_id = ? and b.remove = 0'
    if (params.page && params.pageSize) {
      sql += '  limit ?,?'
    }
    let [rows] = await DataDb.query(sql, [params.sceneId, (params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(1) as total from scene_sign a LEFT JOIN signon b  on b.id = a.signon_id  LEFT JOIN checkin_type c on b.checkintype_id = c.id WHERE a.scene_id = ? and b.remove = 0', [params.sceneId])
    return { total: total[0][0].total, rows: rows }
  }

  static async getSignonListNotInId(params) {
    let sql = 'SELECT a.id as id, a.name as name, cycle_text, prizes_text, b.name as checktypename, b.type as checktypetype, rule_desc,  checkintype_id  FROM signon a left join checkin_type b on a.checkintype_id = b.id  where a.id not in (select distinct  signon_id from scene_sign where scene_id = ?) and a.remove = 0 limit ?,?'
    let [rows] = await DataDb.query(sql, [params.sceneId, (params.page - 1) * params.pageSize, params.pageSize])
    return { total: rows.length, rows: rows }
  }

  static async addSignon(params) {
    let [rows] = await DataDb.query('insert into signon SET ?', [{ platform_id: params.platform_id, name: params.name, rule_desc: params.rule_desc, checkintype_id: params.checkintype_id, cycle_text: params.cycle_text, extra_text: params.extra_text }])
    return rows
  }

  static async updateSignonPrizes(params, cons) {
    let [rows] = await DataDb.query('UPDATE signon SET prizes_text = ? where id = ?', [params.prizes_text, cons.id])
    return rows
  }

  static async updateSignonConsumes(params, cons) {
    let [rows] = await DataDb.query('UPDATE signon SET extra_text = ? where id = ?', [params.extraText, cons.id])
    return rows
  }

  static async updateSignonInfo(params, cons) {
    let [rows] = await DataDb.query('UPDATE signon SET  ? where id = ?', [{ name: params.name, checkintype_id: params.checkintype_id, rule_desc: params.rule_desc, cycle_text: params.cycle_text }, cons.id])
    return rows
  }

  static async deleteSignon(params) {
    let sql = 'UPDATE signon SET remove = 1 where id in (?)'
    let [rows] = await DataDb.query(sql, [params.ids])
    return rows
  }

  static async getSignonById(params) {
    let [rows] = await DataDb.query('SELECT a.id as id, a.name as name, cycle_text, prizes_text, extra_text, b.name as checktypename, b.type as checktypetype, rule_desc, checkintype_id  FROM signon a left join checkin_type b on a.checkintype_id = b.id where a.id = ? limit 1', [params.id])
    return rows[0]
  }

  static async getPrizeList(params) {
    let [rows] = await DataDb.query('SELECT id, name, note, icon from prize where platform_id = ? limit ?, ?', [params.platform_id, (params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(1) as total FROM prize')
    return { total: total[0][0].total, rows: rows }
  }

  static async getPrizeListNotInId(prizesId) {
    let sql = 'select id, name, note, icon FROM prize where id not in (?)'
    let [rows] = await DataDb.query(sql, [prizesId])
    return { rows: rows }
  }

  static async getPrizeListInId(prizesId) {
    let sql = 'select id, name, note, icon FROM prize where id in (?)'
    let [rows] = await DataDb.query(sql, [prizesId])
    return { rows: rows }
  }

  static async savePrize(params) {
    let [rows] = await DataDb.query('insert into prize  SET ?', [{ platform_id: params.platform_id, name: params.name, note: params.note, icon: params.icon }])
    return rows
  }

  static async bulckDetelePrize(params) {
    let [rows] = await DataDb.query('delete from prize WHERE id in (?)', [params.ids])
    //  await DataDb.query('DELETE FROM scene_sign WHERE signon_id in (?) and scene_id = ?', [params.signonIds, params.sceneId])
    return rows
  }

  static async updatePrize(params, cons) {
    let [rows] = await DataDb.query('update prize SET ? where id = ?', [{ name: params.name, note: params.note, icon: params.icon }, cons.id])
    return rows
  }

  static async getPrizeById(params) {
    let [rows] = await DataDb.query('SELECT name, note, icon FROM prize where id = ?', [params.id])
    return rows[0]
  }

  static async bulkSaveSceneSign(params) {
    let [rows] = await DataDb.query('INSERT INTO scene_sign (scene_id, signon_id, start_at, end_at) VALUES ?', [params])
    return rows
  }

  static async getSceneSignById(params) {
    let [rows] = await DataDb.query('SELECT * FROM scene_sign WHERE id = ?', [params.id])
    let res = rows.length ? rows[0] : []
    return res
  }

  static async bulkDekleteSceneSign(params) {
    let [rows] = await DataDb.query('DELETE FROM scene_sign WHERE signon_id in (?) and scene_id = ?', [params.signonIds, params.sceneId])
    return rows
  }

  static async getResignFormList() {
    let [rows] = await DataDb.query('SELECT id, type, name FROM resign_form')
    return rows
  }

  static async getResignDateList() {
    let [rows] = await DataDb.query('SELECT re_date FROM resign_date')
    return rows
  }

  static async addResignDate(params) {
    let [rows] = await DataDb.query('UPDATE settings SET resign =  ? WHERE id = 1', [params.resign])
    return rows
  }
  // 'UPDATE signon SET extra_text = ? where id = ?

  static async getResignSettings(params) {
    let [rows] = await DataDb.query('SELECT resign FROM settings where id = ?', [params.id])
    let res = rows.length ? rows[0].resign : []
    return res
  }

  static async bulkSaveAwardRecord(params) {
    let [rows] = await DataDb.query('INSERT INTO award_record (uid, prize_id, scene_sign_id, created_at) VALUES ?', [params])
    return rows
  }

  static async getAwardRecordList(params) {
    let sql = 'SELECT a.id as record_id, a.uid as uid, a.number as number, a.created_at as created_at, b.name as prize_name, b.note as prize_note, c.id as scene_sign_id from award_record a ' +
      'LEFT JOIN prize b on a.prize_id = b.id LEFT JOIN scene_sign c on c.id = a.scene_sign_id'
    let [rows] = await DataDb.query((sql + ' limit ?, ?'), [(params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(1) as total from award_record')
    return { total: total[0][0].total, rows: rows }
  }

  static async bulkSaveSignRcord(params) {
    let [rows] = await DataDb.query('INSERT INTO sign_record (uid, scene_id, created_at) VALUES ?', [params])
    return rows
  }

  static async getUserSignRecord(params) {
    let [rows] = await DataDb.query('SELECT * FROM sign_record WHERE uid  = ? and scene_id = ? and created_at = ? limit 1', [params.uid, params.scene_id, params.created_at])
    let res = rows.length ? rows[0] : null
    return res
  }

  static async getYearsTodayRcord(params) {
    let [rows] = await DataDb.query('SELECT * FROM sign_record WHERE uid =? and created_at = ?', [params.uid, params.created_at])
    let res = rows.length ? rows[0] : null
    return res
  }

  static async getSumUserSignRcord(params) {
    let [rows] = await DataDb.query('SELECT count(1) as number FROM sign_record WHERE uid  = ? and scene_id = ? and created_at BETWEEN ? and ? ', [params.uid, params.scene_id, params.start_at, params.end_at])
    let res = rows.length ? rows[0].number : 0
    return res
  }

  static async getContinueSignRcord(params) {
    let [rows] = await DataDb.query('SELECT uid, first_sign_date, last_award_date FROM continue_sign WHERE scene_sign_id = ? and uid = ? ', [params.scene_sign_id, params.uid])
    let res = rows.length ? rows[0] : null
    return res
  }

  static async getContinueSignRcordByAward(params) {
    let [rows] = await DataDb.query('SELECT uid, first_sign_date, last_award_date FROM continue_sign WHERE scene_sign_id = ? and last_award_date = ? and uid = ?', [params.scene_sign_id, params.last_award_date, params.uid])
    let res = rows.length ? rows[0] : null
    return res
  }

  static async getUserAwardListBySceneId(params) {
    let [rows] = await DataDb.query('SELECT a.uid as uid , a.prize_id as prize_id , a.number as prize_number, a.scene_id as scene_id , b.name as prize_name, icon FROM user_award a LEFT JOIN prize b on a.prize_id = b.id WHERE scene_id = ? and uid = ? limit ?, ?', [params.scene_id, params.uid, (params.page - 1) * params.pageSize, params.pageSize])
    let total = await DataDb.query('SELECT count(1)  as total FROM user_award a LEFT JOIN prize b on a.prize_id = b.id WHERE scene_id = ? and uid = ? ', [params.scene_id, params.uid])
    let res = { total: total[0][0].total, rows: rows }
    return res
  }

  static async getPlatFormList(params) {
    let [rows] = await DataDb.query('SELECT id, name from platform')
    return rows
  }

  static async consumeUserAward(params) {
    let con = await DataDb.getConnection()
    let result = { flag: 1, msg: 'SUCCESS' }
    try {
      await con.beginTransaction()
      if (params.consumes && params.consumes.length) {
        for (let ele of params.consumes) {
          let [rows] = await con.query('SELECT id, uid, prize_id, number FROM user_award  WHERE uid = ? and scene_id = ? and prize_id = ? FOR UPDATE', [params.uid, params.scene_id, ele.prize])
          if (rows.length) {
            if (parseInt(ele.type) === 1) {
              let [res] = await con.query('UPDATE user_award SET number = ' + (rows[0].number + parseInt(ele.number)) + ' where id = ?', [rows[0].id])
              if (!res.changedRows) {
                result = { flag: false, msg: '修改数量失败' }
              }
            } else if (parseInt(ele.type) === 0) {
              if (rows[0].number >= ele.number) {
                let [res] = await con.query('UPDATE user_award SET number = ' + (rows[0].number - parseInt(ele.number)) + ' where id = ?', [rows[0].id])
                if (!res.changedRows) {
                  result = { flag: 0, msg: '修改数量失败' }
                }
              } else {
                result = { flag: 0, msg: '奖品数量不足' }
              }
            }
            await await con.query('INSERT INTO award_record SET ?', [{ uid: params.uid, prize_id: ele.prize, number: ele.number, scene_id: params.scene_id, type: ele.type, created_at: moment().format('YYYY-MM-DD') }])
          } else {
            result = { flag: 0, msg: '某奖品不存在' }
          }
        }
      }
      if (result && result.flag) {
        await con.commit()
        await con.release()
      } else {
        await con.rollback()
        await con.release()
      }
      return result
    } catch (e) {
      await con.rollback()
      await con.release()
      throw e
    }
  }

  static async userSignonAward(params) {
    let con = await DataDb.getConnection()
    try {
      await con.beginTransaction()
      if (params.prizes && params.prizes.length) {
        for (let ele of params.prizes) {
          console.log('ele: ', ele)
          let [rows] = await con.query('SELECT id, uid, prize_id, number FROM user_award  WHERE uid = ? and prize_id = ? and scene_id = ? FOR UPDATE', [ele[0], ele[1], ele[3]])
          if (rows.length) {
            await con.query('UPDATE user_award SET number = ' + (rows[0].number + ele[2]) + ' where id = ?', [rows[0].id])
          } else {
            await con.query('INSERT INTO user_award SET ?', [{ uid: ele[0], prize_id: ele[1], number: ele[2], scene_id: ele[3], created_at: moment().format('YYYY-MM-DD'), updated_at: moment().format('YYYY-MM-DD') }])
          }
        }
        await con.query('INSERT INTO award_record (uid, prize_id, number, scene_id, created_at, type) VALUES ?', [params.prizes])
      }
      if (params.continueDate.first_sign_date) {
        let [[total]] = await con.query('SELECT count(1) as total from continue_sign where scene_sign_id = ? and uid =?', [params.continueDate.scene_sign_id, params.continueDate.uid])
        if (total.total) {
          await con.query('UPDATE continue_sign SET first_sign_date = ? where scene_sign_id = ? and uid = ?', [params.continueDate.first_sign_date, params.continueDate.scene_sign_id, params.continueDate.uid])
        } else {
          await con.query('INSERT INTO continue_sign SET ?', [{ uid: params.continueDate.uid, scene_sign_id: params.continueDate.scene_sign_id, first_sign_date: params.continueDate.first_sign_date }])
        }
      }
      await con.query('INSERT INTO sign_record SET ?', [params.record])
      await con.commit()
      await con.release()
      return true
    } catch (e) {
      await con.rollback()
      await con.release()
      throw e
    }
  }
}

module.exports = DBHelper
