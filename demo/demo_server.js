"use strict"

require(__dirname + "/../src/Server.js");

process.chdir(__dirname);

//start HTTP Server to serve web contents
var http = require('http'),
	url = require("url"),
	path = require("path"),
	node_static = require('node-static');
	

//create static file server
var fileServer = new node_static.Server();

//create http server		
var httpServer = http.createServer(function(request, response) {
	request.addListener('end', function () {
		var uri = url.parse(request.url).pathname;
		console.log('request uri ' + uri);
		
		if (uri == '/demo/' || uri == '/demo' || uri == '/')
			fileServer.serveFile('./demo.html', 200, {}, request, response);
		else
			fileServer.serve(request, response);
    }).resume();
});

//listen to port
var web_server_ip = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
var web_server_port = process.env.OPENSHIFT_NODEJS_PORT || Constant.SERVER_PORT;
console.log("web server " + web_server_ip  + ' is listening to ' + web_server_port);
httpServer.listen(web_server_port, web_server_ip);

/*------start game server------*/
var server = new NanoServer();
server.start(httpServer);