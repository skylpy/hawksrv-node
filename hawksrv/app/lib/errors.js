const util = require('util');

Errors = {
    BadRequest: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = 'BadRequest';
        this.message = message || 'Bad Request';
        this.statusCode = 400;
        this.errorCode = errorCode || 400;
    },

    NotFound: function(message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'The requested resource couldn\'t be found';
        this.statusCode = 404;
        this.errorCode = errorCode || 404;
    },

    Forbidden: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'Forbidden';
        this.statusCode = 403;
        this.errorCode = errorCode || 403;
    },

    InternalServerError: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'Internal Server Error';
        this.statusCode = 500;
        this.errorCode = errorCode || 500;
    },

    Unauthorized: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'Unauthorized Request';
        this.statusCode = 401;
        this.errorCode = errorCode || 401;
    },

    NotImplemented: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'Not Implemented';
        this.statusCode = 501;
        this.errorCode = errorCode || 501;
    },

    ServiceUnavailable: function (message, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = this.constructor.name;
        this.message = message || 'Service Unavailable';
        this.statusCode = 503;
        this.errorCode = errorCode || 503;
    },

    CustomError: function (name, message, statusCode, errorCode) {

        Error.captureStackTrace(this, this.constructor);
      
        this.name = name || 'CustomError';
        this.message = message || 'Custom Error without message';
        this.statusCode = statusCode || 400;
        this.errorCode = errorCode || 400;
    }
}

Object.keys(Errors).forEach((k,v) => {
    util.inherits(Errors[k], Error);
});

module.exports = Errors;