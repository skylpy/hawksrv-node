require('module-alias/register'); // before any code
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const config = require('config');
const L = require('debug')('app');

// create express server
const server = express();
L('env = ' + server.get('env'));

// Cross-origin resource sharing
server.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
server.use(bodyParser.json());

// init application
require('./app')(server);

// define a simple route
server.get('/', (req, res) => {
    res.json({"message": "Hawk administration page is under construction"});
});

// global error handler
server.use((err, req, res, next) => {
    L(err);

    if (req.app.get('env') !== 'development' && req.app.get('env') !== 'test') {
      delete err.stack;
    }

    if (err.name === 'UnauthorizedError') {
        // error thrown by jwt
        res.status(401).send('Unauthorized access');
    } else {
        res.status(err.statusCode || 500).json(err);
    }

});

// listen for requests
const port = config.get('port');
server.listen(port, () => {
    console.log("Server is listening on port " + port);
});