const L = require('debug')('app:cron');
var CronJob = require('cron').CronJob;
const Company = require('@company/company.model');

const job = new CronJob('* 0 2 * * 0', function() {
    L('removing outdated announcements');
    Company.removeOutdatedAnnounce();
});



job.start();

L('setup: clearing announces');