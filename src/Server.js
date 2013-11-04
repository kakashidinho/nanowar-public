"use strict"; 

var LIB_PATH = __dirname + "/";
require(LIB_PATH + "DirectorServer.js");

var   b2Vec2 = Box2D.Common.Math.b2Vec2;

function Server() {
    this.count;        // Keeps track how many people are connected to server 
    this.availPIDList; // list of available PID to assign to next connected player (i.e. which player slot is open) 
    this.connections;      // Associative array for connections, indexed via socket ID
    this.players;      // Associative array for players, indexed via player ID
	this.gameStarted; //game started or not?
	this.gameInitXML;//the configuration file for the game session
}

/*
 * method: broadcastAll(msg)
 *
 * broadcast takes in a JSON structure and send it to
 * all players even if they are not ready.
 *
 * e.g., broadcastAll({type: "abc", x: 30});
 */
Server.prototype.broadcastAll = function (msg) {
	var id;
	for (id in this.connections) {
		var conn = this.connections[id];
		//conn.socket.write(JSON.stringify(msg));
		//delay the message sending by player's <fakeDelay> amount
		setTimeout(function(conn, msg) {
				conn.socket.write(JSON.stringify(msg));
			},
			conn.player.fakeDelay,
			conn, msg);
	}
}

/*
 * method: broadcast(msg)
 *
 * broadcast takes in a JSON structure and send it to
 * all ready players.
 *
 * e.g., broadcast({type: "abc", x: 30});
 */
Server.prototype.broadcast = function (msg) {
	var id;
	for (id in this.connections) {
		var conn = this.connections[id];
		if (conn.player.character != null)//player must be ready
		{
			//conn.socket.write(JSON.stringify(msg));
			//delay the message sending by player's <fakeDelay> amount
			setTimeout(function(conn, msg) {
					conn.socket.write(JSON.stringify(msg));
				},
				conn.player.fakeDelay,
				conn, msg);
		}
	}
}

/*
 * method: broadcastExcept(player, msg)
 *
 * broadcast takes in a JSON structure and send it to
 * all players except the one whose ID is <playerID>.
 *
 * e.g., broadcastExcept(player1, {type: "abc", x: 30});
 */
Server.prototype.broadcastExcept = function (playerID, msg) {
	var id;
	for (id in this.connections) {
		var conn = this.connections[id];
		if (conn.player.playerID == playerID)//ignore this player
			continue;
		if (conn.player.character != null)//player must be ready
		{
			//conn.socket.write(JSON.stringify(msg));
			//delay the message sending by player's <fakeDelay> amount
			setTimeout(function(conn, msg) {
					conn.socket.write(JSON.stringify(msg));
				},
				conn.player.fakeDelay,
				conn, msg);
		}
	}
}

/*
 * private method: unicast(socket, msg)
 *
 * unicast takes in a socket and a JSON structure 
 * and send the message through the given socket.
 *
 * e.g., unicast(socketID, {type: "abc", x: 30});
 */
Server.prototype.unicast = function (socketID, msg) {
	var conn = this.connections[socketID];
	if (conn.player.character != null)//player must be ready
	{
		//conn.socket.write(JSON.stringify(msg));
		//delay the message sending by player's <fakeDelay> amount
		setTimeout(function(conn, msg) {
				conn.socket.write(JSON.stringify(msg));
			},
			conn.player.fakeDelay,
			conn, msg);
	}
}

//send message via a socket
Server.prototype.sendMsgViaChannel = function(socket, msg){
	socket.write(JSON.stringify(msg));
}


/*
 * private method: newPlayer()
 *
 * Called when a new connection is detected.  
 * Create and init the new player.
 */
Server.prototype.newPlayer = function (conn) {
	this.count ++;

	var nextPID = this.availPIDList.getFirstElem();
	this.availPIDList.popFront();
	
	// Create player object and insert into players with key = nextPID
	var newPlayer = new Player(conn.id, nextPID);
	this.players[nextPID] = newPlayer;
	this.connections[conn.id] = new Connection(conn, newPlayer);
	
	this.assignRandomClass(newPlayer);
	
	return newPlayer;
}

//delete a player
Server.prototype.deletePlayer = function(connectionID){
	if (!(connectionID in this.connections))
		return;
	this.count --;	
	
	var player = this.connections[connectionID].player;
	
	if (this.gameStarted)
	{
		//this player disconnects in the middle of the game
		//need to send message to game loop
		Director.postMessage({type: MsgType.PLAYER_DISCONNECT, playerID: player.playerID});
	}
	
	//clear the ping update interval
	if (player.pingUpdateInterval != undefined)
	{
		clearInterval(player.pingUpdateInterval);
		player.pingUpdateInterval = undefined;
	}
	
	//put this player id to the available ID list
	this.availPIDList.insertBack(player.playerID);
	
	//delete from the player list
	delete this.players[player.playerID];
	
	//delete from the connection list
	delete this.connections[connectionID];
}

//assign random class for a player
Server.prototype.assignRandomClass = function(player){
	//TO DO: real random later when there are more classes
	//assign a random class
	var classNames = ["WarriorCell", "LeechVirus"];
	player.className = classNames[player.playerID % 2];
}

