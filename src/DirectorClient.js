/*
this code is used by client
*/	

/*-------Director instance on client side-------*/	
var Director = {
	caatDirector : null,
	displayWidth : null,
	displayHeight: null,


	ingameScene : null,
	startGameLoop : function(frameRate) {
		CAAT.loop(frameRate);
	},
	endGameLoop : function() {
		CAAT.endLoop();
	}
};

Director.initMenu = function(canvas, displayWidth, displayHeight, onClassChosenFunc, onEnterFunc) {
	var menuScene;
	var menuContainer;
	var menuImages;
	var startButton;
	var startButtonText;
	var classText;
	this.displayWidth = displayWidth;
	this.displayHeight = displayHeight;

    //enable multitouch
	CAAT.TOUCH_BEHAVIOR = CAAT.TOUCH_AS_MULTITOUCH;
		
	// create a CAAT director object for handling graphics
	this.caatDirector = new CAAT.Foundation.Director().initialize(
			displayWidth,    // pixels wide
			displayHeight,    // pixels across
			canvas
	);
	
	var caatDirector = this.caatDirector;
	
	this.displayClassName = function(className){
		classText.setText('Your current class is: ' + className);
	}
	
	this.displayStartButton = function(isStartButton){
		startButton.setVisible(true);
		startButtonText.setVisible(true);
		if (isStartButton) {
			startButtonText.setText('Start');
		} else {
			startButtonText.setText('Join');
		}
	}
	
	this.hideStartButton = function(){
		startButton.setVisible(false);
		startButtonText.setVisible(false);
	}
	
	this.isInMenu = function(){
		return caatDirector.getCurrentSceneIndex() == 0;
	}
	
	this._switchToMenu = function(){
		caatDirector.easeInOut( 0, CAAT.Foundation.Scene.EASE_SCALE, CAAT.Foundation.Actor.ANCHOR_CENTER, 
			1, CAAT.Foundation.Scene.EASE_SCALE, CAAT.Foundation.Actor.ANCHOR_CENTER, 
			1000, true, null, null)
	}
	
	this.updatePlayersInfo = function(msg) {
		menuContainer.virus_count.setText(msg.virusCount.toString());
		menuContainer.cell_count.setText(msg.cellCount.toString());
	}
	
	menuScene = caatDirector.createScene();
	ingameScene = caatDirector.createScene();
	
	menuContainer = new CAAT.ActorContainer()
		.setBounds(caatDirector.width/2 - 350, caatDirector.height/2 - 300, 700, 600)
		.setFillStyle('white');
	
	startButton = new CAAT.Foundation.UI.ShapeActor().
                setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_RECTANGLE).
				setSize(100, 50).
				setVisible(false).
				setFillStyle('#00ff00').
				centerOn(menuContainer.width/2, 120);
				
	startButton.mouseUp = function(mouse){
		onEnterFunc();

	};
	
	startButton.touchEnd= function (touch) {
	    onEnterFunc();
	}
				
	menuContainer.addChild(startButton);
	
	/* start button text */	
	startButtonText =  new CAAT.Foundation.UI.TextActor()
							.setText('Start')
							.setFont("18px sans-serif")
							.setTextFillStyle('#000000')
							.setVisible(false)
							.enableEvents(false)
							.centerOn(startButton.x + startButton.width/2, startButton.y + startButton.height/2);

	menuContainer.addChild(startButtonText);
	
	/*class name text*/
	classText =  new CAAT.Foundation.UI.TextActor()
							.centerOn(menuContainer.width/2, 36)
							.setText('Your current class is: ')
							.setFont("15px sans-serif")
							.setAlign("center")
							.setTextFillStyle('#000000')
							.enableEvents(false)
							;
	
	menuContainer.addChild(classText);
					
	menuImages = [{id : 'menuButtons', url: 'menuButtons.png'}];
	
	new CAAT.ImagePreloader().loadImages(
			menuImages,
			function (counter, images) {
				if (counter == images.length)
				{
					//finish loading images
					caatDirector.setImagesCache(images);
					
					var buttonsSprite = new CAAT.SpriteImage().initialize(
						caatDirector.getImage('menuButtons'), 2, 3 );
					
					var font= "32px sans-serif";
					var menuTitle =  new CAAT.Foundation.UI.TextActor()
													.centerOn(menuContainer.width/2, 200)
													.setText("Select Your Side")
													.setFont(font)
													.setAlign("center")
													.setTextFillStyle('#000000')
													.enableEvents(false);
													
					menuContainer.addChild(menuTitle);
					
					var b1= new CAAT.Actor().setAsButton(
						buttonsSprite.getRef(), 0, 1, 2, 0, function(button) {
									onClassChosenFunc('LeechVirus');
							}
						)
						.centerOn(menuContainer.width/2 - 150, 350);
						
					var b1_count =  new CAAT.Foundation.UI.TextActor()
													.centerOn(b1.x + b1.width/2, b1.y + b1.height + 20)
													.setText("0")
													.setFont(font)
													.setTextFillStyle('#000000')
													.enableEvents(false);
					
					var b2= new CAAT.Actor().setAsButton(
						buttonsSprite.getRef(), 3, 4, 5, 3, function(button) {
									onClassChosenFunc('WarriorCell');
							}
						)
						.centerOn(menuContainer.width/2 + 150, 350);
						
					var b2_count =  new CAAT.Foundation.UI.TextActor()
													.centerOn(b2.x + b2.width/2, b2.y + b2.height + 20)
													.setText("0")
													.setFont(font)
													.setTextFillStyle('#000000')
													.enableEvents(false);

					menuContainer.addChild(b1);
					menuContainer.addChild(b2);
					menuContainer.addChild(b1_count);
					menuContainer.addChild(b2_count);
					menuContainer.virus_count = b1_count;
					menuContainer.cell_count = b2_count;
					
					menuScene.addChild(menuContainer);
					
					Director.startGameLoop(Constant.FRAME_RATE);
				}
			}
		);

}

