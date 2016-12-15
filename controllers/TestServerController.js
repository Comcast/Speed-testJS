/*
 * *
 *  Copyright 2014 Comcast Cable Communications Management, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */

'use strict';

var dynamo = require('../modules/dynamo');

/**
 * Class representing TestServer controller.
 */
class TestServerController {

    /**
     * Create TestServerController.
     * @param {express.Router()} router.
     */
    constructor(router) {
        this.router = router;
        this.registerRoutes();
    }

    /**
     * Register the route for Express.
     */
    registerRoutes() {
        this.router.get('/testServer', this.getServerInfo.bind(this));
    }

    /**
     * Get the server information by look up in the database.
     * @param req - Contains a query parameter used to look up server information.
     * @param res - Contains server information.
     */
    getServerInfo(req, res) {
        try {

            //validate query parameters
            if (!(req.query.location).match(/^[a-zA-Z ]+$/)) {
                throw('error');
            }

            var queryParams = {
                TableName: 'SpeedTestServerInfo',
                IndexName: 'SitenameIndex',
                KeyConditionExpression: 'Sitename = :id',
                ExpressionAttributeValues: {':id': {'S': req.query.location}}
            };

            var testServer = [];

            var queryCallback = function (data) {
                if (data) {
                    data.Items.map(function (val) {
                        testServer.push({
                            IPv4Address: val.IPv4Address.S +':8080',
                            IPv6Address: '[' + val.IPv6Address.S + ']:' + '8080',
                            Location: val.Location.S,
                            Sitename: val.Sitename.S,
                            Fqdn: val.Hostname.S
                        });

                    });
                }
                res.json(testServer);
            };

            dynamo.query(queryParams, queryCallback);
        }
        catch (err) {
            res.status(422).end('You must specify location.');
        }
    }
}

module.exports = TestServerController;