//begin starting the game
Server.prototype.beginStartGame = function(initFileXML)
{
	var that = this;
	
	this.gameInitXML = initFileXML;//store the file name
	
	Director.init(initFileXML, function() {
		that.startGame();
	});
}

//start the game
Server.prototype.startGame = function()
{
	var that = this;
	//director's message handling callback
	Director.onMessageHandling = function(msg){
		return that.handleMessage(msg);
	}
	
	//director's entity death notification
	Director.onEntityDestroyed = function(id){
		that.notifyEntityDeath(id);
	}
	
	//update callback
	Director.onUpdate = function(lastTime, currentTime) {
		that.update(lastTime, currentTime)
	}
	
	Director.startGameLoop(Constant.FRAME_RATE);
		
	//notify clients
	that.broadcastAll(new StartGameMsg(this.gameInitXML));
	
	this.gameStarted = true;
}

//end the game
Server.prototype.endGame = function()
{
	this.gameStarted = false;
	
	Director.endGameLoop();
	
	for (var i = 0; i < Constant.SERVER_MAX_CONNECTIONS; ++i)
		this.players[i].character = null;
	//TO DO
}

//update function being called each frame by Director
Server.prototype.update = function(lastTime, currentTime){
	var elapsedTime = currentTime - lastTime;
	for (var i in this.players)
	{
		var player = this.players[i];
		this.updateClientsAbout(player, elapsedTime);//update clients about this player's current state
		
	}//for (var i = 0; i < Constant.SERVER_MAX_CONNECTIONS; ++i)
}

//update clients about the player <player>
Server.prototype.updateClientsAbout = function(player, elapsedTime){
	if (player.character == null || !player.character.isAlive())
		return;
	var managedWrapper = player.character.managedWrapper;
	
	//update health
	if (player.needUpdateHPToClients(elapsedTime))
	{
		var dHPPos = managedWrapper.getPosHPChange();//positive HP change since last update
		var dHPNeg = managedWrapper.getNegHPChange();//negative HP change since last update
		if (dHPPos != 0 || dHPNeg != 0)
		{
			this.broadcast(new EntityHPChange(player.playerID, dHPPos, dHPNeg));
			managedWrapper.resetHPChange();//reset the HP change recording
		}
	}
}

//update ping time for player
Server.prototype.updatePing = function(player, timeSendPingMsg){
	var MAX_SAMPLES = 10;

	var currentTime = Utils.getTimestamp();
	var RTT = currentTime - timeSendPingMsg;
	
	player.pingSamplesSum += RTT;
	
	player.pingSamples.insertBack(RTT);
	
	var numSamples = player.pingSamples.getNumElements();
	
	if (numSamples > MAX_SAMPLES)
	{
		//exceeded number of samples
		//discard the oldest ping value calculated
		var oldestPing = player.pingSamples.getFirstElem();
		
		player.pingSamplesSum -= oldestPing;
		
		player.pingSamples.popFront(oldestPing);
	}
	
	//now get the average ping of the sampled values
	player.ping = Math.floor(player.pingSamplesSum / player.pingSamples.getNumElements());
	
	//notify client
	this.unicast(player.connID, new PingNotifyMsg(player.ping));
}

Server.prototype.spawnPlayerCharacter = function(player){
	switch(player.className)
	{
	case "WarriorCell":
		player.character = new WarriorCell(player.playerID, 0, 0);
		break;
	case "LeechVirus":
		player.character = new LeechVirus(player.playerID, 0, 0);
		break;
	}
	
	var spawnPosition = new b2Vec2(0, 0);
	//list of possible spawn points for the entity
	var spawnPoints = player.character.getSide() == Constant.VIRUS? Director.getVirusSpawnPoints(): Director.getCellSpawnPoints();
	
	//random spawn point
	var rand = Math.random();//between [0..1)
	var idx = Math.round(rand * (spawnPoints.length - 1));
	var spawnPoint = spawnPoints[idx];
	spawnPosition.x = spawnPoint.x;
	spawnPosition.y = spawnPoint.y;
	
	player.character.setPosition(spawnPosition);
}

//notify all players about the death of an entity
Server.prototype.notifyEntityDeath = function(entityID){
	this.broadcast(new EntityDeathMessage(entityID));
}

