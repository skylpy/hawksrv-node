const Trace = require('./trace.model');
const errors = require('@lib/errors');
const L = require('debug')('app:api');
const axios = require('axios');
const User = require('@user/user.model');
const Maker = require('./marker.model');

module.exports = {
    add,
    query,
    getCurrentPosition,
    create,
    findMaker
};

async function add(req, res, next) {
    L("calling api trace.add", req.body);

    try {
        let userId = req.user.sub;
        let date = pureDate();
        let current = req.body.current;
        let records = req.body.history;

        let t = await Trace.findOne({userId, date});
        if (!t) {
            let lastTraceDate = new Date();
            t = await Trace.create({
                userId,
                date,
                current,
                records,
                lastTraceDate
            });
        } else {
            let lastTraceDate =t.lastTraceDate
            if (lastTraceDate){
                records = records.filter(r=>{return new Date(r.at) > lastTraceDate});
            }
            if (records && records.length > 0){
                lastTraceDate = new Date(records[records.length-1].at);
            }else {
                lastTraceDate = new Date();
            }
            await t.update({
                current: current,
                lastTraceDate: lastTraceDate,
                $push: { records: { $each: records } }
            });
        }

        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function getCurrentPosition(req, res, next) {
    L("calling api trace.getCurrentPosition", req.body);

    try {
        let uIds = [req.user.sub];

        if (req.query.q) {
            let {userIds} = JSON.parse(req.query.q);
            if (userIds && userIds instanceof Array) uIds = userIds;
        }
        let userList = await User.find({
            _id: {
                $in: uIds
            }
        })
        let result = []
        let num = userList.length
        userList.forEach(async (v) => {
            if (v.sid !== undefined && v.tid !== undefined && v.trid !== undefined) {
                await axios({
                    url: "https://tsapi.amap.com/v1/track/terminal/lastpoint",
                    method: 'get',
                    params: {
                        key: '3c80f99eeb5fc53c651602c56d85b258',
                        correction: 'n',
                        sid: v.sid, // 31615
                        tid: v.tid, // 68289035
                        trid: v.trid, // 1724
                    }
                }).then(function (response) {
                    num--
                    if (response.data && response.data.data) {
                        let data = response.data.data
                        data.name = v.name
                        result.push(data)
                    }
                    if (num <= 0) res.status(200).json(result);
                }).catch(err => {
                    if (err) {
                        num--
                        if (num <= 0) res.status(200).json(result);
                    }
                })
            } else {
                num--
            }
        })
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.errmsg));
    }

}

function pureDate(d) {
    let date = (typeof d == 'string' ? new Date(d): d);

    if (!date) {
        let today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function query(req, res, next) {
    L("calling api trace.query", req.query);

    let {userId, date, openGraspRoad} = JSON.parse(req.query.q);

    if (!userId) userId = req.user.sub;

    try {
        let userInfo = await User.findById(userId);
        let result = []
        let getTrackDataFun = async (page) => {
            await axios({
                url: "https://tsapi.amap.com/v1/track/terminal/trsearch",
                method: 'get',
                params: {
                    key: '3c80f99eeb5fc53c651602c56d85b258',
                    sid: userInfo.sid,
                    tid: userInfo.tid,
                    trid: userInfo.trid,
                    starttime: Date.parse(new Date(date).toHawkDateString() + ' 00:00:00.000'),
                    endtime: Date.parse(new Date(date).toHawkDateString() + ' 23:59:59.999'),
                    correction: `denoise=1,mapmatch=${openGraspRoad ? '1' : '0'},attribute=0,threshold=${openGraspRoad ? '0' : '100'},mode=driving`,
                    recoup: 1,
                    gap: 10000,
                    ispoints: 1,
                    page: page,
                    pagesize: 999
                }
            }).then((response) => {
                if (response.data && response.data.data) {
                    let counts = response.data.data.counts || 0
                    let list = response.data.data.tracks[0].points
                    if (page < Math.ceil(counts / (999 * page))) {
                        result = result.concat(list)
                        getTrackDataFun(page + 1)
                    } else {
                        result = result.concat(list)
                        res.status(200).json(result);
                    }
                } else {
                    res.status(200).json(result);
                }
            })
        }
        getTrackDataFun(1);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.errmsg));
    }

}

async function create(req, res, next) {
    L("calling api trace.add", req.body);

    try {
        let data = req.body
        data.userId = req.user.sub
        await Maker.create(data)
        res.status(200).end();

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function findMaker(req, res, next) {
    try {
        let {userId, date} = JSON.parse(req.query.q);
        let result = await Maker.find({
            userId:  userId,
            at: {
                $gte: new Date(new Date(date).toHawkDateString() + ' 00:00:00'),
                $lte: new Date(new Date(date).toHawkDateString() + ' 23:59:59.999')
            }
        })
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}
