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

var express = require('express');
var path = require('path');
var stream = require('stream');
var app = express();
var bodyParser = require('body-parser');
var WebSocketServer = require('ws').Server;
var domain = require('./modules/domain');
var validateIP = require('validate-ip-node');
var os = require('os');
var apiRouter = express.Router();
//module provides download test sizes based off of probe data
var downloadData = require('./modules/downloadData');

//set global ipv4 and ipv6 server address
domain.setIpAddresses();

//variables
global.webPort = +process.env.WEB_PORT || 8080;
global.webSocketPort = global.webPort + 1;

//export modules
module.exports.statisticalCalculator = require('./modules/statisticalCalculator');
module.exports.downloadData = require('./modules/downloadData');
module.exports.dynamo = require('./modules/dynamo');
module.exports.domain = require('./modules/domain');

//used to read post data
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '75mb'}));

//Allow cross domain requests
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-XSRF-TOKEN, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    next();
});

//init router
app.use('/', apiRouter);

//get controllers
var TestPlanController = require('./controllers/TestPlanController');
var LatencyController = require('./controllers/LatencyController');
var DownloadProbeController = require('./controllers/DownloadProbeController');
var DownloadController = require('./controllers/DownloadController');
var UploadProbeController = require('./controllers/UploadProbeController');
var UploadController = require('./controllers/UploadController');
var CalculatorController = require('./controllers/CalculatorController');
var TestServerController = require('./controllers/TestServerController');

var testPlanController = new TestPlanController(apiRouter, global.AddressIpv4, global.AddressIpv6);
var latencyController = new LatencyController(apiRouter);
var downloadProbeController = new DownloadProbeController(apiRouter);
var downloadController = new DownloadController(apiRouter);
var uploadProbeController = new UploadProbeController(apiRouter);
var uploadController = new UploadController(apiRouter);
var calculatorController = new CalculatorController(apiRouter);
var testServerController = new TestServerController(apiRouter);

module.exports.TestPlanController = require('./controllers/TestPlanController');
module.exports.LatencyController = require('./controllers/LatencyController');
module.exports.DownloadProbeController = require('./controllers/DownloadProbeController');
module.exports.DownloadController = require('./controllers/DownloadController');
module.exports.UploadProbeController = require('./controllers/UploadProbeController');
module.exports.UploadController = require('./controllers/UploadController');
module.exports.CalculatorController = require('./controllers/CalculatorController');
module.exports.TestServerController = require('./controllers/TestServerController');

app.use(express.static(path.join(__dirname, 'public')));
app.listen(webPort, '::');
app.listen(5020);
app.listen(5021);
app.listen(5022);
app.listen(5023);
app.listen(5024);
app.listen(5025);

//max download buffer size based off of download probing data
global.maxDownloadBuffer = 532421875;

var wss = new WebSocketServer({port: webSocketPort});
wss.on('connection', function connection(ws) {
    console.log('client connected');

    ws.on('message', function incoming(messageObj) {
        var message = JSON.parse(messageObj);
        /*
         if (message.flag === 'download'){
         var img = images[message.data];
         console.log(img);
         var request_obj = {
         JSONimg : {
         'type' : 'img',
         'data' : img,
         },
         startTIME : new Date().getTime()
         }
         console.log("Trying to send using websockets")
         ws.send(JSON.stringify(request_obj));
         } else if (message.flag === 'latency'){
         */
        if (message.flag === 'latency') {
            console.log('received: %s', new Date().getTime());
            ws.send(message.data);
        } else if (message.flag === 'upload') {
            var uploadtime = {'data': Date.now().toString()};
            ws.send(JSON.stringify(uploadtime.data));
        } else {
            console.log("error message");
        }

    });
});
