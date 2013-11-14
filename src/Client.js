"use strict"

var CLIENT_USE_DK = false;//do we use client side dead reckoning

function Client(canvasElementID)
{
	this.canvas;
	this.gameStarted;
	this.socket;
	this.playerID;
	this.character;//my character
	this.charPredict;//prediction version of my character, for dead reckoning
	this.dk_threshold;//dead reckoning threshold
	this.skillSlots;
	this.skillCtrlKeyDown;//skill control keys
	this.ping;
	this.atkCursor = false;
	this.isGuest;//guest can only join the game
	this.initXMLFile;
		
	//while(document.readyState !== "complete") {console.log("loading...");};
		
	this.canvas = document.getElementById(canvasElementID);
	
	canvas.width  = document.documentElement.clientWidth || window.innerWidth;
	canvas.height  = document.documentElement.clientHeight || window.innerHeight;
}

Client.prototype.setInitFile = function(xmlFile){
	this.initXMLFile = xmlFile;
}

Client.prototype.gameReady = function()
{
	var that = this;

	this.gameStarted = true;
	this.sendToServer(new PlayerReadyMsg(this.playerID));//notify server that we are ready to receive in-game messages
	
	Director.onClick = function(x, y, target, isControlDown){
	    that.onClick(x, y, target, isControlDown);
	   
	}

	Director.onMouseMove = function (target,x,y) {

	    that.onMouseMove(target,x,y);
	  
      
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

	Director.onBeginTouchSkillIcon = function (skillid) {
	    that.onSelectSkill(skillid);
	}


	Director.onEndTouchSkillIcon = function (skillid) {
	    that.onDropSkill(skillid);
	}
	
	//Director.startGameLoop(Constant.FRAME_RATE);
}

Client.prototype.endGame = function(virusesRank, cellsRank)
{
	this.gameStarted = false;
	
	Director.stopGame(virusesRank, cellsRank);
}

Client.prototype.onClassChosen = function(className){
	this.playerClassName = className;
	Director.displayClassName(className);
	this.sendToServer(new PlayerClassMsg(className));
}

Client.prototype.enterGame = function(){
	if (this.isGuest)
	{
		this.sendToServer(new JoinMsg());
		Director.hideStartButton();
	}
	else
	{
		//tell server to start the game
		this.sendToServer(new StartGameMsg(this.initXMLFile));
	}
}

//spawn an entity
Client.prototype.spawnEntity = function(msg){
	
	var spawn_entity = null;
	
	switch(msg.className)
	{
	case "WarriorCell":
		spawn_entity = new WarriorCell(Director, msg.entityID, msg.x, msg.y);
		break;
	case "LeechVirus":
		spawn_entity = new LeechVirus(Director, msg.entityID, msg.x, msg.y);
		break;
	case "HealingDrug":
		spawn_entity = new HealingDrug(Director, msg.entityID, msg.x, msg.y, msg.dirx, msg.diry);
		break;
	case "MeatCell":
		spawn_entity = new MeatCell(Director, msg.entityID, msg.x, msg.y, msg.dirx, msg.diry);
		break;
	}
	
	spawn_entity.setHP(msg.hp);
	
	if (msg.entityID == this.playerID)
	{
		//this is my character
		this.character = spawn_entity;
		this.character.setVelChangeListener(this);//listen to the change in the character's movement
		
		Director.setMainCharacter(this.character);
		
		if (CLIENT_USE_DK)
		{
			//create the dummy entity for dead reckoning
			this.charPredict = new MovingEntity( Director, 
				-1, 0, 
				Constant.NEUTRAL, 
				this.character.getWidth(), this.character.getHeight(), 
				this.character.getPosition().x, this.character.getPosition().y, 
				this.character.getOriSpeed(), 
				null);
		}
	}
}

//when our character changes his movement
Client.prototype.onVelocityChanged = function(entity){
	if (CLIENT_USE_DK && entity.isMoving() == false)//should update server
		this.sendToServer(new EntityMoveMentMsg(entity));
}

Client.prototype.onKeyDown = function(e) {
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
		case 49: { //"1"
			this.skillCtrlKeyDown[0] = true;
			break;
		}
		
		case 50: { //"2"
			this.skillCtrlKeyDown[1] = true;
			break;
		}
	}
}

Client.prototype.onKeyUp = function(e) {
	/*
	keyCode represents keyboard button
	38: up arrow
	40: down arrow
	37: left arrow
	39: right arrow
	*/
	switch(e.keyCode) {
		case 49: { //"1"
			this.skillCtrlKeyDown[0] = false;
			break;
		}
		
		case 50: { //"2"
			this.skillCtrlKeyDown[1] = false;
			break;
		}
	}
}


