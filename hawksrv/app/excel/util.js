const User = require('../api/user/user.model')
const Company = require('../api/company/company.model')

module.exports = {
  getUsersByID,
  getCompanyUsers,
  getCompanyById
}

async function getCompanyById(cid) {
  let c = await Company.findById(cid, '-__v');
  return c;
}

async function getCompanyUsers(cid) {
  return getUsersByFilter({ companyId: cid })
}

async function getUsersByID(ids) {
  return getUsersByFilter({ _id: { $in: ids }})
}

async function getUsersByFilter(filters) {
  const users = {}
  let list = await User.find(
    filters,
    {
      _id: 1,
      name: 1,
      gender: 1,
      phone: 1,
      email: 1,
      avatar: 1,
      job: 1,
      workNumber: 1,
      superadmin: 1,
      salary: 1,
      isDelete: 1
    }
  )

  for (const user of list) {
    users[user._id] = user
  }

  return users
}
