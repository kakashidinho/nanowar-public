//init box2d shortform of functions and classes
var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,  b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	, 	b2ContactListener = Box2D.Dynamics.b2ContactListener
	
	
/*-------Director instance-------*/	
var Director = {};

Director.init = function(canvasID, displayWidth, displayHeight, initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var caatDirector;
	var physicsWorld;
	var spriteSheetList;
	var spriteModuleList;
	var visualEntityList;
	var lastUpdateTime;
	var initXmlRequest;
	
	this.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	
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
	
	//initially, no update callback
	this.onUpdate = undefined;
	
	// create visual entity list
	visualEntityList = new Utils.List();
	
	// add a scene object to the director.
	var scene =     caatDirector.createScene();
	
	//background
	var bg = new CAAT.Foundation.ActorContainer().
            setFillStyle('#fff');
 
    scene.addChild(bg);
	
	/*-------rendering loop------------------*/
	lastUpdateTime = -1;
	
	caatDirector.onRenderStart = function(director_time) {
		var currentTime = Utils.getTimestamp();
		if (lastUpdateTime == -1)
			lastUpdateTime = currentTime;
		physicsWorld.Step((currentTime - lastUpdateTime)/1000.0, 1, 1);//update physics world
		
		if (Director.onUpdate != undefined)//call update callback function
			Director.onUpdate(lastUpdateTime, currentTime);
			
		//commit changes to visual parts
		visualEntityList.traverse(function(visualEntity) {
			visualEntity.commitChanges();
		}
		);
		
		physicsWorld.ClearForces();
		
		lastUpdateTime = currentTime;
	}
	/*----------------------physics-----------------------------------------*/
		
	//create physics world
	physicsWorld = new b2World(
		new b2Vec2(0, 0) //gravity
		, false //disallow sleep
	);
	
	/*-----------add physics collision listener----------------*/
	var contactListener = new b2ContactListener();
	contactListener.PreSolve = function(contact, manifoid)
	{
		var bodyA = contact.GetFixtureA().GetBody();
		var bodyB = contact.GetFixtureB().GetBody();
		var entityA = bodyA.GetUserData();
		var entityB = bodyB.GetUserData();
		if (bodyA.GetType() == b2Body.b2_dynamicBody)//A is moving object
		{
			if( bodyB.GetType() == b2Body.b2_dynamicBody)
			{
				//if two entities are both moving objects
				contact.SetEnabled(false);//for now. allow pass through
			}
		}//if (bodyA.GetType() == b2Body.b2_dynamicBody)
	}
	contactListener.BeginContact = function(contact, manifoid)
	{
		var bodyA = contact.GetFixtureA().GetBody();
		var bodyB = contact.GetFixtureB().GetBody();
		var entityA = bodyA.GetUserData();
		var entityB = bodyB.GetUserData();
		if (bodyA.GetType() == b2Body.b2_dynamicBody && entityA.isMoving())//A is moving object
		{
			if ( bodyB.GetType() == b2Body.b2_staticBody)//B is obstacle
				entityA.startMoveBackward();//should stop reaching destination now
		}//if (bodyA.GetType() == b2Body.b2_dynamicBody)
		if (bodyB.GetType() == b2Body.b2_dynamicBody && entityB.isMoving())//B is moving object
		{
			if ( bodyA.GetType() == b2Body.b2_staticBody)//A is obstacle
				entityB.startMoveBackward();//should stop reaching destination now
		}//if (bodyB.GetType() == b2Body.b2_dynamicBody)
	}
	contactListener.EndContact = function(contact, manifoid)
	{
		var bodyA = contact.GetFixtureA().GetBody();
		var bodyB = contact.GetFixtureB().GetBody();
		var entityA = bodyA.GetUserData();
		var entityB = bodyB.GetUserData();
		if (bodyA.GetType() == b2Body.b2_dynamicBody)//A is moving object
		{
			entityA.stop();//stop
		}//if (bodyA.GetType() == b2Body.b2_dynamicBody)
		if (bodyB.GetType() == b2Body.b2_dynamicBody)//B is moving object
		{
			entityB.stop();//stop
		}//if (bodyB.GetType() == b2Body.b2_dynamicBody)
	}
	
	physicsWorld.SetContactListener(contactListener);
	
	/*----------start loading all images needed for the game---------*/
	preloadImages();
	
	/*---------method definitions----------------*/
	Director.startGameLoop = function(frameRate)
	{
		CAAT.loop(frameRate);
	}
	
	//set the handler that will be fired whenever the mouse clicks on <targetEntity>.
	//if <targetEntity> = undefined, handler will be fired when the mouse clicks on the screen
	Director.setOnClick = function(handler, targetEntity)
	{
		if (targetEntity == undefined)
			bg.mouseClick = handler;
		else
			targetEntity.visualPart.mouseClick = handler;
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
			spriteSheetList[id] = createSpriteSheet(imgID, cellsPerRow, cellsPerCol );
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
				var sequence = new Array();
				//convert to integer array
				for (var j = 0; j < sequenceStr.length; ++j)
					sequence.push(parseInt(sequenceStr[j]));
			
				var afullName = getFullAnimName(name, aName);
				spriteSheetList[newSpriteModule.sheetID].addAnimation(afullName, sequence, interval);
				
				newSpriteModule.animations[aName] = afullName;//store the animation full name
			}//for (var a = 0; a < sprites[i].animations.length; ++a)
			
			//insert to sprite module list
			spriteModuleList[name] = newSpriteModule;
		}//for (var i = 0; i < sprites.length; ++i)
	}
	
	
	
	
	Director._getPhysicsWorld = function()
	{
		return physicsWorld;
	}
	
	Director._getCAATDirector = function()
	{
		return caatDirector;
	}
	
	Director._addEntity = function(entity)
	{
		var visualEntity = new VisualEntity(entity);
		
		visualEntityList.insertBack(visualEntity);
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
		var tilesPerRow = parseInt(map.getAttribute("tilesPerRow"));
		var tilesPerCol = parseInt(map.getAttribute("tilesPerCol"));
		var tilesInfo = map.getElementsByTagName("tilesInfo")[0];
		
		/*----------boundary-------*/
		//set boundary
		bg.setBounds(0,0,width,height);
		bg.setSize(width,height);
		//physics boundary
		initPhysicsBounds(width,height);
		
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
		initTiles(tilesMapStr, tilesPerRow, tilesPerCol, tilesInfo);
	}
	
	function initTiles(tileMapStr, tilesPerRow, tilesPerCol, tilesInfo) {
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
		var tileWidth = bg.width / tilesPerRow;
		var tileHeight = bg.height / tilesPerCol;
		var rows = tileMapStr.split(/[\s\W]+/);
		if (rows[0].length == 0)
			rows.shift();
		for (var row = 0; row < tilesPerCol; ++row)
		{
			for (var col = 0; col < tilesPerRow; ++col)
			{
				var tileID = rows[row].charAt(col);
				if (tileTypes[tileID] != undefined)
					createTile(row * tileWidth, col * tileHeight, tileWidth, tileHeight, tileTypes[tileID], tileSpriteSheet);
			}//for (var col = 0; col < tilesPerRow; ++col)
		}//for (var row = 0; row < tilesPerCol; ++row)
	}
	
	//init the world boundary
	function initPhysicsBounds(width, height) {
		var boundBodyDef = new b2BodyDef;
		boundBodyDef.type = b2Body.b2_staticBody;
		boundBodyDef.position.x = 0;
		boundBodyDef.position.y = 0;
		
		var worldBound = physicsWorld.CreateBody(boundBodyDef);
		
		var edgeShape = new b2PolygonShape;
		var boundFixDef = new b2FixtureDef;
		
		boundFixDef.shape = edgeShape;
		
		//4 edge fixtures
		edgeShape.SetAsEdge( new b2Vec2(0,0), new b2Vec2(width,0) );	
		worldBound.CreateFixture(boundFixDef);
		edgeShape.SetAsEdge( new b2Vec2(0,0), new b2Vec2(0,height) );	
		worldBound.CreateFixture(boundFixDef);
		edgeShape.SetAsEdge( new b2Vec2(width,0), new b2Vec2(width,height) );	
		worldBound.CreateFixture(boundFixDef);
		edgeShape.SetAsEdge( new b2Vec2(0,height), new b2Vec2(width,height) );	
		worldBound.CreateFixture(boundFixDef);
	}
	
	function createTile(x, y, width, height, tileType, tileSpriteSheet)
	{
		/*
		var tileType = {
				sheetImgIdx: <integer>,
				isObstacle: <boolean>
			};
		*/
		var visualTile = new Renderable(tileSpriteSheet);
		visualTile.setBounds(x, y, width, height);
		visualTile.setSpriteIndex(tileType.sheetImgIdx);
		
		if (tileType.isObstacle)//need to create physical obstacle object
		{
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
			bodyDef.angle = 0;
			bodyDef.allowSleep = false;
			//position
			bodyDef.position.x = x + width * 0.5;
			bodyDef.position.y = y + height * 0.5;
			
			var physicalTile = Director._getPhysicsWorld().CreateBody(bodyDef);//create body object

			/*------create the box shape of body-----------*/
			var fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 1.0;
			fixDef.restitution = 1.0;
			fixDef.isSensor = false;
			var shape = new b2PolygonShape ;
			shape.SetAsBox(width * 0.5, height * 0.5);
			fixDef.shape = shape;
			
			physicalTile.CreateFixture(fixDef);//add this shape to the body
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
		var entity;//related entity
		
		entity = _entity;
		
		var spriteModule = spriteModuleList[entity.getSpriteModuleName()];
		var spriteSheet = spriteSheetList[spriteModule.sheetID];
	
		//call super class constructor
		Renderable.call(this, spriteSheet);
		this.setSize(entity.getWidth(), entity.getHeight());
		this.playAnimation(spriteModule.animations["normal"]);//play the animation named "normal"
		//caatActor.setScale(entity.getWidth() / caatActor.width, entity.getHeight() / caatActor.height);
		
		entity.visualPart = this;//now the entity will know what is its visual part
		
		//let the visual part change to reflect its physical counterpart
		this.commitChanges = function(elapsedTime)
		{
			//change the visual position to reflect the physical part
			var bodyPos = entity.getPosition();
			this.centerAt(bodyPos.x , bodyPos.y );	
		}
		
		this.getEntity = function(){
			return entity;
		}
	}//Renderable = function(entity)
	
	//inheritance from Renderable
	VisualEntity.prototype = new Renderable();
	VisualEntity.prototype.constructor = VisualEntity;
}


