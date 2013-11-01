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
        context.style.cursor = "url(./moveCursor.ani), url(./moveCursor.gif), progress";
   
    }
  
    else {
        
        //cursor is attack cursor
  
        context.style.cursor = "url(./attackCursor.ani), url(./attackCursor.png), progress";
      
    }

}

//a function called by Director before the game's update is executed
Client.prototype.preUpdate = function(lastTime, currentTime){
}

//receiving message from server
Client.prototype.onMessage = function(msg){
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
		default:
		if (this.gameStarted)
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
			that.onMessage(message);
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
	this.initNetwork();
	
	this.gameStarted = false;
	this.playerID = -1;
	this.playerClassName = null;
	this.character = null;
}