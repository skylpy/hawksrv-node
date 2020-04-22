const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const L = require('debug')('app:api');
const TimecardSchema = require('./timecard.model');
const AnnouncementSchema = require('./announcement.model');
const TaskIndexSchema = require('./taskindex.model');
const DepartmentSchema = require('./department.model');

const AttendanceIndexSchema = new mongoose.Schema({
    name: {
        type: String,
        // enum: ['迟到', '早退', '不打卡'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    penalty: {
        type: Number,
        required: true
    }
});

const VisitsetSchema = new mongoose.Schema({

    phoneMinute: {
        type: Number,
        default:3
    },
    contentCount: {
        type: Number,
        default:50
    },
    photoCount: {
        type: Number,
        default:1
    },
    summaryCount: {
        type: Number,
        default:100
    },
    needResult: {
        type: String,
        default:"需要"
    }
});

const CompanySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: (v)=>{return /^\S+$/.test(v)}
    },
    account: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
        unique: true
    },
    organization: {
        type: DepartmentSchema,
        required: true
    },
    jobType: {
        type: [String],
        default: ['经理', '职员', '总监'],
        lowercase: true
    },
    pictureType:
    {
        type: [String],
        default: ['普通拍照'],
        lowercase: true
    },
    taskType: {
        type: [String],
        default: ['临时任务', '普通任务'],
        lowercase: true
    },
    leaveType: {
        type: [String],
        default: ['年假', '病假', '婚假', '事假', '探亲假'],
        lowercase: true
    },
    intentionType: {
        type: [String],
        default: ['已成交', '有意向','无意向','新开发'],
        lowercase: true
    },
    expenseType: {
        type: [String],
        default: ['交通费', '住宿费', '餐饮费', '办公用品'],
        lowercase: true
    },
    reportType: {
        type: [String],
        default: ['日报', '周报', '月报'],
        lowercase: true,
    },
    clientType: {
        type: [String],
        default: ['临时客户', '长期客户'],
        lowercase: true
    },
    clientGrade: {
        type: [String],
        default: ['A级客户', 'B级客户','C级客户','D级客户'],
        lowercase: true
    },
    regions: {
        type: Map,
        default: {
            id: "0",
            name: '全国',
            children: []
        }
    },
    initScore:{
        type:Number,
        default: 6000
    },
    timeCards: {
        type:[TimecardSchema]
    },
    announces: [AnnouncementSchema],
    taskIndexes: [TaskIndexSchema],
    attendanceIndexes: [AttendanceIndexSchema],
    holidays: [String],
    //拜访设置
    visitset: {
        type: VisitsetSchema,
        default:Object
    },
    // 文件管理
    contracts: {
        type: Map,
        require: true
    },
    financialdocs: {
        type: Map,
        require: true
    },
    region:{
        type:Object
    },
    invitationCode:{
        type:String
    },
    balance: {
        type: Number,
        default: 0
    },
    reportItemTemplates: {
        type: Array,
        default: []
    },
    financeSetting:{
        type: Map,
        default: {}
    }
}, {
    timestamps: true
});

CompanySchema.statics.removeOutdatedAnnounce = function() {
    this.updateMany({}, {
        $pull: { announces: { deadline: { $lt: new Date()}}}
    }, function(err, c) {
        if (err) L(err);
    });

};

CompanySchema.statics.onUserChange = function(profile) {
    let companyId = profile.companyId;
    let uId = profile._id;

    if (!companyId || !uId) return;
    let self = this;

    self.findById(companyId, async function(err, c) {
        if (err) { L(err); return; }

        let company = c.toObject();

        if (profile.department) {
            // update organization setting
            let organization = company.organization;

            let departments = (function listD(d) {
                return d.sub.slice(0).concat(d.sub.reduce((accum, s) => { return accum.concat(listD(s)) }, []));
            })(organization);

            let belongs = profile.department;
            let set_admin = profile.departmentadmin;

            departments.forEach(d => {
                if (belongs.includes(d.departmentId)) {
                    if (!d.employees.includes(uId)) d.employees.push(uId);

                    if (typeof set_admin == 'boolean') {
                        if (set_admin && !d.admin.includes(uId)) d.admin.push(uId);
                        if (!set_admin && d.admin.includes(uId)) d.admin.splice(d.admin.findIndex(id => id == uId), 1);
                    }
                }

                if (!belongs.includes(d.departmentId)) {
                    if (d.employees.includes(uId)) d.employees.splice(d.employees.findIndex(id => id == uId), 1);
                    if (d.admin.includes(uId)) d.admin.splice(d.admin.findIndex(id => id == uId), 1);
                }

            });
            if (!belongs.includes(organization.departmentId)){
                let index = organization.employees.findIndex(id => id.toString() == uId)
                if (index >= 0) {
                    organization.employees.splice(index, 1);
                }
                index = organization.admin.findIndex(id => id.toString() == uId)
                if (index >= 0) {
                    organization.admin.splice(index, 1)}
            }
            // update DB
            await self.findByIdAndUpdate(companyId, { organization }, function(err, c) {
                if (err) L(err);
            })
        }

        if (profile.timeCardId) {
            // update timecard setting
            let timeCardId = profile.timeCardId;
            let timeCards = company.timeCards;

            timeCards.forEach(tc => {
                if (!tc.owners.filter(id=>id.toString()==uId).length > 0  && tc._id == timeCardId) {
                    tc.owners.push(uId);
                }
                if (tc.owners.filter(id=>id.toString()==uId).length > 0 && tc._id != timeCardId) {
                    tc.owners.splice(tc.owners.findIndex(o => o.toString() == uId), 1);
                }
            });

            // update DB
            await self.findByIdAndUpdate(companyId, { timeCards }, function(err, c) {
                if (err) L(err);
            })
        }

        if (profile.changeSuperAdmin) {
            let organization = company.organization;
            organization.admin = [uId];
            // update DB
            await self.findByIdAndUpdate(companyId, { organization }, function(err, c) {
                if (err) L(err);
            })
        }
    })
}

CompanySchema.statics.deleteUser = function(profile) {
    let companyId = profile.companyId;
    if (!companyId) return;

    let self = this;
    self.findById(companyId, async function(err, c) {
        if (err) { L(err); return; }

        let company = c.toObject();
        let organization = company.organization;
        const listD = function(d) {
            return d && d.sub && d.sub.slice(0).concat(d.sub.reduce((accum, s) => { return accum.concat(listD(s))}, [])) || [];
        }
        const deleteU = (org, uId) => {
            let dList = listD(org).filter(d => d.employees.includes(uId));
            let aIndex = dList[0].admin.indexOf(uId)
            let eIndex = dList[0].employees.indexOf(uId)
            if (aIndex > -1) dList[0].admin.splice(aIndex, 1)
            if (eIndex > -1) dList[0].employees.splice(eIndex, 1)
            organization = org
        }

        if (profile.deleteUser instanceof Array) {
            profile.deleteUser.map(async (v) => {
                await deleteU(organization, v)
            })

        } else {
            deleteU(organization, profile.deleteUser)
        }
        // update DB
        await self.findByIdAndUpdate(companyId, { organization }, function(err, c) {
            if (err) L(err);
        })
    })
}

CompanySchema.methods.isHoliday = function(date/*e.g. 2010-10-10 */) {
    if (!this.holidays) return false;
    return this.holidays.includes(date);
}

module.exports = mongoose.model('Company', CompanySchema);
