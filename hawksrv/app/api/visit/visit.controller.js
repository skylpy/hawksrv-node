const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Visit = require('./visit.model');
const {chartDataConvert} = require('./visit.util')
const pushMsg = require('@notification/notification.controller').pushMsg;
const User = require('../user/user.model');

module.exports = {
    create,
    update,
    remove,
    getById,
    query,
    chart,
    searcher
};

const filteringItems = '-__v -updatedAt';

async function create(req, res, next) {
    L('Calling API visit.create', req.body);

    if (!req.body) {
        next(new errors.BadRequest('invalid parameter for visit creation'));
        return;
    }

    try {
        let visit = req.body;
        visit.companyId = req.user.cid;
        delete visit.remind;
        let c = await Visit.create(visit);
        let user = await User.findById(visit.creator, '-hash -__v -createdAt -updatedAt -notification -appversion')
        for (var i = 0; i < visit.executor.length; i++){
            pushMsg({
                applyId: c._id,
                userId:visit.executor[i],
                category:"拜访",
                content:user.name + "给你发送拜访任务，请查看",
                title:"拜访通知"
            });
        }

        c.notify();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function update(req, res, next) {
    L('Calling API visit.update');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid visit id'));
        return;
    }

    try {

        let c = await Visit.findByIdAndUpdate(cId, req.body, {new: true});

        c.notify();
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function remove(req, res, next) {
    L('Calling API visit.remove');
    let cId = req.params.id;

    if (!cId) {
        next(new errors.BadRequest('invalid visit id'));
        return;
    }

    try {
        await Visit.deleteOne({_id: cId});
        res.status(200).end();
        L('successfully delete visit', cId);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getById(req, res, next) {
    L('Calling API visit.getById', req.params);

    if (!req.params.id) {
        next(new errors.BadRequest('invalid visit id'));
        return;
    }

    try {
        let c = await Visit.findById(req.params.id, filteringItems);
        res.json(c);

    } catch (err) {
        L(err);
        next(new errors.BadRequest(err.message));
    }
}

async function query(req, res, next) {
    L('Calling API visit.query', req.query);

    try {
        let conditions = req.query.q ? JSON.parse(req.query.q) : {};
        let filter = {companyId: req.user.cid};

        Object.keys(conditions).forEach(k => {
            if (typeof conditions[k] == 'string') {
                if(conditions[k]!='')filter[k] = conditions[k];
            } else if (conditions[k] instanceof Array) {
                filter[k] = {$in: conditions[k]}
            } else {
                filter[k] = conditions[k];
            }
        })

        let result = await Visit.find(filter, filteringItems).sort({createdAt:-1});

        result.forEach(v=>{
            var deadline = v["deadline"];
            var createdAt = v["createdAt"];
            let reduce = deadline - createdAt;
            if (reduce < 0 && v["status"] == '未完成') {
                v['status'] = '已失访'
            }
        });


        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function searcher(req, res, next) {
    L('Calling API visit.searcher', req.query);

    try {
        let conditions = req.query.q ? JSON.parse(req.query.q) : {};
        let filter = {companyId: req.user.cid};

        Object.keys(conditions).forEach(k => {
            if (typeof conditions[k] == 'string') {
                if(conditions[k]!='')filter[k] = conditions[k];
            } else if (conditions[k] instanceof Array) {
                filter[k] = {$in: conditions[k]}
            } else {
                filter[k] = conditions[k];
            }
        })

        if (filter.createdAt){
            let start = new Date(filter.createdAt), end = new Date(filter.createdAt);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            end.setHours(23);
            end.setMinutes(59);
            end.setSeconds(59);

            filter.createdAt = {
                $gte: start,
                $lte: end
            }
        }

        if (filter.finishedAt) {

            let start = new Date(filter.finishedAt), end = new Date(filter.finishedAt);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
            end.setHours(23);
            end.setMinutes(59);
            end.setSeconds(59);

            filter.finishedAt = {
                $gte: start,
                $lte: end
            }
        }


        let result = await Visit.find(filter, filteringItems).sort({createdAt:-1});
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function chart(req, res, next) {
    L('Calling API visit.chart', req.query);
    try {
        let conditions = req.query.q ? JSON.parse(req.query.q) : {};
        // startTime endTime
        let filter = {
            companyId: req.user.cid, //锁定企业
            // status:'已完成'
        };
        // 处事in查询
        Object.keys(conditions).forEach(k => {
            if (typeof conditions[k] == 'string') {
                filter[k] = conditions[k];
            } else if (conditions[k] instanceof Array) {
                filter[k] = {$in: conditions[k]}
            } else {
                filter[k] = conditions[k];
            }
        })
        let startTime = filter.startTime
        let endTime = filter.endTime
        // 时间区间
        if (filter.startTime || filter.endTime) {
            filter.updatedAt = {};

            if (filter.startTime) {
                filter.updatedAt.$gte = new Date(parseInt(filter.startTime));
                delete filter.startTime;
            }

            if (filter.endTime) {
                filter.updatedAt.$lte = new Date(parseInt(filter.endTime));
                delete filter.endTime;
            }
        }

        // mapReduce查询配置
        let opt = {
            map: function () {
                let date = new Date(this.updatedAt);
                const Y = date.getFullYear()
                const M = date.getMonth()+1
                const D = date.getDate()
                let key = `${Y}-${M > 9 ? M : `0${M}`}-${D > 9 ? D : `0${D}`}`
                emit(key,this)
            },
            reduce : function(date, items) {
                return {list:items};
            },
            query:filter,
            // out: {inline: 1}
        }
        let result = await Visit.mapReduce(opt);
        res.status(200).json(chartDataConvert(result.results,startTime,endTime));
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
