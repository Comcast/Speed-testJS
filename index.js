var express = require('express')
var path = require('path');
var stream = require('stream');
var app = express()
var WebSocketServer = require('ws').Server;
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

app.use(express.static(path.join(__dirname, 'public')));



app.listen(3000)

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
