<img src="https://travis-ci.com/Comcast/Speed-testJS.svg?token=az4nWCYAfTiiz3zyEFcf&branch=master">

# SpeedtestJS
Speed-testJS is a JavaScript based speed test that will provide users 
with an enriched view of their Internet speed. Providing users with not 
only their latency, upload and download speeds and context around their 
entire Internet experience. Using speed tier data to add a qualifying 
metric to standard speed test results users will now know whether their 
experience is poor, good or great

## Deployment
For deploying to a test server, see the README under **ansible** folder.


##Client Server Setup
The application consists of a node/express software running the server and plain javascript/html on the client. The server
powers reset endpoints, websocket communication, database interactions and the client website. 

#Server
Index.js is the starting point of the app contains of the neccessary functions to run the application. Significant
settings in this file are:

* Ip address and ports: the server will automatically bind to the ipv4 and ipv6 addresses of the host machine that it is deployed
to (ie. app.listen(SERVERPORT,'::');). Addtionaly ports can be assigned with app.listen(ADDITIONALPORT);

* Http Request: http configuration is defined to allow http posts and cross domain request.

* WebSockets: websockets communication is defined

* Rest endPoints: rest endpoints are exposed to complete a speed test and include the following:
    1. testplan: testplan will return json data containing the ipv4, ipv6 ipaddresses and ports used for rest endPoints
    and websockets running on the server and the client ipAddress. Also additional speed test features(ie. latency based
    routing flags can be returned)
    2. latency: returns simple pong message
    3. download: binary data based on request
    4. upload: accepts post for uploads
    5. downloadProbe: returns recommended download bandwidth testing size based on request
    6. calculator: returns calculations based on request array giving statistics on datum.
    7. testServer: used in latency based routing.. it will return test servers urls that can 
    be used to find the closet server to a client
    
* Configuration: Generic configuration(ports, latencyBasedRouting,...) are set in index.js. Specific customization(ie. database)
    can be place under the config folder

1. Configuration parameters 
2. Rest Endpoints
3. WebSockets 
4. Modules folder contains custom modules used for the application.

#Client

Client: Client application resides under the public folder and consists of plain javascript. Index.html is the 
default start page of the application and will contain an end to end example of aBandwidth Speed Test. The following describes
the folder structure of the client application:

* lib: The lib folder contains javascript files used to measure bandwidth and related measurements. 
* example: The example folder contains html files used to test the measurement javascript files in the lib folder
* test: test folder contains unit tests
* uilib: javascript files specific to UI.
* img: images for testing or ui



Manual Deployment requires deployment of files required to run the 
application. The following files folders should be removed for deployment.

	.DS_Store
	.git
	.gitignore
	.travis.yml
	.vagrant
	ansible folder
	Vagrant file

Once these files are removed, please zip the root folder Speed-testJS and copy to your server. Unzip the file and run “node index.js” from the root folder. The web site is browsable via the ip address of your server and port
number and public\index.html is the default page. Build tools such as grunt, gulp, WebPack … can be used to automate this process and complete
other operations (ie. Minify,..)
