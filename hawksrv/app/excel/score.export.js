const xlsx = require('node-xlsx')
const { getUsersByID } = require('./util')

module.exports = {
  query
}

function getValueType(type){
  switch (type) {
    case 'add':
      return '加分'
    case 'sub':
      return '扣分'
    default:
      return ''
  }
}

async function query(user, res, data) {
  let table = [ ['考核对象','考核日期','考核类型','考核类别','加/减','分数','状态','详情' ] ];

  if (data && data.length) {
    const users = await getUsersByID(user)
    for (const item of data) {
      let row = []
      row.push(users[item.user] ? users[item.user].name : '')
      row.push(new Date(item.at).toHawkDateString())
      row.push(item.type)
      row.push(item.category)
      row.push(getValueType(item.rule.valueType))
      row.push(item.score)
      row.push(item.status || '')
      row.push(item.detail || '')
      table.push(row)
    }
  }

  const buffer = xlsx.build([{ name: 'sheet1', data: table }])
  res
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .set(
      'Content-Disposition',
      'attachment; filename=score' + new Date().toHawkDateString() + '.xlsx'
    )
    .status(200)
    .end(buffer)
  return buffer
}
