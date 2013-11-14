"use strict"; 

var LIB_PATH = __dirname + "/";
require(LIB_PATH + "DirectorServer.js");
require(LIB_PATH + "Player.js");

var   b2Vec2 = Box2D.Common.Math.b2Vec2;

var SIMPLE_IM = true;//simple interest management
var SERVER_USE_DK = true;
var NUM_DK_VERSIONS = 3;//number of dead reckoning versions, each version is for a certain range of distance
var DK_DISTANCES = [{min:0, max:50}, {min:50, max:100}, {min:100, max:150}];// list of range of distance, each range has different dead reckoning threshold
var DK_THREASHOLDS = [2, 4, 10];//3 versions of dead reckoning thresholds
var RESPAWN_WAIT_TIME = 3000;//3s waiting for respawn
var RESPAWN_DURATION = 5000;//5s of immortal for respawn player
var PING_INTERVAL=2000;


//utility function, covert an message object to string
function msgToString(msg){
	if (msg.asString == undefined)
	{
		msg.asString = JSON.stringify(msg);
	}
	return msg.asString;
}

/*------------class Server------------*/
function Server() {
    this.count;        // Keeps track how many people are connected to server 
    this.availPIDList; // list of available PID to assign to next connected player (i.e. which player slot is open) 
    this.connections;      // Associative array for connections, indexed via socket ID
    this.players;      // Associative array for players, indexed via player ID
	this.playerCharMap;	   // player mapping via his character. useful when the player has disconnected but his character is still around in the system
	this.gameStarted; //game started or not?
	this.gameInitXML;//the configuration file for the game session
	this.director;
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
		if (conn == undefined)
			continue;
		if (conn.player.fakeDelay == 0)
			conn.socket.write(msgToString(msg));
		else{
			//delay the message sending by player's <fakeDelay> amount
			setTimeout(function(conn, msg) {
					if (conn)
						conn.socket.write(msgToString(msg));
				},
				conn.player.fakeDelay,
				conn, msg);
		}
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
		if (conn && conn.player.character != null)//player must be ready
		{
			if (conn.player.fakeDelay == 0)
				conn.socket.write(msgToString(msg));
			else{
				//delay the message sending by player's <fakeDelay> amount
				setTimeout(function(conn, msg) {
						conn.socket.write(msgToString(msg));
					},
					conn.player.fakeDelay,
					conn, msg);
			}
		}
	}
}

/*
 * method: multicast(group, msg)
 *
 * multicast takes in a JSON structure and send it to
 * all ready players.
 *
 * e.g., multicast(player.subscribers, {type: "abc", x: 30});
 */
