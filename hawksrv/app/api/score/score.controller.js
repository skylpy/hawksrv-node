const errors = require('@lib/errors');
const L = require('debug')('app:api');
const Score = require('./score.model');
const User = require('../user/user.model');
const ScoreRule = require('./scorerule.model');
const ScoreLib = require('../../lib/score')
const pushMsg = require('@notification/notification.controller').pushMsg;
const excel = require('../../excel/score.export');

module.exports = {
    query,
    scoreRuleList,
    scoreRuleSave,
    scoreRuleDelete,
    scoreRuleType,
    scoreStatus,
    downExcel
};

const filteringItems = '-__v -updatedAt';

async function query(req, res, next) {
    L('Calling API score.query', req.query);

    try {
        let {user, from, to} = JSON.parse(req.query.q);
        if (!user || !from || !to) {
            next(errors.BadRequest('invalid parameters for score.query'));
            return;
        }

        let filter = {};

        if (user instanceof Array) filter.user = {$in: user};
        else filter.user = user;

        let start = new Date(from), end = new Date(to);
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);

        filter.at = {
            $gte: start,
            $lte: end
        }

        let result = await Score.find(filter, filteringItems);
        res.status(200).json(result);

    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

// 用于获取已保存的配置
async function scoreRuleList(req, res, next) {
    L('Calling API score.scoreRuleList', req.query);
    try {
        let {ruleModule} = JSON.parse(req.query.q);
        let result = await ScoreRule.find({ruleModule: ruleModule, company:req.user.cid});
        res.status(200).json(result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

//
async function scoreRuleSave(req, res, next) {
    L('Calling API score.scoreRuleSave', req.body);
    try {
        let scoreData = req.body;
        let scoreRule = null
        if (scoreData._id) {
            scoreRule = await ScoreRule.findOneAndUpdate({_id: scoreData._id}, {$set: scoreData}, {new: true})
        } else {
            scoreRule = await ScoreRule.create(scoreData)
        }
        if(scoreRule.ruleModule=='custom'){
            $ScoreModule.emit('custom.then', scoreRule)
        }
        res.status(200).json(scoreRule);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

//
async function scoreRuleDelete(req, res, next){
    L('Calling API score.scoreRuleDelete', req.body);
    try {
        let _id = req.params.id;
        scoreRule = await ScoreRule.deleteOne({_id})
        res.status(200).end()
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

// 用于获取默认配置
async function scoreRuleType(req, res, next) {
    L('Calling API score.scoreRuleType', req.query);
    try {
        let {ruleModule} = JSON.parse(req.query.q);
        let type = ScoreLib.getRuleType(ruleModule)
        if (type) {
            res.status(200).json(type);
        } else {
            res.status(200).json();
        }
    } catch (e) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}

async function scoreStatus(req, res, next) {
    L('Calling API score.scoreStatus', req.body);
    try {
        const scoreId = req.params.id;
        const userId = req.user.sub;

        let user = await User.findById(userId)

        let {status, superAdminId, superAdminInfo, whoScore, myInfo} = req.body;
        if(user.superadmin || user.privilege.filter(item=>item=='考核设置').length){
            score = await Score.findOneAndUpdate({_id: scoreId}, {$set: {status, editor: user._id}}, {new: true})

            if(!user.superadmin && superAdminId && superAdminInfo) {
                pushMsg({
                    userId: superAdminId,
                    category: '工作考核',
                    content: superAdminInfo,
                    title: "工作考核提醒通知",
                });
            }
            if (whoScore && myInfo) {
                pushMsg({
                    userId: whoScore,
                    category: '工作考核',
                    content: myInfo,
                    title: "工作考核提醒通知",
                });
            }
            res.status(200).json(score);
        }else{
            next(new errors.BadRequest('你没有操作权限'));
        }

    } catch (error) {
        L(error);
    }
}

async function downExcel(req, res, next) {
    L('Calling API score.query', req.query);

    if (!req.get('download-excel')) next(errors.BadRequest('Wrong Way to Download file.'));

    try {
        let {user, date, type} = JSON.parse(req.query.q);
        if (!user || !date || date.length !== 2) {
            next(errors.BadRequest('invalid parameters for score.query'));
            return;
        }

        let filter = {};

        if (user instanceof Array) filter.user = {$in: user};
        else filter.user = user;

        let start = new Date(date[0]), end = new Date(date[1]);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) ){
            next(errors.BadRequest('invalid parameters for score.query'));
        } 
        
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);

        filter.at = {
            $gte: start,
            $lte: end
        };

        if (type) filter.type = type;

        let result = await Score.find(filter, filteringItems);
        excel.query(user, res, result);
    } catch (error) {
        L(error);
        next(new errors.BadRequest(error.message));
    }
}