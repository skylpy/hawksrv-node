const xlsx = require('node-xlsx')
const { getCompanyUsers } = require('./util')

module.exports = {
  leave,
  overtime,
  travel
}

async function query(companyId, res, data, cb) {
  let table = [];
  if (data && data.length) {
    const users = await getCompanyUsers(companyId)
    table = cb(data, users)
  }

  const buffer = xlsx.build([{ name: 'sheet1', data: table }])
  res
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .set( 'Content-Disposition', 'attachment; filename=appllication' + new Date().toHawkDateString() + '.xlsx' )
    .status(200)
    .end(buffer)
  return buffer
}

async function leave(companyId, res, data) {
  return query(companyId, res, data, (data, users) => {
    let table = [['申请人','申请时间','类型','开始时间','结束时间','请假原因','状态','审批人','批注']];
    table.push()
    for (const item of data) {
      let row = [];
      // 注意content映射过来是个Map
      let content = item.content ? item.content : {};
      row.push(users[item.applicant].name);
      row.push(new Date(item.createdAt).toHawkString());
      row.push(content.get('leaveType') || '');
      row.push(new Date(content.get('startTime')).toHawkString());
      row.push(new Date(content.get('endTime')).toHawkString());
      row.push(content.get('manifesto') || '');
      row.push(item.status || '');
      row.push(users[item.approver].name);
      row.push(content.get('manifesto') || '');
      table.push(row);
    }
    return table;
  })
}
async function overtime(companyId, res, data) {
  return query(companyId, res, data, (data, users) => {
    let table = [['申请人','申请时间'	,'开始时间'	,'结束时间'	,'加班原因','状态','审批人','批注']];
    for (const item of data) {
      let row = [];
      // 注意content映射过来是个Map
      let content = item.content ? item.content : {};
      row.push(users[item.applicant].name);
      row.push(new Date(item.createdAt).toHawkString());
      row.push(new Date(content.get('startTime')).toHawkString());
      row.push(new Date(content.get('endTime')).toHawkString());
      row.push(content.get('manifesto') || '');
      row.push(item.status || '');
      row.push(users[item.approver].name);
      row.push(content.get('manifesto') || '');
      table.push(row);
    }
    return table;
  })
}
async function travel(companyId, res, data) {
  return query(companyId, res, data, (data, users) => {
    let table = [['申请人','申请时间'	,'开始时间'	,'结束时间'	,'始发地'	,'目的地'	,'出差费用'	,'出差原因','状态','审批人','批注']];
    for (const item of data) {
      let row = [];
      // 注意content映射过来是个Map
      let content = item.content ? item.content : {};
      row.push(users[item.applicant].name);
      row.push(new Date(item.createdAt).toHawkString());
      row.push(new Date(content.get('startTime')).toHawkString());
      row.push(new Date(content.get('endTime')).toHawkString());
      let from = content.get('from'), to = content.get('to')
      row.push(from && (from.district + ' ' + from.name)  || '');
      row.push(to && (to.district + ' ' + to.name)  || '');
      row.push(content.get('expense') || '');
      row.push(content.get('manifesto') || '');
      row.push(item.status || '');
      row.push(users[item.approver].name);
      row.push(content.get('manifesto') || '');
      table.push(row);
    }
    return table;
  })
}
