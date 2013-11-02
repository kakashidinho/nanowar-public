"use strict"

function Client(canvasElementID)
{
	this.canvas;
	this.gameStarted;
	this.socket;
	this.playerID;
	this.character;//my character
	
	//while(document.readyState !== "complete") {console.log("loading...");};
		
	this.canvas = document.getElementById(canvasElementID);
}

Client.prototype.startGame = function()
{
	var that = this;

	this.gameStarted = true;
	this.sendToServer(new PlayerReadyMsg(this.playerID));//notify server that we are ready to receive in-game messages
	
	Director.onClick = function(x, y, target){
	    that.onClick(x, y, target);
	   
	}

	Director.onMouseEnterExit = function (target,enter,x,y) {

	    that.onMouseEnterExit(target,enter,x,y);
	  
      
	}

	Director.preUpdate = function(lastTime, currentTime){
		that.preUpdate(lastTime, currentTime);
	}
	
	Director.onUpdate = function(lastTime, currentTime){
		that.onUpdate(lastTime, currentTime);
	}
	
	//director's message handling callback
	Director.onMessageHandling = function(msg){
		return that.handleMessage(msg);
	}
	
	Director.startGameLoop(Constant.FRAME_RATE);
}

Client.prototype.endGame = function()
{
	this.gameStarted = false;
	
	Director.endGameLoop();
	//TO DO
}

//spawn an entity
Client.prototype.spawnEntity = function(msg){
	
	var spawn_entity = null;
	
	switch(msg.className)
	{
	case "WarriorCell":
		spawn_entity = new WarriorCell(msg.entityID, msg.x, msg.y);
		break;
	case "LeechVirus":
		spawn_entity = new LeechVirus(msg.entityID, msg.x, msg.y);
		break;
	}
	
	spawn_entity.setHP(msg.hp);
	
	if (msg.entityID == this.playerID)
	{
		//this is my character
		this.character = spawn_entity;
		this.character.setVelChangeListener(this);//listen to the change in the character's movement
		
		Director.setMainCharacter(this.character);
	}
}

//when our character changes his movement
Client.prototype.onVelocityChanged = function(entity){
	//notify server
	this.sendToServer(new EntityMoveMentMsg(entity));
}

Client.prototype.onKeyPress = function(e) {
	/*
	keyCode represents keyboard button
	38: up arrow
	40: down arrow
	37: left arrow
	39: right arrow
	*/
	switch(e.keyCode) {
		case 38: { // Up
			//increase fake delay by 50
			this.sendToServer(new ChangeFakeDelayMsg(50));
			break;
		}
		case 40: { // Down
			//decrease fake delay by 50
			this.sendToServer(new ChangeFakeDelayMsg(-50));
			break;
		}
	}
}

//handle mouse click event
Client.prototype.onClick = function(x, y, target){
	if (this.character == null || !this.character.isAlive())
		return;
	if (target == null)
	{
	    //will start moving to new destination
	 
	    Director.postMessage(new MoveToMsg(this.character, x, y));
	    
		//mark the destination, just for the visual indication
		Director.markDestination(x, y);
	}
	else
	{	
		if (target.getSide() != Constant.NEUTRAL && target.getSide() != 
			this.character.getSide())
		{
			//send attacking message to server
			this.sendToServer(new AttackMsg(this.character, target));
		
			//mark the target, just for the visual indication
			Director.markTarget(target);
		}

	}
}

//handle mouse enters or exits a target
Client.prototype.onMouseEnterExit = function (target,enter,x,y) {
   
    var enemy = target.getSide() != Constant.NEUTRAL && target.getSide() != this.character.getSide();
   
    var context = this.canvas;

    if (!enemy || !enter) { 
        //cursor is move cursor
        context.style.cursor = "url(./moveCursor.ani) 16 16, url(./moveCursor.gif) 16 16, progress";
    }
    else { 
        //cursor is attack cursor
        context.style.cursor = "url(./attackCursor.ani) 16 16, url(./attackCursor.png) 16 16, progress";
    }

}

//a function called by Director before the game's update is executed
Client.prototype.preUpdate = function(lastTime, currentTime){
}

//a function called by Director after the game's update is executed
Client.prototype.onUpdate = function(lastTime, currentTime){
}

//this will handle message that Director forwards back to Client.
//return true if you dont want the Director to handle this message
Client.prototype.handleMessage = function(msg){
	switch(msg.type)
	{
		case MsgType.PING_NOTIFICATION:
			Director.updatePingValue(msg.ping);
			break;
		case MsgType.ATTACK_OUT_OF_RANGE:
			Director.displayOutOfRangeTxt(true);
			Director.markTarget(null);
			break;
		case MsgType.ATTACK:
			//should erase the "out of range" text if it is displaying
			Director.displayOutOfRangeTxt(false);
			Director.markTarget(null);
			break;
	}
	return false;
}

//receiving message from server directly
Client.prototype.onMessageFromServer = function(msg){
	var that = this;
	switch(msg.type)
	{
		case MsgType.PLAYER_ID://my ID
			this.playerID = msg.playerID;
			break;
		case MsgType.PLAYER_CLASS:
			this.playerClassName = msg.className;
			break;
		case MsgType.START:
			//init director
			Director.init(canvas, canvas.width, canvas.height, msg.initXML, function() {
				Director.dummyClient = true;//most processing will be done by server
				that.startGame();//start after the Director has finished its initialization
			})
		break;
		case MsgType.ENTITY_SPAWN:
			{
				this.spawnEntity(msg);
			}
			break;
		case MsgType.PING:
			this.sendToServer(msg);//reply to server
			break;
		default:
		if (this.gameStarted)//forward to director
			Director.postMessage(msg);
	}
}

/*
 *  method: initNetwork(msg)
 *
 * Connects to the server and initialize the various
 * callbacks.
 */
Client.prototype.initNetwork = function() {
	var that = this;
	// Attempts to connect to game server
	try {
		this.socket = new SockJS("http://" + Constant.SERVER_NAME + ":" + Constant.SERVER_PORT + "/nanowar");
		this.socket.onmessage = function (e) {
			var message = JSON.parse(e.data);
			that.onMessageFromServer(message);
		}
	} catch (e) {
		console.log("Failed to connect to " + "http://" + Constant.SERVER_NAME + ":" + Constant.SERVER_PORT);
	}
}

/*
 *  method: sendToServer(msg)
 *
 * The method takes in a JSON structure and send it
 * to the server, after converting the structure into
 * a string.
 */
Client.prototype.sendToServer = function (msg) {
	this.socket.send(JSON.stringify(msg));
}

Client.prototype.start = function()
{
	var that = this;
	
	this.initNetwork();
	
	//add event listeners
	document.addEventListener("keydown", function(e) {
            that.onKeyPress(e);
            }, false);
	
	this.gameStarted = false;
	this.playerID = -1;
	this.playerClassName = null;
	this.character = null;
}
