"use strict"

require("./../src/Server.js");

//start HTTP Server to serve web contents
var express = require('express');
var http = require('http');
			
var app = express();
var httpServer = http.createServer(app);
httpServer.listen(2001, '0.0.0.0');
app.use(express.static(__dirname + '/../'));
app.use(express.static(__dirname));

app.get('/', function(req,res) {
  console.log("get ('/')");
  res.sendfile('test2.html');
});

/*------start game server------*/
var server = new Server();
server.start();
server.beginStartGame("init2.xml");