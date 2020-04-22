const config = require('config');
const User = require('./user.model');
const Company = require('@company/company.model');

const errors = require('@lib/errors');
const L = require('debug')('app:api');

let listD = function (d) {
    return d.sub.slice(0).concat(d.sub.reduce((accum, s) => {
        return accum.concat(listD(s))
    }, []));
}

async function getCompanyById(cid) {
    let c = await Company.findById(cid, '-__v');
    return c;
}

async function getUserById(uid) {
    let u = await User.findById(uid, '-__v');
    return u;
}

/**
 * 获取用户部门
 * @param uid
 * @returns {Promise<null>}
 */
async function userDepartment(uid) {
    let user = await getUserById(uid);
    let company = await getCompanyById(user.companyId);
    let dList = listD(company.organization).filter(d => d.employees.includes(uid.toString()));
    return dList.length > 0 ? dList[0] : null;
}

/**
 * 获取直属员工
 * @param uid
 * @returns {Promise<void>}
 */
async function directlyUsers(uid) {
    let user = await getUserById(uid);
    var userList = [];
    let IamDepartmentAdmin = await isDepartmentAdmin(uid);
    if (user.superadmin) {
        let company = await getCompanyById(user.companyId);
        let departments = company.organization.sub;
        for (let i = 0; i < departments.length; i++) {
            userList = userList.concat(departments[i].admin)
        }
    } else if (IamDepartmentAdmin) {
        let department = await userDepartment(uid.toString());
        //.filter(id => !department.admin.includes(id))
        userList = department.employees;
        for (let i = 0; i < department.sub.length; i++) {
            if (department.sub[i].admin.length) {
                userList = userList.concat(department.sub[i].admin)
            } else {
                userList = userList.concat(department.sub[i].employees)
            }
        }
    }
    return userList.filter(u => u.toString() != uid);

}

/**
 * 获取直属上级
 * @returns {Promise<void>}
 */
async function getSuperior(){
    let user = await getUserById(uid);
    var userList = [];
    let IamDepartmentAdmin = await isDepartmentAdmin(uid);
    if (user.superadmin) {
       return
    } else if (IamDepartmentAdmin) {
        let department = await userDepartment(uid.toString());
        //.filter(id => !department.admin.includes(id))
        userList = department.employees;
        for (let i = 0; i < department.sub.length; i++) {
            userList = userList.concat(department.sub[i].admin)
        }
    }

}

async function isDepartmentAdmin(uid) {
    let user = await getUserById(uid);
    let company = await getCompanyById(user.companyId);
    let dList = listD(company.organization).filter(d => d.admin.includes(uid));
    return dList.length > 0 ? true : false;
}

async function getDepartment(cid, did) {
    let company = await getCompanyById(cid);
    let dList = listD(company.organization).filter(d => d.departmentId == did);
    return dList.length > 0 ? dList[0] : null;
}

/**
 * 获取上一级部门
 * @param uid
 * @returns {Promise<null>}
 */
async function getSuperiorDepartment(cid, uid, organization) {
    if (!organization) organization = await getCompanyById(cid).organization
    let sList = listD(organization).concat(organization).filter(d => d.sub.filter(sd => sd.employees.filter(u => u == uid).length).length);
    return sList.length > 0 ? sList[0] : null;
}

/**
 * 获取所有上一级部门
 * @param uid
 * @returns {Promise<null>}
 */

async function getSuperiorDepartments(cid, uid) {
    let company = await getCompanyById(cid)
    let chan

    function dir(department, i, tmp) {
        if (chan) return
        tmp[i] = department
        // 找当前
        if (department.employees.filter(u => u == uid).length) {
            chan = tmp.splice(0, i + 1)
            return
        }
        // 找级
        if (department.sub.length) {
            department.sub.forEach(d => {
                return dir(d, i+1, tmp)
            })
        }
    }

    dir(company.organization, 0, [])
    return chan || []
}

module.exports = {
    userDepartment,
    departmentToList: listD,
    directlyUsers,
    getDepartment,
    getSuperiorDepartment,
    getSuperiorDepartments
};
