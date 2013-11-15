nanowar
========
1. Prerequisites
----------------------------
- "express", "sockjs", "xml2js" modules for nodejs.
- Python for static files serving.
 
2. Building the code
----------------------------
- The core code is inside "src" folder, including both client and server code.
- To make brower load the client code faster, we use a combining strategy to combine all client code files into one big file. Using that way, browser only needs to load one big script file instead of load multiple files one by one. 
To combine the client script files into a file called "combine-client-code.js":
	1. On Windows:
	This can be done by calling "src/combine-client-js.bat" script file. 
	
	2. Other Unix like:
	Use shell script "src/combine-client-js.sh". Although, we haven't fully tested if this script work correctly, since the main development environment of our project is Windows.

- The code and resources for the demo is inside "demo" folder. Note that: since the demo uses big combined script file as mentioned above, every time, the client's core code in "src" folder changed, they must be re-combined. There are similar script files that can do the jobs inside this "demo" folder. Eg. "demo/combine-client-js.bat" will re-combine the code in "src" folder and copy the result combined file to "demo" folder.

- Server code requires "express", "sockjs", "xml2js" modules.

3. To play the demo game
------------------------------
- Start Game Server:
	Use command "node demo/demo_server.js". Actually, this server script can handle both game messages (through sockjs) and static files serving (eg. HTML, scripts, images serving). However, we notice that the performance of the game will be somewhat hindered by static files serving. Thus, we decide to use a separate HTTP Server to serve static files.

- Start the HTTP server for serving static files by:
	1. On Windows:
	Go to "demo" folder.
	Use "startHTTPServerPython.bat" if your system contains Python version below 3.0.
	Or use "startHTTPServerPython3.bat" otherwise.
	
	2. Unix like:
	"cd" to "demo" folder.
	Use command "python -m SimpleHTTPServer 8081" if Python version below .
	Or use "python -m http.server 8081" otherwise.

	This HTTP Server will use port 8081.

- On browser, open "http://localhost:8081/demo.html". The "localhost" part can be replaced by your host name or IP.