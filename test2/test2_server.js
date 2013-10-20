"use strict"

require("./../src/Server.js");

var server = new Server();
server.start();
server.beginStartGame("init2.xml");