Client.prototype.onSelectSkill=function(skillid){
    this.skillCtrlKeyDown[skillid]=true;
}

Client.prototype.onDropSkill = function (skillid) {

    this.skillCtrlKeyDown[skillid] = false;
}
//handle mouse click event
Client.prototype.onClick = function(x, y, target, isControlDown){
	if (this.character == null)
		return;
	
	var skillIdx;
	//check if player is holding down some skill's key
	if (this.skillCtrlKeyDown[0])
		skillIdx = this.skillSlots[0];
	else if (this.skillCtrlKeyDown[1])
		skillIdx = this.skillSlots[1];
	else 
		skillIdx = -1;
	
	if (target == null && skillIdx == -1)
	{
	    //will start moving to new destination
		var msg = new MoveToMsg(this.character, x, y);
		if (CLIENT_USE_DK == false)
			this.sendToServer(msg);//send to server
	    Director.postMessage(msg);//and simulate the movement locally
	    
		//mark the destination, just for the visual indication
		Director.markDestination(x, y);
	}
	else if (target != null)
	{	
		if (skillIdx == -1)
			skillIdx = this.skillSlots[0];
			
		if (target.getSide() != Constant.NEUTRAL && target.getSide() != 
			this.character.getSide() && this.character.getSkill(skillIdx).getCooldown() == 0)
		{
			//send attacking message to server
			this.sendToServer(new AttackMsg(this.character, target, skillIdx));
		
			//mark the target, just for the visual indication
			Director.markTarget(target);
		}

	}
	else if (this.character.getSkill(skillIdx).getCooldown() == 0)
	{
		//send firing message to server
		this.sendToServer(new FireToMsg(this.character, x, y, skillIdx));
		
		//mark the firing target destination, just for the visual indication
		Director.markFireDest(x, y);
	}
}

//handle mouse move
Client.prototype.onMouseMove = function (target,x,y) {
   
    var enemy = target != null && target.getSide() != Constant.NEUTRAL && target.getSide() != this.character.getSide();
   
    var context = this.canvas;

    if (!enemy) {
		if (this.atkCursor)
		{
			this.atkCursor = false;
			//cursor is move cursor
			context.style.cursor = "url(./moveCursor.ani) 16 16, url(./moveCursor.gif) 16 16, progress";
		}
    }
    else { 
		if (!this.atkCursor)
		{
			this.atkCursor = true;
			//cursor is attack cursor
			context.style.cursor = "url(./attackCursor.ani) 16 16, url(./attackCursor.png) 16 16, progress";
		}
    }

}

//a function called by Director before the game's update is executed
Client.prototype.preUpdate = function(lastTime, currentTime){
}

//a function called by Director after the game's update is executed
Client.prototype.onUpdate = function(lastTime, currentTime){
	if (this.character != null)
	{	
		if(!this.character.isAlive()){
			if (this.charPredict != null)
			{
				//destroy the dummy entity since our character is dead
				this.charPredict.destroy();
				this.charPredict = null;
			}
		}
		else if (CLIENT_USE_DK){
			
			//update predicted version
			this.charPredict.update(currentTime - lastTime);
		
			//dead reckoning
			var predictPos = this.charPredict.getPosition();
			var error = this.character.distanceVecTo(predictPos).Length();
			
			//error exceeded
			if (error > this.dk_threshold)
			{
				var movementCorrectMsg = new EntityMoveMentMsg(this.character);
			
				//notify server
				this.sendToServer(movementCorrectMsg);
				
				//correct the predicted version
				this.charPredict.correctMovement(
					movementCorrectMsg.x, movementCorrectMsg.y, 
					movementCorrectMsg.dirx, movementCorrectMsg.diry,
					false);
			}
		}//else if (CLIENT_USE_DK)
		
		//display skills' info
		Director.displaySkillInfos(this.skillSlots);
	}
}

