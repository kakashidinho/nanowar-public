"use strict"

require(__dirname + "/../src/Server.js");

process.chdir(__dirname);

//start HTTP Server to serve web contents
var http = require('http'),
	url = require("url"),
	path = require("path"),
	fs = require("fs");
			
var httpServer = http.createServer(function(request, response) {
 
	var uri = url.parse(request.url).pathname;
	if (uri == '/demo/' || uri == '/demo')
		uri = '/demo.html';
	var filename = path.join(process.cwd() , uri);
	
	console.log('request uri ' + uri);
	console.log('request ' + filename);
	
	path.exists(filename, function(exists) {
		if(!exists) {
			if (filename.indexOf('nanowar/info') != -1)
			{
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write("This is nanowar game session\n");
				response.end();
			}
			else
			{
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
			}
			return;
		}
		 
		fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}
			 
			response.writeHead(200);
			response.write(file, "binary");
			response.end();
		});
	});
});
var server_ip = "0.0.0.0";
console.log("server " + server_ip  + 'is listening to ' + Constant.SERVER_PORT);
httpServer.listen(Constant.SERVER_PORT, server_ip);

/*------start game server------*/
var server = new Server();
server.start(httpServer);