const xlsx = require('node-xlsx')
const { getCompanyUsers, getCompanyById } = require('./util')

module.exports = {
  query
}

let listD = d =>
  d.sub.slice(0).concat(d.sub.reduce((accum, s) => accum.concat(listD(s)), []))

let listR = d =>
  d.children.slice(0).concat(d.children.reduce((accum, s) => accum.concat(listR(s)), []))

async function query(filters, res, data) {
  let table = [
    [
      '名称', '归属人','归属部门','私有属性', '资料分类', '类型', '等级', '区域', '意向', 
      '地址', '补充地址', '备注', '联系人姓名', '联系人手机号', '联系人性别', '联系人部门', '联系人职务', 
      '联系人电子邮箱', '联系人微信', '联系人QQ号', '联系人电话', '联系人传真', '联系人生日', '联系人备注',
    ]
  ]

  if (data && data.length) {
    const users = await getCompanyUsers(filters.companyId)
    let userDepartment

    const company = await getCompanyById(filters.companyId)
    const departments = {}
    for (const d of listD(company.organization)) {
      departments[d.departmentId] = d
      if (!userDepartment && d.employees.includes[filters.userId]) {
        userDepartment = d.departmentId
      }
    }
    let regionObj = {
      name:company.regions.get('name'),
      children:company.regions.get('children')
    }
    const regions = {}

    for (const r of listR(regionObj)) {
      regions[r.id] = r
    }

    const admins = userDepartment && userDepartment.admin ? userDepartment.admin : []

    // 过滤表格
    data = data.filter(item =>
      itemFilter({
        v: item,
        userId: filters.userId,
        classify: filters.classify,
        downType: filters.downType,
        admins
      })
    )

    for (const item of data) {
      let row = []
      row.push(item.name)
      row.push(users[item.manager] ? users[item.manager].name : '')
      row.push(departments[item.department] ? departments[item.department].name : '')
      row.push(item.private ? '私有' : '公有')
      row.push(item.classify)
      row.push(item.type)
      row.push(item.grade)
      row.push(regions[item.region] ? regions[item.region].name : '')
      row.push(item.intention)
      let location = item.location
      row.push((location && location.name) || '')
      row.push((location && location.text) || '')
      row.push(item.notes)

      let contact = item.contacts && item.contacts[0]

      if (contact) {
        row.push(contact.name)
        row.push(contact.phone)
        row.push(contact.gender)
        row.push(contact.department)
        row.push(contact.title)
        row.push(contact.email)
        row.push(contact.wechat)
        row.push(contact.qq)
        row.push(contact.tel)
        row.push(contact.fax)
        row.push(contact.birthday)
        row.push(contact.notes)
      }

      table.push(row)
    }
  }

  const buffer = xlsx.build([{ name: 'sheet1', data: table }])
  res
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .set( 'Content-Disposition', 'attachment; filename=client' + new Date().toHawkDateString() + '.xlsx' )
    .status(200)
    .end(buffer)
  return buffer
}

function itemFilter({ v, userId, classify, downType, admins }) {
  // classify.includes 字符串包含检测
  let flag = true
  if (classify === '下属') {
    flag = flag && !!v.private

    if (downType === '下属客户') {
      flag = flag && v.classify.includes('客户')
    } else if (downType === '下属商家') {
      flag = flag && v.classify.includes('商家')
    }

    if (flag) {
      flag = flag && v.manager !== userId
    }

    if (flag) {
      flag = flag && !admins.includes(v.manager)
    }
  } else {
    if (downType.includes('我的')) {
      flag = flag && !!v.private
    } else if (downType.includes('部门')) {
      flag = flag && !v.private
    }

    if (flag) {
      flag = flag && v.classify.includes(classify)
    }
  }

  return flag
}