//this will handle message that Director forwards back to Client.
//return true if you dont want the Director to handle this message
Client.prototype.handleMessage = function(msg){
	switch(msg.type)
	{
		case MsgType.PING_NOTIFICATION:
			Director.updatePingValue(msg.ping);
			this.ping = msg.ping;
			break;
		case MsgType.ATTACK_OUT_OF_RANGE:
			Director.displayOutOfRangeTxt();
			Director.hideTargetMark();
			break;
		case MsgType.SKILL_NOT_READY:
			Director.displaySkillNotReadyTxt();
			Director.hideTargetMark();
			break;
		case MsgType.ATTACK:
		case MsgType.FIRE_TO:
			if (msg.entityID == this.playerID)
			{
				//should erase the "out of range"/"skill is not ready" text if it is displaying
				Director.hideAtkFailTxt();
				Director.hideTargetMark();
				
				//due to lag, we must reduce the cooldown
				var skill = this.character.getSkill(msg.skillIdx);
				skill.reduceCooldown(this.ping / 2.0);
			}
			break;
		case MsgType.ADD_EFFECT:
			switch (msg.className){
				case 'HealingEffect':
					{
						var entities = Director.getKnownEntities();
						var target = entities[msg.affectedTargetID];
						var effect = new HealingEffect(Director, target, 0);//2nd parameter is zero, since this is just for displaying
						target.addEffect(effect);
						return true;//dont need director to do any more work
					}
			}
			break;
		case MsgType.ENTITY_DEATH:
			Director.notifyEntityDeath(msg.entityID);
			break;
		case MsgType.ENTITY_RESPAWN:
			Director.notifyEntityStartRespawn(msg.entityID);
			break;
		case MsgType.ENTITY_RESPAWN_END:
			Director.notifyEntityEndRespawn(msg.entityID);
			break;
		case MsgType.KILL_COUNT:
			Director.notifyMyKillCount(msg.count);
			break;
		case MsgType.DEATH_COUNT:
			Director.notifyMyDeathCount(msg.count);
			break;
		case MsgType.END:
			this.endGame(msg.virusesRank, msg.cellsRank);
			break;
		case MsgType.GAME_DURATION:
			Director.updateGameDuration(msg.duration);
			break;
		case MsgType.IN_GAME_PLAYERS_INFO:
			Director.updateIngameVirusCellCnt(msg.virusCount, msg.cellCount);
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
			Director.displayClassName(this.playerClassName);
			break;
		case MsgType.GAME_ALREADY_START:
			if (this.isGuest)
			{
				Director.displayStartButton(false);
			}
			else{
				//host should enter the game immediately
				this.sendToServer(new JoinMsg());
			}
			break;
		case MsgType.START:
			if (!this.gameStarted && Director.isInMenu()){
				//console.log("server responded with start");
				this.initXMLFile = msg.initXML;
				Director.loadMap(msg.initXML, function() {
					Director.dummyClient = true;//most processing will be done by server
					that.gameReady();//start after the Director has finished its initialization
				})
			}
			else//display join button
				Director.displayStartButton(false);
				
		break;
		case MsgType.ENTITY_SPAWN:
			{
				this.spawnEntity(msg);
			}
			break;
		case MsgType.PING:
			this.sendToServer(msg);//reply to server
			break;
		case MsgType.YOU_ARE_HOST://I am host
			Director.displayStartButton(true);
			this.isGuest = false;
			break;
		case MsgType.CONNECTED_PLAYERS_INFO:
			Director.updatePlayersInfo(msg);
			break;
		case MsgType.END://game ended, hide "join" button
			if (!this.gameStarted && this.isGuest){
				Director.hideStartButton();
				break;
			}
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
		var server_name = Constant.SERVER_NAME;
		if (server_name == 'localhost')
		{
			var url = window.location.href;
			server_name = url.substr(url.indexOf('//') + 2);
			server_name = server_name.substr(0, Math.min(server_name.indexOf(':'), server_name.indexOf('/')));
		}
		this.socket = new SockJS("http://" + server_name + ":" + Constant.SERVER_PORT + "/nanowar");
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
	
	//init menu
	var onClassChosenFunc = function(className){
		that.onClassChosen(className);
	}
	
	var enterGameFunc = function(){
		that.enterGame();
	}
	Director.initMenu(canvas, canvas.width, canvas.height, onClassChosenFunc, enterGameFunc);
	
	//init network
	this.initNetwork();
	
	//add event listeners
	document.addEventListener("keydown", function(e) {
            that.onKeyDown(e);
            }, false);
	document.addEventListener("keyup", function(e) {
            that.onKeyUp(e);
            }, false);
	
	this.gameStarted = false;
	this.playerID = -1;
	this.playerClassName = null;
	this.character = null;
	this.skillSlots = [0, 1];
	this.skillCtrlKeyDown = [false, false];
	this.charPredict = null;
	this.dk_threshold = 2;//initial dead reckoning threshold
	this.ping = 0;
	this.isGuest = true;
	this.initXMLFile = 'init.xml';//default map
	
	
	EntityHashKeySeed.reset();
}


