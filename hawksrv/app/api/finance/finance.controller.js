const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Transaction = require('./transaction.model');
const User = require('../user/user.model');
const pushMsg = require('@notification/notification.controller').pushMsg;
const mongoose = require('mongoose');
const Company = require('@company/company.model');
const moment = require('moment');
const excel = require('../../excel/finance.export');
moment.locale('zh-cn');
module.exports = {
    query,
    update,
    setBalance,
    add,
    info,
    audit
};

const filteringItems = '-__v -updatedAt';

async function add(req, res, next) {
    L('Calling API finance.add', req.body);

    let trans = req.body;
    delete trans._id;
    trans.companyId = req.user.cid;

    try {
        if (/^[a-z]+$/i.test(trans.code) == false) {
            throw new Error('invalid code for finance.add');
        }

        if (!trans.date) {
            throw new Error('invalid date for finance.add');
        }

        let lastRecord = await Transaction.findOne({
            companyId: req.user.cid,
            code: {$regex: '^' + trans.code, $options: 'i'},
            date: trans.date
        }).sort({$natural: -1}).limit(1);

        let index = 0;

        if (lastRecord) {
            let lastCode = lastRecord.code;
            let lastIndex = parseInt(lastCode.slice(((trans.code) + 'yyyymmdd').length));
            index = lastIndex + 1;
        }

        if (trans.code && !trans.codeType) trans.codeType = trans.code
        if (!trans.code && trans.codeType) trans.code = trans.codeType
        if (!trans.code) trans.code = ''

        trans.code += trans.date.replace(/-/g, '');
        trans.code += (index < 10 ? '0' : '') + index;
        if ('' == trans.status) {
            delete trans.status
        }


        let newT = await Transaction.create(trans);
        if (newT.status == '已完成') setBalance(trans.companyId);
        // pushMsg({
        //     applyId: newT._id,
        //     userId: trans.approver,
        //     category: trans.category,
        //     content: trans.summary,
        //     title: trans.category + "提醒通知"
        // });
        jpush(newT)
        res.status(200).json(newT);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API finance.update', req.body);

    let tId = req.params.id;

    if (!tId) {
        next(new errors.BadRequest('invalid transaction id'));
        return;
    }

    try {
        let trans = req.body;
        delete trans._id;
        trans.companyId = req.user.cid;

        let t = await Transaction.findById(tId);
        let pstatus = t['status'];

        t = await Transaction.findByIdAndUpdate(tId, trans, {new: true});
        if ((t.status == '已完成' && pstatus != "已完成") || (t.status != '已完成' && pstatus == "已完成")) {
            setBalance(trans.companyId)
        }

        res.status(200).json(t);
        jpush(t)

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function jpush(t) {
    let allStatus = {
        '审核驳回': [
            {
                role: '制表人',
                user: t.lister,
                msg: '您有一笔账款' + t.code + '被{name}驳回' + (t.objection ? ('，理由：' + t.objection) : ''),
                nameById: t.reviewer
            },
        ],
        '审批驳回': [
            {
                role: '制表人',
                user: t.lister,
                msg: '您有一笔账款' + t.code + '被{name}驳回' + (t.objection ? ('，理由：' + t.objection) : ''),
                nameById: t.approver
            },
        ],
        '收付驳回': [
            {
                role: '制表人',
                user: t.lister,
                msg: '您有一笔账款' + t.code + '被{name}驳回' + (t.objection ? ('，理由：' + t.objection) : ''),
                nameById: t.bookkeeper
            },
        ],
        '撤回中': [],
        '待审核': [
            {role: '审核人', user: t.reviewer, msg: '您有一笔账款' + t.code + '需要审核'},
        ],
        '已审核': [
            {role: '制表人', user: t.lister, msg: '您提交的账款' + t.code + '通过{name}审核', nameById: t.reviewer},
            {role: '审批人', user: t.approver, msg: '您有一笔账款' + t.code + '需要审批'},
        ],
        '已审批': [
            {role: '制表人', user: t.lister, msg: '您提交的账款' + t.code + '通过{name}审批', nameById: t.approver},
            {role: '出纳人', user: t.bookkeeper, msg: '您有一笔账款' + t.code + '需要确认收付款'},
        ],
        '收付款': [
            {role: '出纳人', user: t.bookkeeper, msg: '您有一笔账款' + t.code + '需要确认收付款'},
        ],
        '已完成': [
            {role: '制表人', user: t.lister, msg: '您提交的账款' + t.code + '已处理完成'},
        ]
    }
    for (let key in allStatus) {
        if (t.status == key) {
            allStatus[key].forEach(async jpushData => {
                if (jpushData.nameById) {
                    const u = await User.findById(jpushData.nameById)
                    jpushData.msg = jpushData.msg.replace('{name}', u.name)
                }
                pushMsg({
                    applyId: t._id,
                    userId: jpushData.user,
                    category: '财务审批',
                    content: jpushData.msg,
                    title: "财务审批"
                });
            })
        }
    }
}

async function setBalance(companyId) {
    if (!companyId) return;
    let date = moment().format("YYYY-MM-DD");
    let ocid = mongoose.Types.ObjectId(companyId);
    let sarray = await Transaction.aggregate([
        {$match: {code: {$regex: /^(S|YS)/}, companyId: ocid, date: {$lte: date}, status: '已完成'}},
        {$group: {_id: "$companyId", sum: {$sum: "$amount"}}}
    ]);
    let samount = 0;
    if (sarray && sarray.length > 0) {
        samount = sarray[0].sum;
    }
    let zarray = await Transaction.aggregate([
        {$match: {code: {$regex: /^(Z|YF|GZ)/, $not: /^ZD/}, companyId: ocid, date: {$lte: date}, status: '已完成'}},
        {$group: {_id: "$companyId", sum: {$sum: "$amount"}}}
    ]);
    let zamount = 0;
    if (zarray && zarray.length > 0) {
        zamount = zarray[0].sum;
    }
    let balance = samount - zamount;
    Company.findById(companyId, (err, company) => {
        if (err) {
            L(err);
            return;
        }


        Company.findByIdAndUpdate(companyId, {balance}, (err, c) => {
            if (err) L(err);
        })
    });
    return balance;
}

async function query(req, res, next) {
    L('Calling API finance.query', req.query);

    try {
        let filters = JSON.parse(req.query.q);
        let codeType = filters.code;
        let pageInfo = req.query.p ? JSON.parse(req.query.p) : false

        if (!filters) {
            next(new Error('invalid query string for finance.query'));
            return;
        }

        for (let key in filters) {
            if (filters[key] == null) delete filters[key]
        }

        // switch these fields to fuzzy search
        ['code', 'business', 'keyword', 'summary', 'subject'].forEach(k => {
            if (filters[k]) {
                let v = filters[k];
                filters[k] = {$regex: v};
            }
        })
        if (filters.code) {
            if (codeType == 'Z') {
                filters.code = {$regex: /^(Z|YF|GZ)/};
            }
            if (codeType == 'S') {
                filters.code = {$regex: /^(S|YS)/};
            }
        }
        // query time range
        if (typeof filters.date == 'object' && filters.date.from) {
            let range = filters.date;
            let start = new Date(range.from), end = new Date(range.to);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            end.setHours(23);
            end.setMinutes(59);
            end.setSeconds(59);
            end.setMilliseconds(999);
            filters.date = {
                $gte: start.toHawkDateString()
            };
            if (range.to) filters.date['$lte'] = end.toHawkDateString();
        }

        // code match
        if (filters.code && /^[a-z]+$/i.test(filters.code)) {
            let code = filters.code;
            filters.code = {$regex: '^' + code, $options: 'i'};
        }
        // codeType match
        if (filters.codeType && filters.codeType.split('|').length >= 2) {
            let codeTypes = filters.codeType.split('|');
            filters.codeType = {$in: codeTypes};
        }

        filters.companyId = req.user.cid;

        // 是否分页查询
        if (pageInfo && pageInfo.page) {
            let limit = pageInfo.limit || 10;
            let count = await Transaction.find(filters, filteringItems).sort({createdAt: -1}).count();
            let list = await Transaction.find(filters, filteringItems)
                .sort({createdAt: -1})
                .limit(limit)
                .skip(limit * (pageInfo.page - 1));
            let result = {
                list: list,
                count,
                page: pageInfo.page,
                totalpage: Math.ceil(count / limit)
            }
            if (pageInfo.page == 1 && pageInfo.code) {
                let amount = await Transaction.find(filters, filteringItems, {amount: 1, by: 1}).sort({createdAt: -1});
                result.amount = amount.reduce((accum, r) => {
                    let types = ['Z', 'YF', 'GZ', 'S', 'YS'];
                    if (codeType == 'Z') types = ['Z', 'YF', 'GZ'];
                    if (codeType == 'S') types = ['S', 'YS'];
                    return accum + (types.find(t => r.code.startsWith(t)) ? r.amount : 0)
                }, 0)
            }
            res.status(200).json(result);
        } else {
            // excel 下载
            // 下载不用分页
            let result = await Transaction.find(filters, filteringItems).sort({createdAt: -1});

            if (req.get('download-excel')) {
                excel.query(filters.companyId, res, result)
            } else {
                res.status(200).json(result);
            }
        }
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function audit(req, res, next) {
    L('Calling API finance.audit', req.query);
    try {
        let q = JSON.parse(req.query.q)
        let p = JSON.parse(req.query.p)
        let uid = req.user.sub
        let companyId = req.user.cid
        let filters = {companyId}

        if (q.type == 'all') {

        } else if (q.type == 'audit_un') {
            filters.$or = [
                {$and: [{reviewer: uid}, {status: '待审核'}]},
                {$and: [{approver: uid}, {status: '已审核'}]},
                {$and: [{bookkeeper: uid}, {status: '已审批'}]}
            ]
        } else if (q.type == 'audit_ok') {
            filters.$or = [
                {$and: [{reviewer: uid}, {status: {$in:['已审核','审核驳回','已审批','审批驳回','已完成','收付驳回']}}]},
                {$and: [{approver: uid}, {status: {$in:['已审批','审批驳回','已完成','收付驳回']}}]},
                {$and: [{bookkeeper: uid}, {status: {$in:['已完成','收付驳回']}}]}
            ]
        } else if (q.type == 'my_un') {
            filters.lister = uid
            filters.status = {$ne:'已完成'}
        } else if (q.type == 'my_ok') {
            filters.lister = uid
            filters.status = '已完成'
        } else {
            res.status(200).json([]);
        }
        let limit = p.limit || 10;
        let count = await Transaction.find(filters, filteringItems).sort({createdAt: -1}).count();
        let list = await Transaction.find(filters, filteringItems).sort({createdAt: -1}).limit(limit).skip(limit * (p.page - 1));
        let result = {
            list: list,
            count,
            page: p.page,
            totalpage: Math.ceil(count / limit)
        }
        res.status(200).json(result);
    } catch (e) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function info(req, res, next) {
    try {
        L('Calling API finance.info');
        let date = moment().format("YYYY-MM-DD");
        let ocid = mongoose.Types.ObjectId(req.user.cid);
        let sarray = await Transaction.aggregate([
            {$match: {code: {$regex: /^(S|YS)/}, companyId: ocid, date: date, status: '已完成'}},
            {$group: {_id: "$companyId", sum: {$sum: "$amount"}}}
        ]);
        let samount = 0;
        if (sarray && sarray.length > 0) {
            samount = sarray[0].sum;
        }
        let zarray = await Transaction.aggregate([
            {$match: {code: {$regex: /^(Z|YF|GZ)/, $not: /^ZD/}, companyId: ocid, date: date, status: '已完成'}},
            {$group: {_id: "$companyId", sum: {$sum: "$amount"}}}
        ]);
        let zamount = 0;
        if (zarray && zarray.length > 0) {
            zamount = zarray[0].sum;
        }
        const company = await Company.findById(req.user.cid)
        let balance = company.balance
        res.status(200).json({balance, samount, zamount})
    } catch (e) {

    }
}
