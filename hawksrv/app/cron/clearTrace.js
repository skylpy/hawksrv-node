const L = require('debug')('app:cron');
var CronJob = require('cron').CronJob;
const Trace = require('@trace/trace.model');

const job = new CronJob('* 0 2 * * 0', function() {
    L('removing outdated trace');
    Trace.removeOutdated();
});

job.start();

L('setup: clearing trace');