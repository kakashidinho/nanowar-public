/*
this code is used by client
*/	

/*-------Director instance on client side-------*/	
var Director = {};

Director.init = function(canvas, displayWidth, displayHeight, initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var caatDirector;
	var spriteSheetList;
	var spriteModuleList;
	var visualEntityList;
	var lastUpdateTime;
	var currentUpdateTime;//for using during update
	var initXmlRequest;
	var mainCharacter;//the main entity in the game
	var targetEntity;//the attacking target of main character
	
	var sceneRoot;
	var guiNode;//scene's gui node, for containing GUI elements
	var worldNode;//scene's world node
	var outOfRangeText;//out of range text on screen
	var destMark ;//movement's destination mark
	var targetMark; //target mark
	
	var that = this;

	Director.onClick;//on mouse click callback function. should be function(mouseX, mouseY, clickedEntity)
	Director.onMouseEnterExit;//on mouse enter/exit callback function
	Director.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	Director.preUpdate;//pre-update callback function
	
	//init base instance
	DirectorBase.call(this);
	
	/*------------open connection to initializing xml file-------------------*/
	initXmlRequest = new XMLHttpRequest();
	// define which file to open and
	// send the request.
	initXmlRequest.open("GET", initFileXML, false);
	initXmlRequest.setRequestHeader("Content-Type", "text/xml");
	initXmlRequest.send(null);
	
	/*-------------------------------*/
	//no target to follow
	mainCharacter = null;
	targetEntity = null;
	
		
	//initially, no callbacks
	Director.onClick = function (x, y, target) { };//do nothing
	Director.onMouseEnterExit = function (target, enter,x,y) { };//do nothing
	Director.onUpdate = undefined;
	Director.preUpdate = undefined;
		
	/*---------graphics--------------*/
	initGraphics();
	
	
	/*---------method definitions----------------*/
	Director.startGameLoop = function(frameRate)
	{
		CAAT.loop(frameRate);
	}
	
	Director.endGameLoop = function()
	{
		CAAT.endLoop();
	}
	
	//make camera follow an entity
	Director.setMainCharacter = function(entity)
	{
		mainCharacter = entity;
	}
	
	//mark the destination, the mark will disappear after the main character stop moving
	Director.markDestination = function(x, y){
		destMark.setVisible(true);
		destMark.centerAt(x, y);
	}
	
	//mark the target
	Director.markTarget = function(entity){
		targetEntity = entity;
	}
	
	//get the current marked target
	Director.getMarkedTarget = function(){
		return targetEntity;
	}
	
	Director.displayOutOfRangeTxt = function(displayFlag){
		if (displayFlag)
		{
			outOfRangeText.setVisible(true);
			outOfRangeText.setFrameTime(currentUpdateTime, 3000);//appear in 3s
		}
		else
		{
			outOfRangeText.setVisible(false);
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
		
		var visualEntity = new VisualEntity(entity);
		
		visualEntity.listNode = visualEntityList.insertBack(visualEntity);
	}
	
	Director._destroyEntity = function(entity){
		//stop following this target
		if (entity == mainCharacter)
			mainCharacter = null;
		else if (entity == targetEntity)
			targetEntity = null;
			
		var visualEntity = entity.visualPart;
			
		visualEntity.commitChanges();//reflect current state of the entity first
			
		this._baseDestroyEntity(entity);//call base method
		
		
		visualEntityList.removeNode(visualEntity.listNode );//remove this entity from the managed list
		
		visualEntity.playAnimation("die");//play dying animation
		visualEntity.enableEvents(false);//disable mouse click
		visualEntity.setDiscardable(true);
		visualEntity.setFrameTime(currentUpdateTime, 1000);//dying in 1s

	   
	}
	
	//game loop
	function gameUpdate(scene_time){
		currentUpdateTime = scene_time;
		if (lastUpdateTime == -1)
			lastUpdateTime = currentUpdateTime;
		
		//var elapsedTime = currentUpdateTime - lastUpdateTime;
		var elapsedTime = 1000/60.0;
		
		//call pre-update callback function
		if (Director.preUpdate != undefined)
			Director.preUpdate(lastUpdateTime, currentUpdateTime);
		
		that._baseGameLoop(elapsedTime);//call base game update method
		
		//call update callback function
		if (Director.onUpdate != undefined)
			Director.onUpdate(lastUpdateTime, currentUpdateTime);
			
		//update the entities and commit changes to their visual parts
		visualEntityList.traverse(function(visualEntity) {
			visualEntity.getEntity().update(elapsedTime);
			visualEntity.commitChanges();
		}
		);
		
		//move camera to follow target
		if (mainCharacter != null)
		{
			var pos = mainCharacter.getPosition();
			worldNode.setLocation(displayWidth * 0.5 - pos.x, displayHeight * 0.5 - pos.y);
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
			targetMark.setVisible(true);
			targetMark.centerAt(targetEntity.getPosition().x, targetEntity.getPosition().y);
		}
		else//dont have any marked target
		{
			//hide the mark
			targetMark.setVisible(false);
		}
		
		lastUpdateTime = currentUpdateTime;
	}
	
	//initialize graphics
	function initGraphics(){
		// create a CAAT director object for handling graphics
		caatDirector = new CAAT.Foundation.Director().initialize(
				displayWidth,    // pixels wide
				displayHeight,    // pixels across
				canvas
		);
		
		// create visual entity list
		visualEntityList = new Utils.List();
		
		// add a scene object to the director.
		sceneRoot =     caatDirector.createScene();
		
		//world node
		worldNode = new CAAT.Foundation.ActorContainer().
				setFillStyle('#fff');
		worldNode.mouseClick = function(mouse){
			Director.onClick(mouse.x, mouse.y, null);
		};
	 
		sceneRoot.addChild(worldNode);
		
		/*----init movement mark and target mark-------*/
		initMarks();
		
		//init GUI
		initGUI();
		
		/*-------rendering loop------------------*/
		lastUpdateTime = -1;
		
		sceneRoot.onRenderStart = function(scene_time) {
			gameUpdate(scene_time);
		}
	}
	
	//init destination and target marks
	function initMarks(){
		//animations for the 2 marks
		var cycleDraw = new CAAT.Behavior.ContainerBehavior().
		setCycle(true).
		setFrameTime(0, 1000);
		var scaleMarker = new CAAT.Behavior.ScaleBehavior().
		setPingPong().
		setFrameTime(0, 1000).
		setValues(1, 2, 1, 2, .50, .50);
		cycleDraw.addBehavior(scaleMarker);
		
		//movement's destination mark
		destMark = new CAAT.Foundation.UI.ShapeActor();
		destMark.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE);
		destMark.enableEvents(false);
		destMark.setFillStyle('#00ff00');
		destMark.setAlpha(0.2);
		destMark.setStrokeStyle('#000');
		destMark.setSize(15, 15);
		destMark.setVisible(false);//initially invisible
		destMark.addBehavior(cycleDraw);
		
		worldNode.addChild(destMark);
		
		
		//initialize the target mark
		targetMark = new CAAT.Foundation.UI.ShapeActor();
		targetMark.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE);
		targetMark.enableEvents(false);
		targetMark.setFillStyle('#ffff00');
		targetMark.setAlpha(0.2);
		targetMark.setStrokeStyle('#000');
		targetMark.setSize(25, 25);
		targetMark.setVisible(false);//initially invisible
		targetMark.addBehavior(cycleDraw);
		
		worldNode.addChild(targetMark);
	}
	
	function initGUI(){
		
		//scene's GUI node
		guiNode = new CAAT.Foundation.ActorContainer()
						.setAlpha(0.0)
						.enableEvents(false);
		guiNode.setSize(displayWidth, displayHeight);
		sceneRoot.addChild(guiNode);	
		sceneRoot.setZOrder(guiNode, 999);//always on top
		
		/*---create "out of range" text------*/
		var font= "18px sans-serif";
		outOfRangeText =  new CAAT.Foundation.UI.TextActor()
										.setLocation(displayWidth / 2.0, 36)
										.setText("Out of range!!!")
										.setFont(font)
										.setAlign("center")
										.setTextFillStyle('#ff0000')
										//.setOutline(true)
										//.setOutlineColor('white')
										.setVisible(false)
										.enableEvents(false)
										;
										
		guiNode.addChild(outOfRangeText);
	}
	
	//get animation's full name
	function getFullAnimName(spriteModuleName, animation)
	{
		return spriteModuleName + "-" + animation;
	}
	
	//init the game using the initXMLFile
	function readInitFile()
	{
		//pre-load all images used in the game
		var root = initXmlRequest.responseXML.childNodes[0];
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
					
					//init sprites
					initSpriteModules(spritesFile);
					
					//init map
					initMap(mapFile);	
								
					//now the Director is ready to be used
					onInitFinished();
				}
			}
		);
	}
	
	//initialize sprite modules from xml
	function initSpriteModules(xmlFile)
	{
		spriteSheetList = new Array();//list of sprite sheet objects
		spriteModuleList = new Array();//list of sprite modules
		var Connect = new XMLHttpRequest();
 
		// define which file to open and
		// send the request.
		Connect.open("GET", xmlFile, false);
		Connect.setRequestHeader("Content-Type", "text/xml");
		Connect.send(null);

		var root = Connect.responseXML.childNodes[0];

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
	}
	
	function initMap(mapFile)
	{
		var Connect = new XMLHttpRequest();
 
		// define which file to open and
		// send the request.
		Connect.open("GET", mapFile, false);
		Connect.setRequestHeader("Content-Type", "text/xml");
		Connect.send(null);

		var map = Connect.responseXML.childNodes[0];
		
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
		
		var visualTile = new Renderable(tileSpriteSheet);
		visualTile.setBounds(x, y, width, height);
		visualTile.setSpriteIndex(tileType.sheetImgIdx);
		visualTile.enableEvents(false);
		
		if (!tileType.isObstacle)
			worldNode.setZOrder(visualTile, -1);
	}
	
	function createSpriteSheet(imgID, subImgsPerRow, subImgsPerCol) {
		var spriteSheet = new CAAT.Foundation.SpriteImage().
						initialize(caatDirector.getImage(imgID), subImgsPerRow, subImgsPerCol );
		return spriteSheet;
	}
	
	
	
	
	
	
	/*----------------Renderable (extends CAAT.Foundation.Actor)----------*/
	function Renderable(spriteSheet)
	{
		if (spriteSheet == undefined)
			return;
		//call super class constructor
		CAAT.Foundation.Actor.call(this);
		
		//add to the scene
		worldNode.addChild(this);
		
		//indicate that this actor will use the image <spriteSheet> to draw its background
		this.setBackgroundImage(spriteSheet, false);
	}
	//inheritance from CAAT.Foundation.Actor
	Renderable.prototype = new CAAT.Foundation.Actor();
	Renderable.prototype.constructor = Renderable;
	
	Renderable.prototype.paint = function(director, time) {
		if (this.backgroundImage) {
			this.backgroundImage.paintScaled(director, time, 0, 0);//require the sprite image to draw using actor's size
		}
	}

	/*----------------VisualEntity (extends Renderable) - visual part of an entity----------*/
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
	    Renderable.call(this, spriteSheet);
	    this.setSize(this.entity.getWidth(), this.entity.getHeight());
	    this.playAnimation("normal");//play the animation named "normal"
	    //caatActor.setScale(entity.getWidth() / caatActor.width, entity.getHeight() / caatActor.height);
		
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
			
			var font= "13px sans-serif";
			//create health notification texts
			this.hpChangePosTxt = new CAAT.Foundation.UI.TextActor()
										.setFont(font)
										.setAlign("center")
										.setTextFillStyle('#00ff00')
										//.setOutline(true)
										//.setOutlineColor('white')
										.setVisible(false)
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
		
	}//VisualEntity = function(entity)
	
	//inheritance from Renderable
	VisualEntity.prototype = new Renderable();
	VisualEntity.prototype.constructor = VisualEntity;
	
	//mouse events listeners
	VisualEntity.prototype.mouseClick = function (mouse) {
		Director.onClick(mouse.x, mouse.y, this.entity);
		
	}
	//mouse enter and exit listener, use it to detect whether cursor enter or exit the actor
	VisualEntity.prototype.mouseEnter = function (mouse) {
		Director.onMouseEnterExit(this.entity, true ,this.x,this.y);
	}


	VisualEntity.prototype.mouseExit = function (mouse) {
		Director.onMouseEnterExit(this.entity, false, this.x, this.y);	   
	}

	VisualEntity.prototype.mouseMove = function (mouse) {
		//TO DO
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
			var y = randy * (this.y - Constant.HEALTH_BAR_HEIGHT - 26) + (1 - randy) * (this.y - Constant.HEALTH_BAR_HEIGHT - 13);
			
			this.hpChangePosTxt.setText('+' + Math.floor(this.dHPPos).toString());
			this.hpChangePosTxt.setLocation(x, y);
			this.hpChangePosTxt.setVisible(true);
			this.hpChangePosTxt.setFrameTime(currentUpdateTime, 500);//appear in 0.5s
			
			
			this.dHPPos = 0;
		}//if (this.dHPPos > 0)
		if (this.dHPNeg < 0)
		{
			//random the coordinates of the text
			var randx = Math.random();
			var randy = Math.random();
			var x = randx * this.x + (1 - randx) * (this.x + this.width);
			var y = randy * (this.y - Constant.HEALTH_BAR_HEIGHT - 26) + (1 - randy) * (this.y - Constant.HEALTH_BAR_HEIGHT - 13);
			
			this.hpChangeNegTxt.setText(Math.floor(this.dHPNeg).toString());
			this.hpChangeNegTxt.setLocation(x, y);
			this.hpChangeNegTxt.setVisible(true);
			this.hpChangeNegTxt.setFrameTime(currentUpdateTime, 500);//appear in 0.5s
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
	/*----------start loading the game---------*/
	readInitFile();
}