Server.prototype.multicast = function (subscribers, msg) {
	var id;
	var node = subscribers.getFirstNode();
	while (node != null) {
		var player = node.item;
		var conn = this.connections[player.connID];
		if (player.character != null)//player must be ready
		{
			if (conn.player.fakeDelay == 0)
				conn.socket.write(msgToString(msg));
			else{
				//delay the message sending by player's <fakeDelay> amount
				setTimeout(function(conn, msg) {
						if (conn)
							conn.socket.write(msgToString(msg));
					},
					player.fakeDelay,
					conn, msg);
			}
		}
		
		node = node.next;//next subscriber
	}//while (node != null)
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
		if (conn == undefined || conn.player.playerID == playerID)//ignore this player
			continue;
		if (conn.player.character != null)//player must be ready
		{
			if (conn.player.fakeDelay == 0)
				conn.socket.write(msgToString(msg));
			else{
				//delay the message sending by player's <fakeDelay> amount
				setTimeout(function(conn, msg) {
						conn.socket.write(msgToString(msg));
					},
					conn.player.fakeDelay,
					conn, msg);
			}
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
	if (conn && conn.player.character != null)//player must be ready
	{
		if (conn.player.fakeDelay == 0)
			conn.socket.write(msgToString(msg));
		else{
			//delay the message sending by player's <fakeDelay> amount
			setTimeout(function(conn, msg) {
					conn.socket.write(msgToString(msg));
				},
				conn.player.fakeDelay,
				conn, msg);
		}
	}
}

//send message via a socket
Server.prototype.sendMsgViaChannel = function(socket, msg){
	socket.write(msgToString(msg));
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
	var newPlayer = new Player(conn.id, nextPID, NUM_DK_VERSIONS);
	
	if (this.count == 1)
		newPlayer.isHost = true;//1st player is the host
	
	//simple interest management
	if (SIMPLE_IM)
	{
		for (var i in this.players){
			this.subscribeUpdate(newPlayer, this.players[i]);
			this.subscribeUpdate(this.players[i], newPlayer);
		}//for (var i = 0; i < this.players.length; ++i)
	}//if (SIMPLE_IM)
	
	//insert this player to the list
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
		this.director.postMessage({type: MsgType.PLAYER_DISCONNECT, playerID: player.playerID});
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
	
	if (player.character != null)
	{
		//delete from character to player map
		delete this.playerCharMap[player.character.getHashKey()];
	}
	
	//find another host
	if (player.isHost)
	{
		for (var i in this.players){
			var anotherHost = this.players[i];
			//find another player
			anotherHost.isHost = true;
			this.sendMsgViaChannel(this.connections[anotherHost.connID].socket, new YouHostMsg());//tell him
			break;//enough, we stop here
		}
	}
	
	//simple interest management, unsubcribe all update from this player
	if (SIMPLE_IM)
	{
		for (var i in this.players){
			this.unsubscribeUpdate(player, this.players[i]);
		}//for (var i = 0; i < this.players.length; ++i)
	}//if (SIMPLE_IM)
	
	//delete from the connection list
	delete this.connections[connectionID];
}

//make the subscriber subscribe to publisher
Server.prototype.subscribeUpdate = function(subscriber, publisher){
	if (publisher.subscribers.findNode(subscriber) == null)
	{
		publisher.subscribers.insertBack(subscriber);
	}
}

//make the subscriber unsubscribe from publisher
Server.prototype.unsubscribeUpdate = function(subscriber, publisher){
	
	publisher.subscribers.remove(subscriber);
}

//interest management
Server.prototype.manageInterests = function(){
	//TO DO
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
	
	this.director = new Director(initFileXML, function() {
		that.startGame();
	});
}

//start the game
Server.prototype.startGame = function()
{
	var that = this;
	//director's message handling callback
	this.director.onMessageHandling = function(msg){
		return that.handleMessage(msg);
	}
	
	//director's entity destroyed notification
	this.director.onEntityDestroyed = function(id){
		that.onEntityDestroyed(id);
	}
	
	//director's entity death notification
	this.director.onEntityDeath = function(id){
		that.notifyEntityDeath(id);
	}
	
	this.director.onKillHappen = function(killer, killed){
		that.changeKillCount(killer, killed);
	}
	
	this.director.onPowerUpAppear = function(powerUp){
		that.notifyPowerUpAppear(powerUp);
	}
	
	this.director.onPowerUpChangedDir = function(powerUp){
		that.notifyPowerUpChangedDir(powerUp);
	}
	
	this.director.onEndGame = function(){
		that.endGame();
	}
	
	//update callback
	this.director.onUpdate = function(lastTime, currentTime) {
		that.update(lastTime, currentTime)
	}
	
	
	this.director.startGameLoop(Constant.FRAME_RATE);
		
	//notify clients
	that.broadcastAll(new StartGameMsg(this.gameInitXML));
	
	this.gameStarted = true;
}

//end the game
Server.prototype.endGame = function()
{
	this.gameStarted = false;
	
	var virusRank = new Array();
	var cellRank = new Array();
	
	for (var id in this.players){
		var player = this.players[id];
		var character = player.character;
		if (character != null)
		{
			var record = {id: player.playerID, killCount: player.killCount, deathCount: player.deathCount};
			if (character.getSide() == Constant.VIRUS)
				virusRank.push(record);
			else
				cellRank.push(record);
		}
			
		player.character = null;
		player.killCount = player.deathCount = 0;//reset kill & death count
	}
	function rankSort(a,b) {
		if (a.killCount > b.killCount)
			return -1;
		if (a.killCount < b.killCount)
			return 1;
		if (a.deathCount < b.deathCount)
			return -1;
		if (a.deathCount > b.deathCount)
			return 1;
		return 0;
	}
	
	virusRank.sort(rankSort);
	cellRank.sort(rankSort);
	
	this.broadcastAll(new EndMsg(virusRank, cellRank));
	
	this.director.stop();
}

//update function being called each frame by this.director
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
	if (player.character == null)
		return;
	if(!player.character.isAlive())
	{
		this.updatePlayerRespawn(player, elapsedTime);
	}
		
	var that = this;
	var managedWrapper = player.character.managedWrapper;
	
	//update position
	if (SERVER_USE_DK)
	{
		//update predicted versions
		for (var i = 0; i < NUM_DK_VERSIONS; ++i)
		{
			player.charPredict[i].update(elapsedTime);
			
			//dead reckoning
			var predictPos = player.charPredict[i].getPosition();
			var error = player.character.distanceTo(predictPos);
			
			//error exceeded
			if (error > DK_THREASHOLDS[i])
			{
				//console.log("============>predict version " + i);
				//console.log("predictPos = " + predictPos.x + ", " + predictPos.y);
				//console.log("correctPos = " + player.character.getPosition().x + ", " + player.character.getPosition().y);
				var movementCorrectMsg = new EntityMoveMentMsg(player.character);
			
				//notify players who have distance fall into DK_DISTANCES[i]
				player.subscribers.traverse(function(subscriber)
				{
					if (subscriber.character == null)
						return;
					var distance = player.character.distanceToEntity(subscriber.character);
					if (DK_DISTANCES[i].min <= distance && distance < DK_DISTANCES[i].max)
					{
						//console.log("dead reckoning exceeded");
						that.unicast(subscriber.connID, movementCorrectMsg);
					}
				}); 
				
				//correct the predicted version
				player.charPredict[i].correctMovement(
					movementCorrectMsg.x, movementCorrectMsg.y, 
					movementCorrectMsg.dirx, movementCorrectMsg.diry,
					false);
			}//if (error > DK_THREASHOLDS[i])
		}//for (var i = 0; i < NUM_DK_VERSIONS; ++i)
	}//if (SERVER_USE_DK)
	
	//update health
	if (player.needUpdateHPToClients(elapsedTime))
	{
		var dHPPos = managedWrapper.getPosHPChange();//positive HP change since last update
		var dHPNeg = managedWrapper.getNegHPChange();//negative HP change since last update
		if (dHPPos != 0 || dHPNeg != 0)
		{
			var msg = new EntityHPChange(player.playerID, dHPPos, dHPNeg);
			//notify player and his subscribers
			this.unicast(player.connID, msg);
			this.multicast(player.subscribers, msg);
			managedWrapper.resetHPChange();//reset the HP change recording
		}
	}
	
	//notify current effects on player
	var newEffects = player.character.getNewEffectList();
	newEffects.traverse(function(newEffect){
		var msg = new AddEffectMsg(newEffect);
		that.unicast(player.connID, msg);
		that.multicast(player.subscribers, msg);
	});
}

