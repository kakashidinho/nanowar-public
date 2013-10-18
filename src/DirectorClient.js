	
/*-------Director instance-------*/	
var Director = {};

Director.init = function(canvasID, displayWidth, displayHeight, initFileXML, onInitFinished)
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
	var followTarget;//the entity that camera will follow
	
	var that = this;
	
	Director.onClick;//on mouse click callback function. should be function(mouseX, mouseY, clickedEntity)
	Director.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	
	//init base instance
	DirectorBase.call(this);
	
	/*------------open connection to initializing xml file-------------------*/
	initXmlRequest = new XMLHttpRequest();
	// define which file to open and
	// send the request.
	initXmlRequest.open("GET", initFileXML, false);
	initXmlRequest.setRequestHeader("Content-Type", "text/xml");
	initXmlRequest.send(null);
	
	/*---------graphics--------------*/
	
	// create a CAAT director object for handling graphics
	caatDirector = new CAAT.Foundation.Director().initialize(
			displayWidth,    // pixels wide
			displayHeight,    // pixels across
			document.getElementById(canvasID)
	);
	//no target to follow
	followTarget = null;
	
	//initially, no callbacks
	Director.onClick = function(x, y, target) {};//do nothing
	Director.onUpdate = undefined;
	
	// create visual entity list
	visualEntityList = new Utils.List();
	
	// add a scene object to the director.
	var scene =     caatDirector.createScene();
	
	//background
	var bg = new CAAT.Foundation.ActorContainer().
            setFillStyle('#fff');
	bg.mouseClick = function(mouse){
		Director.onClick(mouse.x, mouse.y, null);
	};
 
    scene.addChild(bg);
	
	/*-------rendering loop------------------*/
	lastUpdateTime = -1;
	
	scene.onRenderStart = function(scene_time) {
		currentUpdateTime = scene_time;
		if (lastUpdateTime == -1)
			lastUpdateTime = currentUpdateTime;
		
		//var elapsedTime = currentUpdateTime - lastUpdateTime;
		var elapsedTime = 1000/60.0;
		
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
		if (followTarget != null)
		{
			var pos = followTarget.getPosition();
			bg.setLocation(displayWidth * 0.5 - pos.x, displayHeight * 0.5 - pos.y);
		}
		
		lastUpdateTime = currentUpdateTime;
	}
	
	/*----------start loading all images needed for the game---------*/
	preloadImages();
	
	/*---------method definitions----------------*/
	Director.startGameLoop = function(frameRate)
	{
		CAAT.loop(frameRate);
	}
	
	//initialize sprite modules from xml
	Director.initSpriteModulesFromXML = function(xmlFile)
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
	
	//make camera follow an entity
	Director.makeCameraFollow = function(entity)
	{
		followTarget = entity;
	}
	
	Director._getCAATDirector = function()
	{
		return caatDirector;
	}
	
	//notification from an entity telling that is hp has changed
	Director._onHPChanged = function(entity, dhp){
		entity.visualPart.cumulateHPChange(dhp);
	}
	
	Director._addEntity = function(entity)
	{
		this._baseAddEntity(entity);//call base method
		
		var visualEntity = new VisualEntity(entity);
		
		visualEntity.listNode = visualEntityList.insertBack(visualEntity);
	}
	
	Director._destroyEntity = function(entity){
		this._baseDestroyEntity(entity);//call base method
	
		var body = entity.getPhysicsBody();
		var visualEntity = entity.visualPart;
		
		body.SetActive(false);//disable physics simulation
		this.deleteBodyList.insertBack(body);//add to being deleted list
		
		visualEntityList.removeNode(visualEntity.listNode );//remove this entity from the managed list
		
		visualEntity.playAnimation("die");//play dying animation
		visualEntity.enableEvents(false);//disable mouse click
		visualEntity.setDiscardable(true);
		visualEntity.setFrameTime(currentUpdateTime, 1000);//dying in 1s
	}
	
	//get animation's full name
	function getFullAnimName(spriteModuleName, animation)
	{
		return spriteModuleName + "-" + animation;
	}
	
	//pre-load all images used in the game
	function preloadImages()
	{
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
					//finish loading
					caatDirector.setImagesCache(images);
					
					//init map
					initMap();
								
					//now the Director is ready to be used
					onInitFinished();
				}
			}
		);
	}
	
	function initMap()
	{
		var root = initXmlRequest.responseXML.childNodes[0];
		var mapFileElems = root.getElementsByTagName("mapFile");
		var mapFile = mapFileElems[0].childNodes[0].nodeValue;//get map file name
		
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
		bg.setBounds(0,0,width,height);
		bg.setSize(width,height);
		//physics boundary
		that._initPhysicsBounds(width,height);
		
		/*----background-----------*/
		if (backgroundImgID != null)
		{
			var spriteSheet = createSpriteSheet(backgroundImgID, 1, 1);
			bg.setBackgroundImage(spriteSheet, false);
			
			bg.paint = function(director, time) {
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
		that.tileWidth = bg.width / that.tilesPerRow;
		that.tileHeight = bg.height / that.tilesPerCol;
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
		
		var x = col * that.tileWidth;
		var y = row * that.tileHeight;
		var width = that.tileWidth;
		var height = that.tileHeight;
		
		if (tileType == undefined)
			return;//no need to create visual tile
		
		var visualTile = new Renderable(tileSpriteSheet);
		visualTile.setBounds(x, y, width, height);
		visualTile.setSpriteIndex(tileType.sheetImgIdx);
		visualTile.enableEvents(false);
		
		if (tileType.isObstacle)//need to create physical obstacle object
		{
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
			bodyDef.angle = 0;
			bodyDef.allowSleep = false;
			//position
			bodyDef.position.x = x + width * 0.5;
			bodyDef.position.y = y + height * 0.5;

			/*------define the box shape of body-----------*/
			var fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 1.0;
			fixDef.restitution = 1.0;
			fixDef.isSensor = false;
			var shape = new b2PolygonShape ;
			shape.SetAsBox(width * 0.5, height * 0.5);
			fixDef.shape = shape;
			
			var physicalTile = Director._createPhysicsBody(bodyDef, fixDef);//create body object
		}
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
		bg.addChild(this);
		
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
		
		this.spriteModule = spriteModuleList[this.entity.getSpriteModuleName()];
		var spriteSheet = spriteSheetList[this.spriteModule.sheetID];
	
		//call super class constructor
		Renderable.call(this, spriteSheet);
		this.setSize(this.entity.getWidth(), this.entity.getHeight());
		this.playAnimation("normal");//play the animation named "normal"
		//caatActor.setScale(entity.getWidth() / caatActor.width, entity.getHeight() / caatActor.height);
		
		//add mouse click event listener
		if (this.entity.getHP() > 0)
		{
			this.mouseClick = function(mouse){
				Director.onClick(mouse.x, mouse.y, this.entity);
			};
		}
		else//hp = 0 is not an interactive entity
			this.enableEvents(false);
		
		if (this.entity.getHP() > 0)
		{
			//create health bar
			this.healthBar = new CAAT.Foundation.UI.ShapeActor();
			this.healthBar.setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_RECTANGLE);
			this.healthBar.enableEvents(false);
			this.healthBar.setFillStyle('#ff0000');
			
			bg.addChild(this.healthBar);
			
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
			bg.addChild(this.hpChangePosTxt);							
			
			this.hpChangeNegTxt = new CAAT.Foundation.UI.TextActor()
										.setFont(font)
										.setAlign("center")
										.setTextFillStyle('#ff0000')
										//.setOutline(true)
										//.setOutlineColor('white')
										.setVisible(false)
										.enableEvents(false)
										;
			bg.addChild(this.hpChangeNegTxt);	
		}//if (this.entity.getHP() > 0)
		else
		{
			this.healthBar = null;
			this.hpChangePosTxt = null;
			this.hpChangeNegTxt = null;
		}
			
		
		this.entity.visualPart = this;//now the entity will know what is its visual part
		
	}//Renderable = function(entity)
	
	//inheritance from Renderable
	VisualEntity.prototype = new Renderable();
	VisualEntity.prototype.constructor = VisualEntity;
	
	//let the visual part change to reflect its physical counterpart
	VisualEntity.prototype.commitChanges = function(elapsedTime)
	{
		//change the visual position to reflect the physical part
		var bodyPos = this.entity.getPosition();
		this.centerAt(bodyPos.x , bodyPos.y );	
		
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
			
			this.hpChangePosTxt.setText(Math.floor(this.dHPPos).toString());
			this.hpChangePosTxt.setLocation(x, y);
			this.hpChangeNegTxt.setVisible(true);
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
		}//if (this.dHPNeg < 0)
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
}


