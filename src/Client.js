"use strict"

function Client(canvasElementID)
{
	this.canvas;
	this.gameStarted;
	this.socket;
	this.playerID;
	this.character;//my character
	
	while(document.readyState !== "complete") {console.log("loading...");};
		
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

	Director.onMove = function (target,flag,x,y) {

	    that.onMove(target,flag,x,y);
	  
      
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
		
		Director.makeCameraFollow(this.character);
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
	    Director.marker = false;
	   // marker will be drawn to mouse click position
	    Director.clickX = x;
	    Director.clickY = y;
	}
	else
	{
	    //send to server

	   
	    this.sendToServer(new AttackMsg(this.character, target));
        //marker will be drawn to where your lock target is
	    Director.marker = true;
	    Director.enemy = target;
	   
	  

	}
}

//handle mouse move, flag=true means mouse cover enemy, =flase otherwise
Client.prototype.onMove = function (target,flag,x,y) {
   
    var firstClass = this.character.getSide();
    var secondClass = target.getSide();
    var underFlag;
    var leaveTarget = false;
    var onTarget = true;
    if (firstClass == secondClass) {
        underFlag = false;
    }
    else {
        underFlag = true;
    }
    var context = document.getElementById("canvas");

   
    if (flag== leaveTarget) {
      
        //cursor is move cursor
        context.style.cursor = "url(...\test2\moveCursor.ani), url(...\test2\moveCursor.gif), progress";
   
    }
  
    if (flag == onTarget&&underFlag) {
        
        //cursor is fire cursor
  
        context.style.cursor = "url(...\test2\attackCursor.ani), url(...\test2\attackCursor.png), progress";
      
    }

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
