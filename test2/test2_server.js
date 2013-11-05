"use strict"

require("./../src/Server.js");

process.chdir(__dirname);

//start HTTP Server to serve web contents
var express = require('express');
var http = require('http');
			
var app = express();
var httpServer = http.createServer(app);
var server_ip = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
console.log("server " + server_ip  + 'is listening to ' + Constant.SERVER_PORT);
httpServer.listen(Constant.SERVER_PORT, server_ip);
app.use(express.static(__dirname + '/../'));
app.use(express.static(__dirname));

app.get('/test2/', function(req,res) {
  console.log("get ('/')");
  res.sendfile('test2.html');
});

app.get('/nanowar/info', function(req,res) {
  console.log("/nanowar/info");
  res.end('hello');
});

/*------start game server------*/
var server = new Server();
server.start(httpServer);
server.beginStartGame("init2.xml");