Server.prototype.updatePlayerRespawn = function(player, elapsedTime){
	if (player.respawnWaitTime > 0)
	{
		player.respawnWaitTime -= elapsedTime;
		if (player.respawnWaitTime <= 0)
		{
			//start repawning player
			player.respawnDuration = RESPAWN_DURATION;//this is the duration that player is immortal.
			player.respawnWaitTime = 0;
			
			player.character.setHP(player.character.getMaxHP());
			this.randomPlacePlayerChar(player);
			
			//notify all players
			this.broadcast(new EntityRespawnMsg2(player.character));
		}
	}
	else if (player.respawnDuration > 0)
	{
		player.respawnDuration -= elapsedTime;
		if (player.respawnDuration <= 0)//respawn period has ended
		{
			player.respawnDuration = 0;
			player.character.setAlive(true);
			//notify all players
			this.broadcast(new EntityRespawnEndMsg(player.playerID));
		}
	}
	else //player has died but repawning waiting timer has started yet
	{
		player.respawnWaitTime = RESPAWN_WAIT_TIME;
			
		//reset HP change
		player.character.managedWrapper.resetHPChange();
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
		player.character = new WarriorCell(this.director, player.playerID, 0, 0);
		break;
	case "LeechVirus":
		player.character = new LeechVirus(this.director, player.playerID, 0, 0);
		break;
	}
	
	//insert to "character to player" map
	this.playerCharMap[player.character.getHashKey()] = player;
	
	//randomize the character's position
	this.randomPlacePlayerChar(player);
}

Server.prototype.deletePlayerCharacter = function(player){
}

//randomly put the player's character to a position
Server.prototype.randomPlacePlayerChar = function(player){
	var spawnPosition = new b2Vec2(0, 0);
	//list of possible spawn points for the entity
	var spawnPoints = player.character.getSide() == Constant.VIRUS? this.director.getVirusSpawnPoints(): this.director.getCellSpawnPoints();
	
	//random spawning point
	var rand = Math.random();//between [0..1)
	var idx = Math.round(rand * (spawnPoints.length - 1));
	var spawnPoint = spawnPoints[idx];
	spawnPosition.x = spawnPoint.x;
	spawnPosition.y = spawnPoint.y;
	
	player.character.setPosition(spawnPosition);
	
	if (SERVER_USE_DK)//if server use dead reckoning
	{
		//now create dummy prediction versions
		for (var i = 0; i < NUM_DK_VERSIONS; ++i){
			
			//we already have an old instance
			//create the new dummy entity for dead reckoning
			player.charPredict[i] = new MovingEntity( this.director, -1, 0, 
					Constant.NEUTRAL, 
					player.character.getWidth(), player.character.getHeight(), 
					player.character.getPosition().x, player.character.getPosition().y, 
					player.character.getOriSpeed(), 
					null);
		}//for (var i = 0; i < NUM_DK_VERSIONS; ++i)
	}//if SERVER_USE_DK
}


