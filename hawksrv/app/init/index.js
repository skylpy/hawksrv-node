module.exports = function(server) {
    require('../lib/score')

    require('./db');
    require('./jwt')(server);

    // acl must happen after user authentication
    require('./acl')(server);

}
