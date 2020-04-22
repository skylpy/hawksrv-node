const xlsx = require('node-xlsx');
const { getUsersByID } = require('./util');

module.exports = {
  query
};

async function query(res, data){
  let table = [['日期','时间','打卡人','打卡类型','打卡地点']];
  if(data && data.length) {
    for(const item of data) {
      if(item.records && item.records.length){
        for (const rd of item.records) {
          let location = rd.location, address = ''
          if(location && location.get('address')) address = location.get('address')
          table.push([item.date, rd.time, item.userId, rd.type, address])
        }
      }
    }
  }
  
  if (table.length > 1) {
    const users = await getUsersByID( table.slice(1).map(item => item[2]))
    
    table.forEach(item => {
      if(users[item[2]]) item[2] = users[item[2]].name
    })

  }

  const buffer = xlsx.build([{name: "sheet1", data: table}]);
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .set('Content-Disposition', 'attachment; filename=timeRecord'+ new Date().toHawkDateString()  +'.xlsx')
    .status(200)
    .end(buffer);
  return buffer;
}