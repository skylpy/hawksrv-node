const config = require('config');
const mongoose = require('mongoose');
const L = require('debug')('app:init');

dbInit();

function dbInit() {

    mongoose.Promise = global.Promise;
    mongoose.set('useCreateIndex', true);

    let db = config.get('db');

    // Connecting to the database
    L('Mongoose is trying to connect %s', db.connectionString);
    
    mongoose.connect(db.connectionString, {
        user: db.user,
        pass: db.password,
        useNewUrlParser: true,
    }).then(() => {
        L("Mongoose is connected to the database");    
    }).catch(err => {
        L('Could not connect to the database. Exiting now...\n%O', err);
        process.exit();
    });
}