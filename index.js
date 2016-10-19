var express = require('express')
var path = require('path');
var stream = require('stream');
var app = express()
var WebSocketServer = require('ws').Server;

var domain = require('./modules/domain');
var validateIP = require('validate-ip-node');

//variables
var webPort = 3000;
var webSocketPort = 3001;
/**
 * Latency test endpoint
 */
app.get('/latency', function (req, res) {
    res.send('pong');
});
/**
* upload endpoint
*/
app.post('/upload', function(req, res){
  var response = {
           result: 'success',
           message: Date.now()
       };
       res.status(200).json(response);
});
/**
 * Download test endpoint
 */
app.get('/download', function (req, res) {
     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
     res.header('Expires', '-1');
     res.header('Pragma', 'no-cache');
     var bufferStream = new stream.PassThrough();
     bufferStream.pipe(res);
     var responseBuffer = new Buffer(parseInt(req.query.bufferSize));
     responseBuffer.fill(0x1020304);
     bufferStream.write(responseBuffer);
     bufferStream.end();
});


/**
 * TestPlan endpoint
 */
app.get('/testplan', function (req, res) {
  var testPlan = {};
  //get client ip address
    var ipaddress = req.connection.remoteAddress;
    if (validateIP(ipaddress)) {
      //running locally return machine ipv4 address
      if (req.headers.host.indexOf("localhost") > -1) {
        testPlan.clientIPAddress = global.AddressIpv4;
      }
      else {
        //format ip address it is normal remove ff ie...  ::ffff:10.36.107.238
        if (ipaddress.indexOf("ff") > -1) {
          var ipAddressArray = ipaddress.split(':');
          for (var i = 0; i < ipAddressArray.length; i++) {
            if (ipAddressArray[i].indexOf('.') > -1) {
              testPlan.clientIPAddress = ipAddressArray[i];
            }
          }
        } else {
          testPlan.clientIPAddress = ipaddress;
        }
      }
    }
    else {
      testPlan.clientIPAddress = 'na';
    }
    //set server base url
    testPlan.webSocketUrlIPv4 = 'ws://' + global.AddressIpv4 + ':' +webSocketPort;
    testPlan.webSocketPort = webSocketPort;
    if (global.hasAddressIpv6) {
      testPlan.hasIPv6 = true;
      testPlan.baseUrlIPv6 = '[' + global.AddressIpv6 + ']:' + webPort;
      //TODO to investigate ipv6 address for localhost web sockets
      testPlan.webSocketUrlIPv6 = 'ws://v6-' + testPlan.osHostName + ':' + webSocketPort;
    } else {
      testPlan.hasIPv6 = false;
    }
    testPlan.baseUrlIPv4 = global.AddressIpv4 + ':' + webPort;
    testPlan.port = webPort;
    res.json(JSON.stringify(testPlan));
});


app.use(express.static(path.join(__dirname, 'public')));



app.listen(3000,'::');

var wss = new WebSocketServer({port: 3001 });
wss.on('connection', function connection(ws) {
  console.log('client connected');

  ws.on('message', function incoming(messageObj, flags) {
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
if (message.flag === 'latency'){
      console.log('received: %s', new Date().getTime());
      ws.send(message.data);
    } else if (message.flag === 'upload') {
      var uploadtime = {'data':Date.now().toString()};
      ws.send(JSON.stringify(uploadtime.data));
    } else {
      console.log("error message");
    }

  });
});
//set global ipv4 and ipv6 server address
domain.setIpAddresses();