Director.loadMap = function(initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var caatDirector = this.caatDirector;
	var displayWidth = this.displayWidth;
	var displayHeight = this.displayHeight;
	var spriteSheetList;
	var spriteModuleList;
	var visualEntityList;
	var lastUpdateTime;
	var currentSceneTime;//for using during update
	var xmlRequest;
	var mainCharacter;//the main entity in the game
	var targetEntity;//the attacking target of main character
	var gameDuration;
	var numNonObstacleTiles;
	
	var locked;//lock during game update
	
	var gameSceneRoot;//scene root
	
	/*-------GUI items------*/
	var attackFailText;//text the display the reason why attack failed
	var pingText;//ping value text
	var durationText;
	var idText;
	var hpText;
	var killText;
	var deathText;
	var skillIcons;
	var skillIconMasks;
	
	/*------scene items-----*/
	var worldNode;//scene's world node
	var destMark ;//movement's destination mark
	var targetMark; //target mark
	
	var that = this;

	Director.onClick;//on mouse click callback function. should be function(mouseX, mouseY, clickedEntity, isControlButtonDown)
	Director.onMouseEnterExit;//on mouse enter/exit callback function
	Director.onMouseMove;//on mouse move callback function
	Director.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	Director.preUpdate;//pre-update callback function
	Director.onBeginTouchSkillIcon;// ontouch event for skill icon
	Director.onEndTouchSkillIcon;//   ontouchend event for skill icon
	//init base instance
	DirectorBase.call(this);
	
	/*------------initialize xml file request-------------------*/
	xmlRequest = new XMLHttpRequest();
	
	/*-------------------------------*/
	//no target to follow
	mainCharacter = null;
	targetEntity = null;
	
		
	//initially, no callbacks
	Director.onClick = function (x, y, target, isControlButtonDown) { };//do nothing
	Director.onMouseEnterExit = function (target, enter,x,y) { };//do nothing
	Director.onMouseMove = function(entity, x, y) {}
	Director.onUpdate = undefined;
	Director.preUpdate = undefined;
	Director.onBeginTouchSkillIcon = function (skillId) { };//do nothing here
	Director.onEndTouchSkillIcon = function (skillId) { };//do nothing
	//no locking yet
	locked = false;
	
	gameDuration = 0;
	
	//make camera follow an entity
	Director.setMainCharacter = function(entity)
	{
		mainCharacter = entity;
		
		if (entity != null)
			idText.setText("Your ID: " + entity.getID());
	}
	
	//mark the destination, the mark will disappear after the main character stop moving
	Director.markDestination = function(x, y){
		destMark.setVisible(true);
		destMark.centerAt(x, y);
	}
	
	//mark the target
	Director.markTarget = function(entity){
		targetEntity = entity;
		targetMark.setVisible(true);
	}
	
	//mark the firing destination
	Director.markFireDest = function(x, y){
		targetMark.centerAt(x, y);
		targetMark.setVisible(true);
	}
	
	Director.hideTargetMark = function(){
		targetEntity = null;
		targetMark.setVisible(false);
	}
	
	//mark the target
	Director.markTarget = function(entity){
		targetEntity = entity;
		if (entity != null)
		{
			targetMark.centerAt(entity.getPosition().x, entity.getPosition().y);
			targetMark.setVisible(true);
		}
	}
	
	//get the current marked target
	Director.getMarkedTarget = function(){
		return targetEntity;
	}
	
	//update the ping value on screen
	Director.updatePingValue = function(pingValue){
		pingText.setText("Ping: " + pingValue.toString());
	}
	
	Director.updateGameDuration = function(duration){
		gameDuration = duration;
	}
	
	//display attack "out of range" text
	Director.displayOutOfRangeTxt = function(){
		displayAtkFailTxt("Out of range!!!");
	}
	
	//display "skill is not ready" text
	Director.displaySkillNotReadyTxt = function(){
		displayAtkFailTxt("Skill is not ready!!!");
	}
	
	Director.hideAtkFailTxt = function()
	{
		attackFailText.setVisible(false);
	}
	
	//an entity has died
	Director.notifyEntityDeath = function(entityID){
		if (entityID in this.knownEntity == false)
			return;
		var entity = this.knownEntity[entityID];
		//stop marking this target
		if (entity == targetEntity)
			Director.hideTargetMark();
			
		var visualEntity = entity.visualPart;
		
		if (visualEntity != null)
			visualEntity.commitChanges();//reflect current state of the entity first
			
		if (visualEntity != null)
		{
			visualEntity.playAnimation("die");//play dying animation
			visualEntity.enableEvents(false);//disable mouse click
			visualEntity.setFrameTime(currentSceneTime, 1000);//dying in 1s
		}
	}
	
	//an entity has started respawning
	Director.notifyEntityStartRespawn = function(entityID){
		if (entityID in this.knownEntity == false)
			return;
		var entity = this.knownEntity[entityID];
			
		var visualEntity = entity.visualPart;
			
		if (visualEntity != null)
		{
			visualEntity.playAnimation("normal");//play normal animation
			visualEntity.setVisible(true);
			visualEntity.setFrameTime(0, Number.MAX_VALUE);
			
			//add alpha behaviour
			var alphaBehavior = new CAAT.Behavior.AlphaBehavior().
				setPingPong().
				setCycle(true).
				setFrameTime(0, 1000).
				setValues(0, 1);
				
			visualEntity.addBehavior(alphaBehavior);
		}
	}
	
	//an entity has ended respawning
	Director.notifyEntityEndRespawn = function(entityID){
		if (entityID in this.knownEntity == false)
			return;
		var entity = this.knownEntity[entityID];
			
		var visualEntity = entity.visualPart;
			
		if (visualEntity != null)
		{
			visualEntity.emptyBehaviorList();
			visualEntity.setAlpha(1.0);
			visualEntity.enableEvents(true);
		}
	}
	
	Director.notifyMyKillCount = function(killCount){
		killText.setText("Kills: " + killCount);
	}
	
	Director.notifyMyDeathCount = function(deathCount){
		deathText.setText("Deaths: " + deathCount);
	}
	
	Director.stopGame = function(virusesRank, cellsRank){
		//scene's rank display node
		var rankTableNode = new CAAT.Foundation.ActorContainer()
						.setAlpha(0.7)
						.setFillStyle('#000000');
		rankTableNode.setSize(displayWidth, displayHeight);
		gameSceneRoot.addChild(rankTableNode);	
		gameSceneRoot.setZOrder(rankTableNode, 1000);//always on top
		
		rankTableNode.mouseUp = function(mouse){
			//switch to menu scene
			Director._switchToMenu();
			/*--clean up scene items---*/
			this.setFrameTime(0, 0);
			this.setDiscardable(true);
			this.destroy();
			worldNode.setFrameTime(0, 0);
			worldNode.setDiscardable(true);
			worldNode.destroy();
			gameSceneRoot.setFrameTime(0, 0);
			gameSceneRoot.setDiscardable(true);
			gameSceneRoot.destroy();
			ingameScene.removeChild(gameSceneRoot);
		}

		rankTableNode.touchEnd = function (touch) {

		    Director._switchToMenu();
		    /*--clean up scene items---*/
		    this.setFrameTime(0, 0);
		    this.setDiscardable(true);
		    this.destroy();
		    worldNode.setFrameTime(0, 0);
		    worldNode.setDiscardable(true);
		    worldNode.destroy();
		    gameSceneRoot.setFrameTime(0, 0);
		    gameSceneRoot.setDiscardable(true);
		    gameSceneRoot.destroy();
		    ingameScene.removeChild(gameSceneRoot);
		}
		
		/*----"touch screen to continue" text-------*/
		var alphaBehavior = new CAAT.Behavior.AlphaBehavior().
				setPingPong().
				setCycle(true).
				setFrameTime(0, 1000).
				setValues(0, 1);
		
		var continueText =  new CAAT.Foundation.UI.TextActor()
											.setLocation(displayWidth/2, displayHeight/2)
											.setText('Touch screen to continue')
											.setFont("35px sans-serif")
											.setAlign("center")
											.setTextFillStyle('#ffffff')
											.enableEvents(false)
											;
											
		continueText.addBehavior(alphaBehavior);
		
		rankTableNode.addChild(continueText);
		rankTableNode.setZOrder(continueText, 1001);
		
		
		/*---create record texts--------*/
		var font18= "18px sans-serif";
		/*-----viruses--------*/
		var virusSideText =  new CAAT.Foundation.UI.TextActor()
											.setLocation(10, 36)
											.setText('Viruses: ')
											.setFont(font18)
											.setAlign("left")
											.setTextFillStyle('#ffffff')
											.enableEvents(false)
											;
											
		rankTableNode.addChild(virusSideText);
			
		var record_y = 56;
		var font15= "15px sans-serif";
		/*---rank records-------*/
		for (var i = 0; i < virusesRank.length; ++i){
			var record = virusesRank[i];
			var text = (i + 1) + '.ID: ' + record.id + '		Kills: ' + record.killCount + '		Deaths: ' + record.deathCount;
			var recordText =  new CAAT.Foundation.UI.TextActor()
											.setLocation(13, record_y)
											.setText(text)
											.setFont(font15)
											.setAlign("left")
											.setTextFillStyle('#ffffff')
											.enableEvents(false)
											;
											
			rankTableNode.addChild(recordText);
			
			record_y += 20;
		}
		
		/*---------cells--------------*/
		record_y += 16;
		
		var cellSideText =  new CAAT.Foundation.UI.TextActor()
											.setLocation(10, record_y)
											.setText('Cells: ')
											.setFont(font18)
											.setAlign("left")
											.setTextFillStyle('#ffffff')
											.enableEvents(false)
											;
											
		rankTableNode.addChild(cellSideText);
		
		record_y += 20;
		
		/*---rank records-------*/
		for (var i = 0; i < cellsRank.length; ++i){
			var record = cellsRank[i];
			var text = (i + 1) + '.ID: ' + record.id + '		Kills: ' + record.killCount + '		Deaths: ' + record.deathCount;
			var recordText =  new CAAT.Foundation.UI.TextActor()
											.setLocation(13, record_y)
											.setText(text)
											.setFont(font15)
											.setAlign("left")
											.setTextFillStyle('#ffffff')
											.enableEvents(false)
											;
											
			rankTableNode.addChild(recordText);
			
			record_y += 20;
		}
		
		
		//destroy all entities
		this._baseStop();
	}
	
	//display information about the current skill slots of main character
	Director.displaySkillInfos = function(skillSlots){
		if (mainCharacter == null)
			return;
		for (var i = 0; i < Constant.MAX_SKILL_SLOTS; ++i){
			var skill = mainCharacter.getSkill(skillSlots[i]);
			var spriteModule = spriteModuleList[skill.getSpriteModuleName()];
			var spriteSheet = spriteSheetList[spriteModule.sheetID];
			var iconAnim = spriteModule.animations['icon'];
			var cooldown = skill.getCooldown();
			
			skillIcons[i].setBackgroundImage(spriteSheet, false);
			skillIcons[i].playAnimation(iconAnim);
			
			//use mask to display current cooldown
			if (cooldown == 0)
				skillIconMasks[i].setVisible(false);
			else
			{
				var height = skillIcons[i].height * cooldown / skill.getMaxCooldown();
				skillIconMasks[i].setVisible(true);
				skillIconMasks[i].setLocation(skillIcons[i].x, skillIcons[i].y + skillIcons[i].height - height);
				skillIconMasks[i].setSize(skillIcons[i].width, height);
			}
		}
	}
	
	
	Director._getCAATDirector = function()
	{
		return caatDirector;
	}
	
	Director._getSceneWorldNode = function(){
		return worldNode;
	}
	
	//notification from an entity telling that is hp has changed
	Director._onHPChanged = function(entity, dhp, isNegative){
		entity.visualPart.cumulateHPChange(isNegative? -dhp : dhp);
	}
	
	Director._addEntity = function(entity)
	{
		this._baseAddEntity(entity);//call base method
		
		if (entity.getSpriteModuleName() != null && 
			entity.getSpriteModuleName() in spriteModuleList)
		{
			var visualEntity = new VisualEntity(entity);
		
			visualEntity.listNode = visualEntityList.insertBack(visualEntity);
			
			//if this entity is created during game update, then dont update this entity yet
			visualEntity.locked = locked;
		}
		else
			entity.visualPart = null;//this entity doesn't have any visual aspect. maybe just for physics simulation
	}
	
	Director._destroyEntity = function(entity){
		//stop following this target
		if (entity == mainCharacter)
			mainCharacter = null;
		else if (entity == targetEntity)
			Director.hideTargetMark();
			
		var visualEntity = entity.visualPart;
		
		if (visualEntity != null)
			visualEntity.commitChanges();//reflect current state of the entity first
			
		this._baseDestroyEntity(entity);//call base method
		
		
		if (visualEntity != null)
		{
			visualEntityList.removeNode(visualEntity.listNode );//remove this entity from the managed list
		
			visualEntity.playAnimation("die");//play dying animation
			visualEntity.enableEvents(false);//disable mouse click
			visualEntity.setDiscardable(true);
			visualEntity.setFrameTime(currentSceneTime, 1000);//dying in 1s
		}
	   
	}
	
	//game loop
	function gameUpdate(scene_time){
		var currentUpdateTime = Utils.getTimestamp();
		currentSceneTime = scene_time;
		if (lastUpdateTime == -1)
			lastUpdateTime = currentUpdateTime;
		
		var elapsedTime = currentUpdateTime - lastUpdateTime;
		
		gameDuration -= elapsedTime;
		if (gameDuration < 0)
			gameDuration = 0;
		
		//var elapsedTime = 1000/60.0;
		//lastUpdateTime = currentUpdateTime - elapsedTime;
		
		//call pre-update callback function
		if (Director.preUpdate != undefined)
			Director.preUpdate(lastUpdateTime, currentUpdateTime);
		
		locked = true;//lock certain operations
		
		that._baseGameLoop(elapsedTime);//call base game update method
			
		//update the entities and commit changes to their visual parts
		visualEntityList.traverse(function(visualEntity) {
			if (visualEntity.locked)
			{
				//this entity has just been created, dont update it yet
				visualEntity.locked = false;
			}
			else
			{
				visualEntity.getEntity().update(elapsedTime);
				visualEntity.commitChanges();
			}
		}
		);
		
		//call update callback function
		if (Director.onUpdate != undefined)
			Director.onUpdate(lastUpdateTime, currentUpdateTime);
		
		locked = false;//unlock certain operations
		
		graphicsUpdate();
		
		lastUpdateTime = currentUpdateTime;
	}
	
	function graphicsUpdate(){
		
		if (mainCharacter != null)
		{
			//move camera to follow target
			var pos = mainCharacter.getPosition();
			worldNode.setLocation(
				displayWidth * 0.5 - pos.x * Constant.PHYSICS_UNIT_SCALE, 
				displayHeight * 0.5 - pos.y * Constant.PHYSICS_UNIT_SCALE);
				
			//update the hp text
			hpText.setText("HP: " + Math.floor(mainCharacter.getHP()));
		}
		
		//update the destination mark
		if (mainCharacter == null || mainCharacter.isMoving() == false)
		{
			//hide the mark
			destMark.setVisible(false);
		}
		
		//update the target mark
		if (targetEntity != null && targetEntity.isAlive()){
			//we currently have a marked target
			targetMark.centerAt(targetEntity.getPosition().x, targetEntity.getPosition().y);
		}
		
		//update game timer
		var total_seconds = gameDuration / 1000;
		var remain = total_seconds % 3600;
		var hours = Math.floor(total_seconds/ 3600);
		var minutes = Math.floor(remain / 60);
		var seconds = Math.floor(remain % 60);
		
		var hoursStr = hours.toString();
		if (hoursStr.length < 2)
			hoursStr = '0' + hoursStr;
		var minStr = minutes.toString();
		if (minStr.length < 2)
			minStr = '0' + minStr;
		var secStr = seconds.toString();
		if (secStr.length < 2)
			secStr = '0' + secStr;
			
		durationText.setText(hoursStr + ' : ' + minStr + ' : ' + secStr);
	}
	
	//initialize graphics
	function initGraphics(){
		//create in-game scene root
		gameSceneRoot = new CAAT.Foundation.ActorContainer().
								setSize(displayWidth, displayHeight);
		ingameScene.addChild(gameSceneRoot);
		
		// create visual entity list
		visualEntityList = new Utils.List();
			
		//world node
		worldNode = new CAAT.Foundation.ActorContainer().
				setFillStyle('#fff').
				setScaleAnchored(Constant.PHYSICS_UNIT_SCALE, Constant.PHYSICS_UNIT_SCALE, 0, 0);
		worldNode.mouseDown = function(mouse){
			Director.onClick(mouse.x, mouse.y, null, mouse.isControlDown() );
		};

		worldNode.touchEnd = function (touch) {

		    Director.onClick(touch.changedTouches[0].clientX, touch.changedTouches[0].clientY, null, false);
		}
		
		worldNode.mouseMove = function(mouse){
			Director.onMouseMove(null, mouse.x, mouse.y);
		}
	 
		gameSceneRoot.addChild(worldNode);
		
		/*----init movement mark and target mark-------*/
		initMarks();
		
		//init GUI
		initGUI();
		
		/*-------rendering loop------------------*/
		lastUpdateTime = -1;
		
		ingameScene.onRenderStart = function(scene_time) {
			gameUpdate(scene_time);
		}
	
		//switch to in-game scene
		caatDirector.easeInOut( 1, CAAT.Foundation.Scene.EASE_SCALE, CAAT.Foundation.Actor.ANCHOR_CENTER, 
			0, CAAT.Foundation.Scene.EASE_SCALE, CAAT.Foundation.Actor.ANCHOR_CENTER, 
			1000, true, null, null);
	}
	
	//init destination and target marks
	function initMarks(){
	
	
		//animations for the 2 marks
		var initScale = 1.0 / Constant.PHYSICS_UNIT_SCALE;
		var scaleBehavior = new CAAT.Behavior.ScaleBehavior().
			setPingPong().
			setCycle(true).
			setFrameTime(0, 1000).
			setValues(initScale, 2 * initScale, initScale, 2 * initScale, .50, .50);
		
		//movement's destination mark
		destMark = new CAAT.Foundation.UI.ShapeActor();
		destMark.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE);
		destMark.enableEvents(false);
		destMark.setFillStyle('#00ff00');
		destMark.setAlpha(0.2);
		destMark.setStrokeStyle('#000');
		destMark.setSize(15 , 15 );
		destMark.setVisible(false);//initially invisible
		destMark.addBehavior(scaleBehavior);
		
		worldNode.addChild(destMark);
		
		
		//initialize the target mark
		targetMark = new CAAT.Foundation.UI.ShapeActor();
		targetMark.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE);
		targetMark.enableEvents(false);
		targetMark.setFillStyle('#ff0000');
		targetMark.setAlpha(0.2);
		targetMark.setStrokeStyle('#000');
		targetMark.setSize(30 , 30 );
		targetMark.setVisible(false);//initially invisible
		targetMark.addBehavior(scaleBehavior);
		
		worldNode.addChild(targetMark);
	}
	
	function initGUI(){
	    /*-- Init the MultiTouch   -*/
	 
	    
	       

	   

		/*---create ID text--------*/
		var font15= "15px sans-serif";
		idText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(10, 36)
										.setText("Your ID: -1")
										.setFont(font15)
										.setAlign("left")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
										
		gameSceneRoot.addChild(idText);
		gameSceneRoot.setZOrder(idText, 999);//always on top
		
		/*---create duration text--------*/
		var font15= "15px sans-serif";
		durationText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(displayWidth / 2, 36)
										.setText("00 : 00 : 00")
										.setFont(font15)
										.setAlign("center")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
										
		gameSceneRoot.addChild(durationText);
		gameSceneRoot.setZOrder(durationText, 999);//always on top
		
		/*---create "ping value" text--------*/
		var font15= "15px sans-serif";
		pingText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(10, 72)
										.setText("Ping: 0")
										.setFont(font15)
										.setAlign("left")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
										
		gameSceneRoot.addChild(pingText);
		gameSceneRoot.setZOrder(pingText, 999);//always on top
		
		/*---create "attack failed" text------*/
		var font18= "18px sans-serif";
		attackFailText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(displayWidth / 2.0, displayHeight / 2.0)
										.setText("Out of range!!!")
										.setFont(font18)
										.setAlign("center")
										.setTextFillStyle('#ff0000')
										.setVisible(false)
										.enableEvents(false)
										;
		
		gameSceneRoot.addChild(attackFailText);
		gameSceneRoot.setZOrder(attackFailText, 999);//always on top
		
		/*---------create HP text------------*/
		hpText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(10, 108)
										.setText("HP: 0")
										.setFont(font15)
										.setAlign("left")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
		
		gameSceneRoot.addChild(hpText);
		gameSceneRoot.setZOrder(hpText, 999);//always on top
		
		/*----------create kill count text------*/
		killText = new CAAT.Foundation.UI.TextActor()
										.setLocation(10, 144)
										.setText("Kills: 0")
										.setFont(font15)
										.setAlign("left")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
		
		gameSceneRoot.addChild(killText);
		gameSceneRoot.setZOrder(killText, 999);//always on top
		
		/*----------create death count text------*/
		deathText = new CAAT.Foundation.UI.TextActor()
										.setLocation(10, 180)
										.setText("Deaths: 0")
										.setFont(font15)
										.setAlign("left")
										.setTextFillStyle('#ff0000')
										.enableEvents(false)
										;
		
		gameSceneRoot.addChild(deathText);
		gameSceneRoot.setZOrder(deathText, 999);//always on top
		
		/*-------create skill icons----------*/
		skillIcons = new Array();
		skillIconMasks = new Array();
		
		var minSize = displayWidth < displayHeight? displayWidth: displayHeight;
		
		var ICON_WIDTH = minSize / 5;
		var ICON_HEIGHT = minSize / 5;
		
		for (var i = 0; i < Constant.MAX_SKILL_SLOTS; ++i){
							
			var skillIconFrame = new CAAT.Foundation.Actor().
								setLocation(10 + i * (ICON_WIDTH + 15), displayHeight - ICON_HEIGHT - 10).
								setSize(ICON_WIDTH, ICON_HEIGHT).
								setFillStyle('#333333').
								setAlpha(0.5);
			//also init skillicons touch event,noted that if i enable multi touch , the mouseDown event will be killed, hence need to implement the touch event fot all items needed mousdown		
			var skillIcon = new CustomCAATActor().
								setLocation(skillIconFrame.x, skillIconFrame.y).
								setSize(ICON_WIDTH, ICON_HEIGHT);

			skillIcon.skillSlotIdx = i;
			skillIcon.touchBeganID = -1;
			skillIcon.touchStart = function (touch) {
			    if (skillIcon.touchBeganID == -1) {
			        skillIcon.touchBeganID = touch.changedTouches[0].identifier;
			        Director.onBeginTouchSkillIcon(this.skillSlotIdx);
			    }
			}

			skillIcon.touchEnd = function (touch) {
			    var isRightTouch = false;
			    for (var i = 0; i < touch.changedTouches.length; ++i) {
			        if (skillIcon.touchBeganID == touch.changedTouches[i].identifier) {
			            //this is the one that generated onBeginTouchSkillIcon() before
			            isRightTouch = true;
			            break;
			        }
			    }
			    if (isRightTouch) {
			        skillIcon.touchBeganID = -1;
			        Director.onEndTouchSkillIcon(this.skillSlotIdx);
			    }
			}






			var skillIconMask = new CAAT.Foundation.Actor().
							setAlpha(0.3).
							setFillStyle('#ffffff').
							setVisible(false);
				
			gameSceneRoot.addChild(skillIconFrame);
			gameSceneRoot.setZOrder(skillIconFrame, 999);//always on top
			gameSceneRoot.addChild(skillIcon);
			gameSceneRoot.setZOrder(skillIcon, 999);//always on top
			gameSceneRoot.addChild(skillIconMask);
			gameSceneRoot.setZOrder(skillIconMask, 999);//always on top
			
			skillIcons.push(skillIcon);
			skillIconMasks.push(skillIconMask);
		}
	}
	
	//display attack failed text
	function displayAtkFailTxt(reasonText){
		attackFailText.setVisible(true);
		attackFailText.setFrameTime(currentSceneTime, 3000);//appear in 3s
		attackFailText.setText(reasonText);
	}
	
	//get animation's full name
	function getFullAnimName(spriteModuleName, animation)
	{
		return spriteModuleName + "-" + animation;
	}
	
	function readXMLFile(xmlFile, callback_func){
		function handler() {
			if(this.readyState == this.DONE) {
				if(this.status == 200) {
				  // success!
				  callback_func(this.responseXML);
				  return;
				}
			}//if(this.readyState == this.DONE)
		}//function handler()
		
		
		// define which file to open and
		// send the request.
		xmlRequest.onreadystatechange  = handler;
		xmlRequest.open("GET", xmlFile, true);
		xmlRequest.setRequestHeader("Content-Type", "text/xml");
		xmlRequest.send(null);
	}
	
	//init the game using the initXMLFile
	function readInitFile()
	{
		readXMLFile(initFileXML, function(responseXML){
			//pre-load all images used in the game
			var root = responseXML.childNodes[0];
			var imageGroups = root.getElementsByTagName("images");
			var images = new Array();
			
			for (var i = 0; i < imageGroups.length; ++i)
			{
				var imageInfos = imageGroups[i].getElementsByTagName("image");
				for (var j = 0; j < imageInfos.length; ++j)
				{
					var image = {
						id: imageInfos[j].getAttribute("id"),
						url: imageInfos[j].getAttribute("url")
					};
					
					images.push(image);
				}//for (var j = 0; j < imageInfos.length; ++j)
			}//for (var i = 0; i < imageGroups.length; ++i)
			
			new CAAT.ImagePreloader().loadImages(
				images,
				function (counter, images) {
					if (counter == images.length)
					{
						//finish loading images
						caatDirector.setImagesCache(images);
						
						var spritesFileElems = root.getElementsByTagName("spritesFile");
						var spritesFile = spritesFileElems[0].childNodes[0].nodeValue;//get sprites information file name
						var mapFileElems = root.getElementsByTagName("mapFile");
						var mapFile = mapFileElems[0].childNodes[0].nodeValue;//get map file name
						
						//next step is init sprites
						initSpriteModules(spritesFile, function()
						{
							//next step is init map
							initMap(mapFile, function(){	
								//next step is notifying that now the Director is ready to be used
								onInitFinished();
							});
						});//initSpriteModules
									
					}
				}//function (counter, images) 
			);//new CAAT.ImagePreloader().loadImages
		});//readXMLFile(function(responseXML)
	}
	
	//initialize sprite modules from xml
	function initSpriteModules(xmlFile, nextStep)
	{
		readXMLFile(xmlFile, function(responseXML){
			spriteSheetList = new Array();//list of sprite sheet objects
			spriteModuleList = new Array();//list of sprite modules

			var root = responseXML.childNodes[0];

			//get list of sprites sheet
			var spriteSheets = root.getElementsByTagName("spriteSheet");
			
			//for each sprites sheet
			for (var i = 0; i < spriteSheets.length; i++)
			{
				var sheet = spriteSheets[i];
				var id = sheet.getAttribute("id");
				var imgID = sheet.getAttribute("imgID");
				var cellsPerRow = parseInt(sheet.getAttribute("cellsPerRow"));
				var cellsPerCol = parseInt(sheet.getAttribute("cellsPerCol"));
				//load image and create CAAT's sprite
				spriteSheetList[id] = createSpriteSheet(imgID, cellsPerCol, cellsPerRow );
			}
			
			//get list of sprite modules
			var spriteModules = root.getElementsByTagName("spriteModule");
			
			for (var i = 0; i < spriteModules.length; ++i)
			{
				var spriteModuleInfo = spriteModules[i];
				var name = spriteModuleInfo.getAttribute("name");
				var sheetID = spriteModuleInfo.getAttribute("sheetID");
				var animationInfos = spriteModuleInfo.getElementsByTagName("animation");
				
				var newSpriteModule = 
				 {
					sheetID: sheetID,//sprite sheet id
					animations: new Array()
				};
				
				//initialize animations:
				for (var a = 0; a < animationInfos.length; ++a)
				{	
					var aName = animationInfos[a].getAttribute("name");//animation name
					var sequenceStr = animationInfos[a].getAttribute("sequence").split(",");//cell sequence of the animation
					var interval = parseInt(animationInfos[a].getAttribute("interval"));//animation interval
					var loop = animationInfos[a].getAttribute("loop") == "true";
					var sequence = new Array();
					//convert to integer array
					for (var j = 0; j < sequenceStr.length; ++j)
						sequence.push(parseInt(sequenceStr[j]));
				
					var afullName = getFullAnimName(name, aName);
					if (!loop)
					{
						spriteSheetList[newSpriteModule.sheetID].addAnimation(afullName, sequence, interval, function(spriteImage, time) {
							//stop at last sub-image
							spriteImage.setAnimationImageIndex([spriteImage.animationImageIndex[spriteImage.animationImageIndex.length - 1]]);
							spriteImage.callback = null;
						});
					}//if (!loop)
					else
						spriteSheetList[newSpriteModule.sheetID].addAnimation(afullName, sequence, interval);
					
					newSpriteModule.animations[aName] = afullName;//store the animation full name
				}//for (var a = 0; a < sprites[i].animations.length; ++a)
				
				//insert to sprite module list
				spriteModuleList[name] = newSpriteModule;
			}//for (var i = 0; i < sprites.length; ++i)
			
			//done, now do the next step
			nextStep();
		});//readXMLFile(xmlFile, function(responseXML)
	}
	
	function initMap(mapFile, nextStep)
	{
		readXMLFile(mapFile, function(responseXML){
			var map = responseXML.childNodes[0];
			
			var width = parseInt(map.getAttribute("width"));
			var height = parseInt(map.getAttribute("height"));
			var backgroundImgID = map.getAttribute("background");
			var tilesMapStr = map.getElementsByTagName("tilesMap")[0].childNodes[0].nodeValue;
			var tilesInfo = map.getElementsByTagName("tilesInfo")[0];
			that.tilesPerRow = parseInt(map.getAttribute("tilesPerRow"));
			that.tilesPerCol = parseInt(map.getAttribute("tilesPerCol"));
			
			/*----------boundary-------*/
			//set boundary
			worldNode.setBounds(0,0,width,height);
			worldNode.setSize(width,height);
			//physics boundary
			that._initPhysicsBounds(width,height);
			
			/*----background-----------*/
			if (backgroundImgID != null)
			{
				var spriteSheet = createSpriteSheet(backgroundImgID, 1, 1);
				worldNode.setBackgroundImage(spriteSheet, false);
				
				worldNode.paint = function(director, time) {
					if (this.backgroundImage) {
						this.backgroundImage.paintScaled(director, time, 0, 0);//require the sprite image to draw using actor's size
					}
				}
			}
			
			/*---init the tiles on the map------*/
			initTiles(tilesMapStr, tilesInfo);
			
			//done, now do the next step
			nextStep();
		});//readXMLFile(xmlFile, function(responseXML)
	}
	
	function initTiles(tileMapStr, tilesInfo) {
		//init tileSheet
		var tileSheet = tilesInfo.getElementsByTagName("tileSheet")[0];
		var tileSheetCellsPerRow = parseInt(tileSheet.getAttribute("tilesPerRow"));
		var tileSheetCellsPerCol = parseInt(tileSheet.getAttribute("tilesPerCol"));
		var tileSheetImg = tileSheet.getAttribute("imgID");
		var tileSpriteSheet = createSpriteSheet(tileSheetImg, tileSheetCellsPerCol, tileSheetCellsPerRow );
		
		//init tile types
		var tileTypes = new Array();
		var tileTypeInfos = tilesInfo.getElementsByTagName("tileType");
		for (var i = 0; i < tileTypeInfos.length; ++i)
		{
			var typeID = tileTypeInfos[i].getAttribute("id");
			var tileType = {
				sheetImgIdx: parseInt(tileTypeInfos[i].getAttribute("tileSheetIdx")),
				isObstacle: tileTypeInfos[i].getAttribute("obstacle") == "true"
			};
			
			tileTypes[typeID] = tileType;//put to the list
		}//for (var i = 0; i < tileTypeInfos.length; ++i)
		
		//now init the tiles in the map
		numNonObstacleTiles = 0;//number of non obstacle tiles
		that.tiles = new Array();
		that.tileWidth = worldNode.width / that.tilesPerRow;
		that.tileHeight = worldNode.height / that.tilesPerCol;
		var rows = tileMapStr.split(/[\s\W]+/);
		if (rows[0].length == 0)
			rows.shift();
		for (var row = 0; row < that.tilesPerCol; ++row)
		{
			that.tiles[row] = new Array();
			
			for (var col = 0; col < that.tilesPerRow; ++col)
			{
				var tileID = rows[row].charAt(col);
				createTile(row, col, tileTypes[tileID], tileSpriteSheet);
			}//for (var col = 0; col < that.tilesPerRow; ++col)
		}//for (var row = 0; row < that.tilesPerCol; ++row)
	}
	
	
	function createTile(row, col, tileType, tileSpriteSheet)
	{
		/*
		var tileType = {
				sheetImgIdx: <integer>,
				isObstacle: <boolean>
			};
		*/
		
		that._createPhysicsTile(row, col, tileType == undefined ? false : tileType.isObstacle);
		
		if (tileType == undefined || tileType.sheetImgIdx == -1 || tileType.sheetImgIdx == null)//no sprite image for this tile
			return;//no need to create visual tile
		
		/*-------create visual tile---------*/
		var x = col * that.tileWidth;
		var y = row * that.tileHeight;
		var width = that.tileWidth;
		var height = that.tileHeight;
		
		var visualTile = new SceneObject(tileSpriteSheet);
		visualTile.setBounds(x, y, width, height);
		visualTile.setSpriteIndex(tileType.sheetImgIdx);
		visualTile.enableEvents(false);
		
		if (!tileType.isObstacle)
		{
			worldNode.setZOrder(visualTile, 0);
			numNonObstacleTiles ++;
		}
	}
	
	function createSpriteSheet(imgID, subImgsPerRow, subImgsPerCol) {
		var spriteSheet = new CAAT.Foundation.SpriteImage().
						initialize(caatDirector.getImage(imgID), subImgsPerRow, subImgsPerCol );
		return spriteSheet;
	}
	
	
	
	/*----------------CustomCAATActor (extends CAAT.Foundation.Actor)-----------------------------------------*/
	function CustomCAATActor()
	{
		//call super class constructor
		CAAT.Foundation.Actor.call(this);
			
		return this;
	}
	//inheritance from CAAT.Foundation.Actor
	CustomCAATActor.prototype = new CAAT.Foundation.Actor();
	CustomCAATActor.prototype.constructor = CustomCAATActor;
	
	CustomCAATActor.prototype.paint = function(director, time) {
		if (this.backgroundImage) {
			this.backgroundImage.paintScaled(director, time, 0, 0);//require the sprite image to draw using actor's size
		}
	}
	
	
	/*----------------SceneObject (extends CustomCAATActor)----------*/
	function SceneObject(spriteSheet)
	{
		if (typeof spriteSheet == 'undefined')
			return;
		//call super class constructor
		CustomCAATActor.call(this);
		
		//add to the scene
		worldNode.addChild(this);
		
		//indicate that this actor will use the image <spriteSheet> to draw its background
		if (spriteSheet != null)
			this.setBackgroundImage(spriteSheet, false);
			
		return this;
	}
	//inheritance from CustomActor
	SceneObject.prototype = new CustomCAATActor();
	SceneObject.prototype.constructor = SceneObject;


	/*----------------VisualEntity (extends SceneObject) - visual part of an entity----------*/
	function VisualEntity(_entity)
	{
	    this.entity;//related entity
	    this.healthBar;//health bar
	    this.hpChangePosTxt;//positive health changing notifying text
	    this.hpChangeNegTxt;//positive health changing notifying text
	    this.dHPPos;//positive change in HP per frame
	    this.dHPNeg;//negative change in HP per frame
	    this.spriteModule;
	   
		
	    this.entity = _entity;
	    this.dHPPos = this.dHPNeg = 0;
	    this.entituOnAim = false;
		
		
	    this.spriteModule = spriteModuleList[this.entity.getSpriteModuleName()];
	    var spriteSheet = spriteSheetList[this.spriteModule.sheetID];


	    //call super class constructor
	    SceneObject.call(this, spriteSheet);
	    this.setSize(this.entity.getWidth(), this.entity.getHeight());
	    this.playAnimation("normal");//play the animation named "normal"
	    //caatActor.setScale(entity.getWidth() / caatActor.width, entity.getHeight() / caatActor.height);
		
		if (this.entity.isGround())//should make it ground level, but still above map's non-obstacle tiles
			worldNode.setZOrder(this, numNonObstacleTiles);
		
	    //add mouse click event listener
	    if (this.entity.getHP() <= 0)
		{
			//hp = 0 is not an interactive entity
			this.enableEvents(false);
		}


		if (this.entity.getHP() > 0)
		{
			//create health bar
			this.healthBar = new CAAT.Foundation.UI.ShapeActor();
			this.healthBar.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_RECTANGLE);
			this.healthBar.enableEvents(false);
			this.healthBar.setFillStyle('#ff0000');
			
			worldNode.addChild(this.healthBar);
			
			var scale = 1.0/ Constant.PHYSICS_UNIT_SCALE;
			
			var font= "13px sans-serif";
			//create health notification texts
			this.hpChangePosTxt = new CAAT.Foundation.UI.TextActor()
										.setFont(font)
										.setAlign("center")
										.setTextFillStyle('#00ff00')
										//.setOutline(true)
										//.setOutlineColor('white')
										.setVisible(false)
										.setScale(scale, scale)
										.enableEvents(false)
										;
			worldNode.addChild(this.hpChangePosTxt);							
			
			this.hpChangeNegTxt = new CAAT.Foundation.UI.TextActor()
										.setFont(font)
										.setAlign("center")
										.setTextFillStyle('#ff0000')
										//.setOutline(true)
										//.setOutlineColor('white')
										.setVisible(false)
										.setScale(scale, scale)
										.enableEvents(false)
										;
			worldNode.addChild(this.hpChangeNegTxt);



		}
		    //if (this.entity.getHP() > 0)
		else
		{
			this.healthBar = null;
			this.hpChangePosTxt = null;
			this.hpChangeNegTxt = null;
		}
	
		
		this.entity.visualPart = this;//now the entity will know what is its visual part
		
		this.commitChanges();
		
	}//VisualEntity = function(entity)
	
	//inheritance from SceneObject
	VisualEntity.prototype = new SceneObject();
	VisualEntity.prototype.constructor = VisualEntity;
	
	//mouse events listeners
	VisualEntity.prototype.mouseDown = function (mouse) {
		Director.onClick(mouse.x, mouse.y, this.entity, mouse.isControlDown());
		
	}
    //for smart phone touch listener
	VisualEntity.prototype.touchEnd = function (touch) {
	    Director.onClick(touch.changedTouches[0].clientX, touch.changedTouches[0].clientY, this.entity, false);
	}
   
	//mouse enter and exit listener, use it to detect whether cursor enter or exit the actor
	VisualEntity.prototype.mouseEnter = function (mouse) {
		Director.onMouseEnterExit(this.entity, true ,mouse.x,mouse.y);
	}


	VisualEntity.prototype.mouseExit = function (mouse) {
		Director.onMouseEnterExit(this.entity, false, mouse.x, mouse.y);	   
	}

	VisualEntity.prototype.mouseMove = function (mouse) {
		Director.onMouseMove(this.entity, mouse.x, mouse.y);
	}
	
	//let the visual part change to reflect its physical counterpart
	VisualEntity.prototype.commitChanges = function(elapsedTime)
	{
		//change the visual position to reflect the physical part
		var bodyPos = this.entity.getPosition();
		this.centerAt(bodyPos.x, bodyPos.y);
		
		//update health bar
		if (this.healthBar != null)
		{
			this.healthBar.setLocation(this.x, this.y - Constant.HEALTH_BAR_HEIGHT - 1 );
			this.healthBar.setSize(this.entity.getPercentHP() * this.width, Constant.HEALTH_BAR_HEIGHT);
		}
		//update health notification
		if (this.dHPPos > 0)
		{
			//random the coordinate of the text
			var randx = Math.random();
			var randy = Math.random();
			var x = randx * this.x + (1 - randx) * (this.x + this.width);
			var y = randy * (this.y - Constant.HEALTH_BAR_HEIGHT) + (1 - randy) * (this.y - 2* Constant.HEALTH_BAR_HEIGHT);
			
			this.hpChangePosTxt.setText('+' + Math.floor(this.dHPPos).toString());
			this.hpChangePosTxt.centerAt(x, y);
			this.hpChangePosTxt.setVisible(true);
			this.hpChangePosTxt.setFrameTime(currentSceneTime, 500);//appear in 0.5s
			
			
			this.dHPPos = 0;
		}//if (this.dHPPos > 0)
		if (this.dHPNeg < 0)
		{
			//random the coordinates of the text
			var randx = Math.random();
			var randy = Math.random();
			var x = randx * this.x + (1 - randx) * (this.x + this.width);
			var y = randy * (this.y - Constant.HEALTH_BAR_HEIGHT) + (1 - randy) * (this.y - 2* Constant.HEALTH_BAR_HEIGHT);
			
			this.hpChangeNegTxt.setText(Math.floor(this.dHPNeg).toString());
			this.hpChangeNegTxt.centerAt(x, y);
			this.hpChangeNegTxt.setVisible(true);
			this.hpChangeNegTxt.setFrameTime(currentSceneTime, 500);//appear in 0.5s
			this.dHPNeg = 0;
		}//if (this.dHPNeg < 0
	}
	
	//override playAnimation method, because we are using the different animation name
	VisualEntity.prototype.playAnimation = function(name)
	{
		CAAT.Foundation.Actor.prototype.playAnimation.call(this, this.spriteModule.animations[name]);
	}
	
	//override setFrameTime method
	VisualEntity.prototype.setFrameTime = function(start, end){
		CAAT.Foundation.Actor.prototype.setFrameTime.call(this, start, end);
		
		//also set frame time for the health bar 
		if (this.healthBar != null)
			this.healthBar.setFrameTime(start, end);
	}
	
	//override setDiscardable method
	VisualEntity.prototype.setDiscardable = function(discardable){
		CAAT.Foundation.Actor.prototype.setDiscardable.call(this, discardable);
		
		//also set discardable for the health bar 
		if (this.healthBar != null)
			this.healthBar.setDiscardable(discardable);
		
		//set discardable for the hp change notifying texts
		if (this.hpChangePosTxt != null)
			this.hpChangePosTxt.setDiscardable(discardable);
		
		if (this.hpChangeNegTxt != null)
			this.hpChangeNegTxt.setDiscardable(discardable);
	}
	
	VisualEntity.prototype.getEntity = function(){
		return this.entity;
	}
	
	VisualEntity.prototype.cumulateHPChange = function(dHP) {
		if (dHP > 0)//positive change
		{
			this.dHPPos += dHP;
		}
		else if (dHP <0)//negative change
		{
			this.dHPNeg += dHP;
		}
	}
	
	
	/*----------all functions and member properties are ready ------*/
		
	/*---------graphics--------------*/
	initGraphics();
	/*----------start loading the game---------*/
	readInitFile();
}