Server.prototype.onEntityDestroyed = function(entityID){
	//delete from "character to player" map
	var entity = this.director.getKnownEntity(entityID);
	if (entity != null && entity.getHashKey() in this.playerCharMap)
	{
		delete this.playerCharMap[entity.getHashKey()];
	}
	
	//notify all players that entity has been destroyed
	this.broadcast(new EntityDestroyMsg(entityID));
}

//notify all players about the death of an entity
Server.prototype.notifyEntityDeath = function(entityID){
	this.broadcast(new EntityDeathMsg(entityID));
}

//notify all players about the new power up on the map
Server.prototype.notifyPowerUpAppear = function(powerUp){
	this.broadcast(new EntitySpawnMsg2(powerUp));
}

//notify all players about the power up's change in direction
Server.prototype.notifyPowerUpChangedDir = function(powerUp){
	//console.log('notifyPowerUpChangedDir: ' + powerUp.getVelocity().x + ", " + powerUp.getVelocity().y);
	this.broadcast(new EntityMoveMentMsg(powerUp));
}

Server.prototype.changeKillCount = function(killer, killed){
	//the reason we use entity's hash key instead of entity's id
	//is because id may be reused when player disconnected and another player comes in.
	//while hash key is guaranteed to be unique
	if (killer.getHashKey() in this.playerCharMap){
		var killingPlayer = this.playerCharMap[killer.getHashKey()];
		killingPlayer.killCount ++;
		
		//notify player
		this.unicast(killingPlayer.connID, new KillDeathCountMsg(true, killingPlayer.killCount));
	}
	if (killed.getHashKey() in this.playerCharMap){
		var killedPlayer = this.playerCharMap[killed.getHashKey()];
		killedPlayer.deathCount ++;
		
		//notify player
		this.unicast(killedPlayer.connID, new KillDeathCountMsg(false, killedPlayer.deathCount));
	}
}