//this will handle message that Director forwards back to Server.
//return true if you dont want the Director to handle this message
Server.prototype.handleMessage = function(msg)
{
	var that = this;
	switch(msg.type)
	{
	case MsgType.PLAYER_READY:
		{
			var player = this.players[msg.playerID];
			
			//create ping update interval to send the ping message every 1s
			player.pingUpdateInterval = setInterval(function(player) {
				that.unicast(player.connID, new PingMsg(Utils.getTimestamp()));
			}, 1000, player);
			
			//create character
			this.spawnPlayerCharacter(player);
			//notify all players' clients
			this.broadcast(new EntitySpawnMsg2(player.character));
			
			//now let the new player know about other entities
			var entities = Director.getKnownEntities();
			for (var id in entities){
				var entity = entities[id];
				if (id != player.playerID)
					this.unicast(player.connID, new EntitySpawnMsg2(entity));
			}
		}
		break;
	case MsgType.PLAYER_DISCONNECT://player disconnects in the middle of the game
		{
			var entities = Director.getKnownEntities();
			if (msg.playerID in entities)
				entities[msg.playerID].destroy();//destroy this entity
		}
		break;
	
	case MsgType.ENTITY_MOVEMENT_UPDATE:
		{
			//forward it to all other clients
			this.broadcastExcept(msg.entityID, msg);
		}
		break;
	case MsgType.ATTACK:
		{
			//check if the attack range is valid
			var entities = Director.getKnownEntities();
			if (msg.entityID in entities == false || msg.targetID in entities == false ||
				!entities[msg.entityID].canAttack(msg.skillIdx, entities[msg.targetID]))
			{
				//cannot attack because of out of range
				this.unicast(this.players[msg.entityID].connID, new AttackOutRangeMsg());//tell player
				
				//prevent the Director from processing this message
				return true;
			}
			//forward it to all clients
			this.broadcast( msg);
		}
		break;
	}
	
	return false;
}

//receiving message from player
Server.prototype.onMessageFromPlayer = function(player, msg){
	switch(msg.type)
	{
	case MsgType.PING://ping reply from player
		this.updatePing(player, msg.time);
		break;
	case MsgType.PLAYER_CLASS:
		player.className = msg.className;
		break;
	case MsgType.CHANGE_FAKE_DELAY:
		player.fakeDelay += msg.dDelay;
		if (player.fakeDelay < 0)
			player.fakeDelay = 0;
		break;
	default:
		Director.postMessage(msg);//forward it to the director
	}
}

Server.prototype.start = function () {
	try {
		var that = this;
		var http = require('http');
		var sockjs = require('sockjs');
		var sock = sockjs.createServer();

		// reinitialize
		this.gameStarted = false;
		this.count = 0;
		this.availPIDList = new Utils.List();
		for (var i = 0 ; i < Constant.SERVER_MAX_CONNECTIONS; ++i)
			this.availPIDList.insertBack(i);
		this.players = new Object;
		this.connections = new Object;
		
		// Upon connection established from a client socket
		sock.on('connection', function (conn) {
			console.log("connected");

			if (this.count == Constant.SERVER_MAX_CONNECTIONS) {
				// TO DO: notification
				// TODO: force a disconnect
			} else {
				// create a new player
				var player = that.newPlayer(conn);
				that.sendMsgViaChannel(conn, new PlayerIDMsg(player.playerID));//notify player about his ID
				that.sendMsgViaChannel(conn, new PlayerClassMsg(player.className));//notify player about his initialized class name
				
				if (that.gameStarted)//game already started. let him know
					that.sendMsgViaChannel(conn, new StartGameMsg(that.gameInitXML));
			}

			// When the client closes the connection to the server/closes the window
			conn.on('close', function () {
				
				that.deletePlayer(conn.id);
			});

			// When the client send something to the server.
			conn.on('data', function (data) {
				var message = JSON.parse(data)
				var player = that.connections[conn.id].player;
				//delay the message processing
				setTimeout(function(){
					that.onMessageFromPlayer(player, message);
					},
					player.fakeDelay);
					
			}); // conn.on("data"
		}); // socket.on("connection"

		// Standard code to starts the server and listen
		// for connection
		var httpServer = http.createServer();
		sock.installHandlers(httpServer, {prefix:'/nanowar'});
		httpServer.listen(Constant.SERVER_PORT, '0.0.0.0');

	} catch (e) {
		console.log("Cannot listen to " + Constant.SERVER_PORT);
		console.log("Error: " + e);
	}
}

var Player = function(_connID, _playerID) {
	this.connID;
	this.playerID;
	this.character;
	this.className;//name of the character class that player chose
	this.ping;//network ping delay of this player
	this.pingSamples;//sampled ping values
	this.pingSamplesSum;//sum of samples of network ping delay
	this.pingUpdateInterval;
	this.fakeDelay;//fake additional network one-way delay for this player
	//Server will wait for this amount of time before updating clients 
	//about the hp of this player's character
	this.hpUpdateDelay;
	
	this.connID = _connID;
	this.playerID = _playerID;
	this.character = null;
	this.ping = 0;
	this.fakeDelay = 0;
	this.pingSamples = new Utils.List();
	this.pingSamplesSum = 0;
	this.pingUpdateInterval = undefined;
	
	this.hpUpdateDelay = 500;//0.5s delay by default
	
	this.needUpdateHPToClients = function(elapsedTime)
	{
		var update = false;
		
		this.hpUpdateDelay -= elapsedTime;
		
		if (this.hpUpdateDelay <= 0 || this.character.isAlive() == false)
		{
			update = true;
			this.hpUpdateDelay = 500;
		}
		
		return update;
	}
}

var Connection = function(_socket, _player) {
	this.socket;
	this.player;
	
	this.socket = _socket;
	this.player = _player;
}


// For node.js require
if (typeof global != 'undefined')
{
	global.Server = Server;
	global.Player = Player;
	global.Connection = Connection;
}
