const acl = require('express-acl');
const L = require('debug')('app:init');

module.exports = function(server) {
    // Call the config method and pass in the  options
    acl.config({
        baseUrl: 'api',
        defaultRole: 'anonymous',
        decodedObjectName: 'user',
        rules: [
            {
                group: 'admin',
                permissions: [
                  {
                    resource: '*',
                    methods: '*',
                    action: 'allow'
                  }
                ],
            },
            {
                group: 'manager',
                permissions: [
                    {
                        resource: '*',
                        methods: '*',
                        action: 'allow'
                    }
                ],
            },
            {
                group: 'employee',
                permissions: [
                    {
                        resource: '*',
                        methods: ['GET', 'PUT', 'POST', 'DELETE'],
                        action: 'allow'
                    },
                    {
                        resource: '/api/user/notification/*',
                        methods: ['GET', 'DELETE'],
                        action: 'allow'
                    },
                ],
            },

            {
                group: 'accountant',
                permissions: [
                    {
                      resource: '*',
                      methods: '*',
                      action: 'allow'
                    }
                ],
            },

            {
                group: 'anonymous',
                permissions: [
                    {
                      resource: 'utils/vericode',
                      methods: ['POST'],
                      action: 'allow'
                    },
                    {
                        resource: 'user/login',
                        methods: ['POST'],
                        action: 'allow'
                    },
                    {
                        resource: 'company/register',
                        methods: ['POST'],
                        action: 'allow'
                    },
                    {
                        resource: 'chat/online',
                        methods: ['POST'],
                        action: 'allow'
                    },
                    {
                        resource: 'utils/getCitys',
                        methods: ['GET'],
                        action: 'allow'
                    },
                    {
                        resource: 'chat/heartbeat',
                        methods: ['GET'],
                        action: 'allow'
                    }
                ],
            }
        ]
    });


    // enable acl authorization
    server.use(acl.authorize);
    L('express-acl activated');
}
