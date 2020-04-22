const xlsx = require('node-xlsx')
const { getCompanyUsers } = require('./util')

module.exports = {
  query
}

const CODE_TYPES = [
  { name: '全部', code: '*' },
  { name: '全部收入', code: 'S' },
  { name: '全部支出', code: 'Z' },
  { name: '应收账款', code: 'YS' },
  { name: '应付账款', code: 'YF' },
  { name: '固定支出', code: 'GZ' }
]

function typeName(codeType) {
  const arr = CODE_TYPES.filter(item => item.code === codeType)
  if (arr.length) {
    return arr[0].name
  } else {
    return ''
  }
}

async function query(companyId, res, data) {
  let table = [ [
    '编号', '金额', '记帐方式', '单价', '数量', '凭证字', '凭证号', '类别', '业务日期',
    '往来业务', '关键词', '商家', '摘要（用途）', '科目', '账单类型',
    '经办人', '制表人', '审核人', '审批人', '出纳人', '状态'
  ] ];

  if (data && data.length) {
    const users = await getCompanyUsers(companyId)
    for (const item of data) {
      let row = []
      row.push(item.code)
      row.push(item.amount)
      row.push(item.payment)
      row.push(item.price)
      row.push(item.quantity)
      row.push(item.docWord)
      row.push(item.docNumber)
      row.push(item.category)
      row.push(new Date(item.date).toHawkDateString())

      // row.push(item.updatedAt && new Date(item.updatedAt).toHawkDateString())
      row.push(item.business)
      row.push(item.keyword)
      row.push(item.merchant)
      row.push(item.summary)
      row.push(item.subject)
      row.push(typeName(item.codeType))

      row.push(users[item.agent] ? users[item.agent].name : '')
      row.push(users[item.lister] ? users[item.lister].name : '')
      row.push(users[item.reviewer] ? users[item.reviewer].name : '')
      row.push(users[item.approver] ? users[item.approver].name : '')
      row.push(users[item.bookkeeper] ? users[item.bookkeeper].name : '')
      row.push(item.status)

      table.push(row)
    }
  }

  const buffer = xlsx.build([{ name: 'sheet1', data: table }])
  res
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .set(
      'Content-Disposition',
      'attachment; filename=finance' + new Date().toHawkDateString() + '.xlsx'
    )
    .status(200)
    .end(buffer)
  return buffer
}
