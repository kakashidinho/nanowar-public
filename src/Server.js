"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + "box2d.js");
require(LIB_PATH + "caat.js");
require(LIB_PATH + "Cell.js");
require(LIB_PATH + "Constant.js");
require(LIB_PATH + "DirectorClient.js");
require(LIB_PATH + "Effect.js");
require(LIB_PATH + "Entity.js");
require(LIB_PATH + "Msg.js");
require(LIB_PATH + "Projectile.js");
require(LIB_PATH + "Skill.js");
require(LIB_PATH + "Util.js");
require(LIB_PATH + "Virus.js");

function Server() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var gameInterval; // Interval variable used for gameLoop 
    var ball;         // the game ball 
    var sockets;      // Associative array for sockets, indexed via player ID
    var players;      // Associative array for players, indexed via socket ID

    /*
     * private method: broadcast(msg)
     *
     * broadcast takes in a JSON structure and send it to
     * all players.
     *
     * e.g., broadcast({type: "abc", x: 30});
     */
    var broadcast = function (msg) {
        var id;
        for (id in sockets) {
            sockets[id].write(JSON.stringify(msg));
        }
    }

    /*
     * private method: unicast(socket, msg)
     *
     * unicast takes in a socket and a JSON structure 
     * and send the message through the given socket.
     *
     * e.g., unicast(socket, {type: "abc", x: 30});
     */
    var unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }

    /*
     * private method: reset()
     *
     * Reset the game to its initial state.  Clean up
     * any remaining timers.  Usually called when the
     * connection of a player is closed.
     */
    var reset = function () {
        // Clears gameInterval and set it to undefined
        if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
        }
    }


    /*
     * private method: newPlayer()
     *
     * Called when a new connection is detected.  
     * Create and init the new player.
     */
    var newPlayer = function (conn) {
        count ++;

        // Create player object and insert into players with key = conn.id
        players[conn.id] = new Player(conn.id, nextPID);
        sockets[nextPID] = conn;

        nextPID = nextPID + 1;
    }

    /*
     * private method: gameLoop()
     *
     */
    var gameLoop = function () {
    }

    /*
     * private method: startGame()
     *
     */
    var startGame = function () {
    }

    /*
     * priviledge method: start()
     *
     * Called when the server starts running.  Open the
     * socket and listen for connections.  Also initialize
     * callbacks for socket.
     */
    this.start = function () {
        try {
            var express = require('express');
            var http = require('http');
            var sockjs = require('sockjs');
            var sock = sockjs.createServer();

            // reinitialize 
            count = 0;
            nextPID = 1;
            gameInterval = undefined;
            players = new Object;
            sockets = new Object;
            
            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                console.log("connected");
                // Sends to client
                broadcast({type:"message", content:"There is now " + count + " players"});

                if (count == Constant.SERVER_MAX_CONNECTIONS) {
                    // Send back message that game is full
                    unicast(conn, {type:"message", content:"The game is full.  Come back later"});
                    // TODO: force a disconnect
                } else {
                    // create a new player
                    newPlayer(conn);
                }

                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {
                    // Stop game if it's playing
                    reset();

                    // Decrease player counter
                    count--;

                    nextPID = nextPID - 1;

                    delete players[conn.id];

                    // Sends to everyone connected to server except the client
                    broadcast({type:"message", content: " There is now " + count + " players."});
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data)

                    switch (message.type) {
                        default:
                            console.log("Unhandled " + message.type);
                    }
                }); // conn.on("data"
            }); // socket.on("connection"

            // Standard code to starts the server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/nanowar'});
            httpServer.listen(Constant.SERVER_PORT, '0.0.0.0');
            app.use(express.static(__dirname));

        } catch (e) {
            console.log("Cannot listen to " + port);
            console.log("Error: " + e);
        }
    }
}

var Player = function(_connID, _playerID) {
	this.connID;
	this.playerID;
	
	var that = this;
	
	this.connID = _connID;
	this.playerID = _playerID;
	
	//NanoEntity.call(this, maxhp, _side, _width, _height, _x, _y, _spriteModule)
}

// This will auto run after this script is loaded
var gameServer = new Server();
Server.start();

// vim:ts=4:sw=4:expandtab