//this will handle message that this.director forwards back to Server.
//return true if you dont want the this.director to handle this message
Server.prototype.handleMessage = function(msg)
{
	var that = this;
	switch(msg.type)
	{
	case MsgType.PLAYER_READY:
		{
			var player = this.players[msg.playerID];
			
			//create ping update interval to send the ping message every <PING_INTERVAL>
			player.pingUpdateInterval = setInterval(function(player) {
				that.unicast(player.connID, new PingMsg(Utils.getTimestamp()));
			}, PING_INTERVAL, player);
			
			//create character
			this.spawnPlayerCharacter(player);
			//notify all players' clients
			this.broadcast(new EntitySpawnMsg2(player.character));
			
			//let player know current game time
			this.unicast(player.connID, new GameDurationMsg(this.director.getMapDuration()));
			
			//now let the new player know about other entities
			var entities = this.director.getKnownEntities();
			for (var id in entities){
				var entity = entities[id];
				if (id != player.playerID)
					this.unicast(player.connID, new EntitySpawnMsg2(entity));
			}
		}
		break;
	case MsgType.PLAYER_DISCONNECT://player disconnects in the middle of the game
		{
			var entities = this.director.getKnownEntities();
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
			var player = this.players[msg.entityID];
			//check if the attack range is valid
			var entities = this.director.getKnownEntities();
			if (msg.targetID in entities == false || entities[msg.targetID].isAlive() == false ||
				!entities[msg.entityID].canAttack(msg.skillIdx, entities[msg.targetID]))
			{
				//cannot attack because of out of range
				this.unicast(player.connID, new AttackOutRangeMsg());//tell player
				
				//prevent the this.director from processing this message
				return true;
			}
			//check if skill is ready or whether the player's character is alive or not
			else if (entities[msg.entityID].isAlive() == false || entities[msg.entityID].getSkill(msg.skillIdx).getCooldown() > 0)
			{
				//cannot attack because of not ready skill
				this.unicast(player.connID, new SkillNotReadyMsg());//tell player
				
				//prevent the this.director from processing this message
				return true;
			}
			//notify back to client
			this.unicast(player.connID, msg);
			
			//forward it to all interested clients
			this.multicast(player.subscribers, msg);
		}
		break;
	case MsgType.FIRE_TO:
		{
			var player = this.players[msg.entityID];
			//check if the attack range is valid
			var entities = this.director.getKnownEntities();
			if (!entities[msg.entityID].canFireTo(msg.skillIdx, msg.destx, msg.desty))
			{
				//cannot attack because of out of range
				this.unicast(player.connID, new AttackOutRangeMsg());//tell player
				
				//prevent the this.director from processing this message
				return true;
			}
			//check if skill is ready or whether the player's character is alive or not
			else if (entities[msg.entityID].isAlive() == false || entities[msg.entityID].getSkill(msg.skillIdx).getCooldown() > 0)
			{
				//cannot attack because of not ready skill
				this.unicast(player.connID, new SkillNotReadyMsg());//tell player
				
				//prevent the this.director from processing this message
				return true;
			}
			//notify back to client
			this.unicast(player.connID, msg);
			
			//forward it to all interested clients
			this.multicast(player.subscribers, msg);
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
		if (player.className != msg.className)
		{
			//remove old prediction versions' instances
			for (var i = 0; i < NUM_DK_VERSIONS; ++i)
			{
				player.charPredict[i] = null;
			}
		}
		player.className = msg.className;
		this.updatePlayersInfo();
		break;
	case MsgType.CHANGE_FAKE_DELAY:
		player.fakeDelay += msg.dDelay;
		if (player.fakeDelay < 0)
			player.fakeDelay = 0;
		break;
	case MsgType.START:
		this.beginStartGame(msg.initXML);
		break;
	case MsgType.JOIN:
		this.sendMsgViaChannel(this.connections[player.connID].socket, new StartGameMsg(this.gameInitXML));
		break;
	default:
		this.director.postMessage(msg);//forward it to the director
	}
}

Server.prototype.updatePlayersInfo = function() {
	var virusCount = 0;
	var cellCount = 0;
	for (var i in this.players) {
		//if (this.players[i] !== player) {
			if (this.players[i].className == "WarriorCell") {
				cellCount ++;
			} else if (this.players[i].className == "LeechVirus") {
				virusCount ++;
			}
		//}
	}
	this.broadcastAll(new PlayersInfoMsg(virusCount, cellCount)); //notify player about other players classes
}

Server.prototype.start = function (httpServer) {
	
	try {
		var that = this;
		var http = require('http');
		var sockjs = require('sockjs');
		var sock = sockjs.createServer();

		// reinitialize
		EntityHashKeySeed.reset();
		this.gameStarted = false;
		this.count = 0;
		this.availPIDList = new Utils.List();
		for (var i = 0 ; i < Constant.SERVER_MAX_CONNECTIONS; ++i)
			this.availPIDList.insertBack(i);
		this.director = null;
		this.players = new Object;
		this.playerCharMap = new Object;
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
				
				that.updatePlayersInfo();
				
				if (player.isHost)
					that.sendMsgViaChannel(conn, new YouHostMsg());//tell player that he is the host
				
				if (that.gameStarted)//game already started. let him know
					that.sendMsgViaChannel(conn, new GameAlreadyStartedMsg());
			}

			// When the client closes the connection to the server/closes the window
			conn.on('close', function () {
				
				that.deletePlayer(conn.id);
				that.updatePlayersInfo();
			});

			// When the client send something to the server.
			conn.on('data', function (data) {
				var message = JSON.parse(data)
				var player = that.connections[conn.id].player;
				if (player.fakeDelay == 0)
					that.onMessageFromPlayer(player, message);
				else{
					//delay the message processing
					setTimeout(function(){
						that.onMessageFromPlayer(player, message);
						},
						player.fakeDelay);
				}
					
			}); // conn.on("data"
		}); // socket.on("connection"

		// Standard code to starts the server and listen
		// for connection
		if (httpServer == null)
		{
			var httpServer = http.createServer();
			sock.installHandlers(httpServer, {prefix:'/nanowar'});
			httpServer.listen(Constant.SERVER_PORT, '0.0.0.0');
		}
		else
		{
			sock.installHandlers(httpServer, {prefix:'/nanowar'});
		}

	} catch (e) {
		console.log("Cannot listen to " + Constant.SERVER_PORT);
		console.log("Error: " + e);
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
	global.Connection = Connection;
}
