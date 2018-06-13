/**
 * @Description：皮套笔迹-分组互动数据存储中心
 * @Author: 强峰 <fengqiang>
 * @Date:   2018-06-08 09:23
 * @Email:  fengqiang@iflyek.com
 * @Last modified by:   qiangf
 * @Last modified time: 2018-06-11 15:24
 */

const _ = require('lodash')
const logger = require('../components/logger')('penDataCenter')
const objectToArray = Symbol('objectToArray')
const resetPenDataList = Symbol('resetPenDataList')

module.exports = new class PenDataCenter {
  constructor () {
    this.groupList = {}
  }
  /**
   * 初始化学生分组信息
   * @param  {Object} groupInfo   分组信息
   * @return {Object}             以组名为键的分组对象
   */
  initPenData ({groupInfo}) {
    this[resetPenDataList]()
    try {
      if (Array.isArray(groupInfo)) {
        this.groupList = _.transform(groupInfo, function (result, item) {
          result[item['groupnum']] = _.flatMap(item.stuIds, function (userId) {
            return {userId: userId, points: []}
          })
        }, {})
      }
    } catch (e) {
      logger.error('初始化分组失败,错误信息：' + e)
    }
  }
  /**
   * 自由分组情况下，根据组号和学生对象，向分组对象中添加学生
   * @param  {String} groupNum 需要新增分组的组号
   * @param  {Object} student  学生对象
   */
  handleFreeGroup ({userid, groupnum}) {
    try {
      if (!this.groupList[groupnum] || (this.groupList[groupnum] &&
        !_.find(this.groupList[groupnum], ['userId', userid]))) {
        let penData = {userId: userid, points: []}
        this.groupList[groupnum] ? this.groupList[groupnum].push(penData)
          : this.groupList[groupnum] = Array.of(penData)
      }
    } catch (e) {
      logger.error('自由分组加入失败：' + e)
    }
  }
  /**
   * 接收笔记数据存储
   * @param  {Object} penData  userid:String, groupnum:Number, points:Array
   */
  receivePenData ({userid, groupnum, points}) {
    try {
      if (userid && groupnum && points) {
        let _student = _.find(this.groupList[groupnum], ['userId', userid])
        if (_student) {
          _student.points = _student.points.concat(points)
        }
      }
    } catch (e) {
      logger.info('接收笔记数据失败：' + e)
    }
  }
  /**
   * 根据userId获取笔记数据
   * @param  {String} paramsUserId 学生id
   * @return {Object}              学生笔记对象
   */
  getPenDataByUserId (paramsUserId) {
    return this.getAllPenData().find(({userId}) => userId === paramsUserId)
  }
  /**
   * 根据组号获取当前组下所有笔记信息
   * @param  {Number} groupNum 组号信息
   * @return {Array}           学生笔记数组
   */
  getPenDataByGoupNum (groupNum) {
    return this.groupList[groupNum] || []
  }
  /**
   * 获取笔记数据列表
   * @return {Array} 笔记对象数组
   */
  getAllPenData () {
    return this[objectToArray](this.groupList)
  }
  /**
   * 将对象转化为数组(只减少一级array嵌套深度)
   * @param  {Object} object 数组对象
   * @return {Array}         学生笔记数组
   */
  [objectToArray] (object) {
    return _(object).toArray().flatten().value()
  }
  /**
   * 清空笔记数据,释放内存
   */
  [resetPenDataList] () {
    this.groupList = {}
  }
}()
