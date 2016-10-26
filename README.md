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

Server: Node and Express are used to expose the rest endpoints and the website is served from the public folder.
Index.js is the starting point of the app and contains the following: 

1. Configuration parameters 
2. Rest Endpoints
3. WebSockets 
4. Modules folder contains custom modules used for the application.

Server Configuration:
Configuration values are set in index.js
The node instance will automatically bind the ipv4 and ipv6 address on the server it is running to. The 
endpoint testplan can be called to return these values to the client to be used in testing. Ports, webSocket and
any other needed configuration values can be set here.

Client: Client application resides under the public folder and consists of plain javascript. Index.html is the 
default start page of the application and will contain and end to end Bandwidth Speed Test. The following describes
the folder structure of the client application:

lib: The lib folder contains javascript files used to measure bandwidth and related measurements. 
example: The example folder contains html files used to test the measurement javascript files in the lib folder
test: test folder contains unit tests




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
