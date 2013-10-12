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
	, 	b2ContactListener = Box2D.Dynamics.b2ContactListener,
		b2RayCastCallback = Object
	
	
/*-------Director instance-------*/	
var Director = {};

Director.init = function(canvasID, displayWidth, displayHeight, initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var caatDirector;
	var physicsWorld;
	var walkRayCastCallback;
	var tiles;
	var tilesPerRow;
	var tilesPerCol;
	var tileWidth;
	var tileHeight;
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
		//physicsWorld.Step((currentTime - lastUpdateTime)/1000.0, 1, 1);//update physics world
		physicsWorld.Step(1 / 60.0, 1, 1);//update physics world
		
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
		if (bodyA.GetType() == b2Body.b2_dynamicBody && bodyB.GetType() == b2Body.b2_staticBody)//A is moving object
		{
			entityA.stop();//stop
		}//if (bodyA.GetType() == b2Body.b2_dynamicBody)
		if (bodyB.GetType() == b2Body.b2_dynamicBody && bodyA.GetType() == b2Body.b2_staticBody)//B is moving object
		{
			entityB.stop();//stop
		}//if (bodyB.GetType() == b2Body.b2_dynamicBody)
	}
	
	physicsWorld.SetContactListener(contactListener);
	
	/*-----------ray cast call back for walking test------------*/
	walkRayCastCallback = new b2RayCastCallback();
	walkRayCastCallback.hitObstacle = false;
	walkRayCastCallback.ReportFixture = function(fixture, point, normal, fraction){
		if (fixture.GetBody().GetType() == b2Body.b2_staticBody && fraction <= 1.0 && fraction >= 0.0)//hit an obstacle
		{
			this.hitObstacle = true;
		}
	}
	
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
	
	
	
	
	Director._createPhysicsBody = function(bodyDef, fixtureDef)
	{
		var body = physicsWorld.CreateBody(bodyDef);
		
		body.CreateFixture(fixtureDef);
		
		return body;
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
	
	//find the shortest path using A* algorithm. 
	//return a list of points needed to move to along the path through <path> parameter
	var neighborTileOffsets = [
	{dR: -1, dC: -1}, {dR: -1, dC: 0} , {dR: -1, dC: 1},
	{dR: 0, dC: -1}, {dR: 0, dC: 1},
	{dR: 1, dC: -1}, {dR: 1, dC: 0} , {dR: 1, dC: 1}
	];
	
	Director._findPath = function(path, entity, to)
	{
		path.removeAll();//clear the path 
		
		var from = entity.getPosition();
	
		//find the tile where the <from> is on
		var rowFrom = Math.floor(from.y / tileHeight); 
		var colFrom = Math.floor(from.x / tileWidth); 
		var rowTo = Math.floor(to.y / tileHeight); 
		var colTo = Math.floor(to.x / tileWidth); 
		if (isValidTile(rowTo, colTo) == false)
			return;//cannot reach destination
		var tileFrom = tiles[rowFrom][colFrom];
		var tileTo = tiles[rowTo][colTo];
		
		if (tileFrom == tileTo)//in the same tile
		{
			path.insertBack(to);//only one point to move to along the path
			return;
		}
		
		var closedSet = new Array();//the set of tiles already evaluated
		var openSet = new Utils.BinaryHeap(function(tile) {return fScore[tile.hashKey];});//the set of tiles to be evaluated
		var cameFrom = new Array();//map of navigated node
		
		var gScore = new Array();//distances from the start to the evaluated tiles
		var fScore = new Array();//distance from the start plus distance to the destination
		
		cameFrom[tileFrom.hashKey] = null;
		openSet.insert(tileFrom);
		gScore[tileFrom.hashKey] = 0;
		fScore[tileFrom.hashKey] = distanceSqr(from, to);
		
		while (openSet.getNumElements() > 0)
		{
			var current = openSet.getRoot();//the tile with smallest fscore in open set
			var currentPoint = current.center;
			if (current == tileTo)
			{
				//build the path
				buildPath(path, entity, cameFrom, tileTo, to);
				return;
			}
			
			openSet.removeRoot();//remove it from the open set
			closedSet.push(current);//add it to the closed set
			//for each neightbor tile
			for (var i = 0; i < neighborTileOffsets.length; ++i)
			{
				var neighborRow = current.row + neighborTileOffsets[i].dR;
				var neighborCol = current.col + neighborTileOffsets[i].dC;
				if (isValidTile(neighborRow, neighborCol) == false)
					continue;
				var neighbor = tiles[neighborRow][neighborCol];
				//check if we can reach this neighbor
				if (neighbor.isObstacle)
					continue;
					
				if (neighborTileOffsets[i].dR != 0 && neighborTileOffsets[i].dC !=0)
				{
					//these 2 tiles are diagonal to each other
					//vertical neighbor
					var neighborRowV = neighborRow;
					var neighborColV = current.col;
					var neighborV = tiles[neighborRowV][neighborColV];
					
					//horizontal neighbor
					var neighborRowH = current.row;
					var neighborColH = neighborCol;
					var neighborH = tiles[neighborRowH][neighborColH];
					
					if (neighborV.isObstacle || neighborH.isObstacle)
						continue;//cannot reach the diagonal neighbor because 2 adjacent tiles are obstacle
				}
				
				var neighborPoint = neighbor.center;
				if (!walkable(entity, currentPoint, neighborPoint))//a more careful check if we can move the body to the neighbor tile
					continue;
				
				var newgscore = gScore[current.hashKey] + distanceSqr(currentPoint, neighborPoint);
				var newfscore = newgscore + distanceSqr(neighborPoint, to);
				var oldfscore;
				if (closedSet.indexOf(neighbor) != -1 && newfscore >= (oldfscore = fScore[neighbor.hashKey]))//this path is longer than the one evaluated before
					continue;
				
				var inOpenSet = openSet.doesContain(neighbor);
				if (!inOpenSet || newfscore < oldfscore)//found a better path
				{
					cameFrom[neighbor.hashKey] = current;
					gScore[neighbor.hashKey] = newgscore;
					fScore[neighbor.hashKey] = newfscore;
						
					if (!inOpenSet)
						openSet.insert(neighbor);
				}
				
				
			}//for (var i = 0; i < neighborTileOffsets.length; ++i)
		}//while (openSet.getNumElements() > 0)
	}
	
	function buildPath(path, entity, cameFromMap, tileTo, dest)
	{
		var currentTile = cameFromMap[tileTo.hashKey];//the tile leading to the destination tile
		
		//first add the destination
		path.insertFront(dest);
		//then insert the center point of the destination's tile
		path.insertFront(tileTo.center);
		
		while (currentTile != null)
		{
			path.insertFront(currentTile.center);
			
			currentTile = cameFromMap[currentTile.hashKey];
			
		}
		//refine the path to make it smoother
		var checkPoint = entity.getPosition();
		var currentPointNode = path.getFirstNode();
		
		while (currentPointNode != null && currentPointNode.next != null)
		{
			if (walkable(entity, checkPoint, currentPointNode.next.item))
			{
				//make it straight way by removing the midpoint
				var mid = currentPointNode;
				currentPointNode = currentPointNode.next;
				path.removeNode(mid);
			}
			else
			{
				checkPoint = currentPointNode.item;
				currentPointNode = currentPointNode.next;
			}
		}
	}
	
	function walkable(entity, from, to)
	{
		//first box
		var min1 = new b2Vec2(from.x - entity.getWidth() * 0.5, from.y - entity.getHeight() * 0.5);
		var max1 = new b2Vec2(min1.x + entity.getWidth(), min1.y + entity.getHeight());
		
		//2nd box
		var min2 = new b2Vec2(to.x - entity.getWidth() * 0.5, to.y - entity.getHeight() * 0.5);
		var max2 = new b2Vec2(min2.x + entity.getWidth(), min2.y + entity.getHeight());
		
		//first and 2nd ray casting test
		var point11 = new b2Vec2();
		var point12 = new b2Vec2();
		var point21 = new b2Vec2();
		var point22 = new b2Vec2();
		
		var dx = to.x - from.x;
		var dy = to.y - from.y;
		var dxdy = dx * dy;
		
		if (dxdy > 0)
		{
			point11.x = max1.x; point11.y = min1.y;
			point12.x = max2.x; point12.y = min2.y;
			
			point21.x = min1.x; point21.y = max1.y;
			point22.x = min2.x; point22.y = max2.y;
		}
		else if (dxdy < 0)
		{
			point11.SetV(min1);
			point12.SetV(min2);
			point21.SetV(max1);
			point22.SetV(max2);
		}
		else
		{
			if (dx == 0)
			{
				if (dy < 0)
				{
					point11.x = min1.x; point11.y = max1.y;
					point12.x = min2.x; point12.y = min2.y;
					
					point21.x = max1.x; point21.y = max1.y;
					point22.x = max2.x; point22.y = min2.y;
				}
				else {
					point11.x = min1.x; point11.y = min1.y;
					point12.x = min2.x; point12.y = max2.y;
					
					point21.x = max1.x; point21.y = min1.y;
					point22.x = max2.x; point22.y = max2.y;
				}
			}
			else
			{
				if (dx < 0)
				{
					point11.x = max1.x; point11.y = min1.y;
					point12.x = min2.x; point12.y = min2.y;
					
					point21.x = max1.x; point21.y = max1.y;
					point22.x = min2.x; point22.y = max2.y;
				}
				else {
					point11.x = min1.x; point11.y = min1.y;
					point12.x = max2.x; point12.y = min2.y;
					
					point21.x = min1.x; point21.y = max1.y;
					point22.x = max2.x; point22.y = max2.y;
				}
			}
		}
		
		walkRayCastCallback.hitObstacle = false;
		physicsWorld.RayCast(walkRayCastCallback, point11, point12);
		if (!walkRayCastCallback.hitObstacle)
			physicsWorld.RayCast(walkRayCastCallback, point21, point22);
			
		return walkRayCastCallback.hitObstacle == false;
	}
	
	function isValidTile(row, col)
	{
		return (row < tilesPerCol  && row >= 0 &&
					col < tilesPerRow && col >=0);
	}
	
	function tilesDistance(tile1, tile2) {
		var distanceVec = new b2Vec2(tile2.center.x - tile1.center.x, tile2.center.y - tile1.center.y);
		
		return distanceVec.Length();
	}
	
	function tilesDistanceSqr(tile1, tile2) {
		var distanceVec = new b2Vec2(tile2.center.x - tile1.center.x, tile2.center.y - tile1.center.y);
		
		return distanceVec.x * distanceVec.x + distanceVec.y * distanceVec.y;
	}
	
	function tileDistanceToPtSqr(tile, point) {
		var distanceVec = new b2Vec2(point.x - tile.center.x, point.y - tile.center.y);
		
		return distanceVec.x * distanceVec.x + distanceVec.y * distanceVec.y;
	}
	
	function distanceSqr(point1, point2)
	{
		var distanceVec = new b2Vec2(point2.x - point1.x, point2.y - point1.y);
		
		return distanceVec.x * distanceVec.x + distanceVec.y * distanceVec.y;
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
		tilesPerRow = parseInt(map.getAttribute("tilesPerRow"));
		tilesPerCol = parseInt(map.getAttribute("tilesPerCol"));
		
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
		tiles = new Array();
		tileWidth = bg.width / tilesPerRow;
		tileHeight = bg.height / tilesPerCol;
		var rows = tileMapStr.split(/[\s\W]+/);
		if (rows[0].length == 0)
			rows.shift();
		for (var row = 0; row < tilesPerCol; ++row)
		{
			tiles[row] = new Array();
			
			for (var col = 0; col < tilesPerRow; ++col)
			{
				var tileID = rows[row].charAt(col);
				createTile(row, col, tileTypes[tileID], tileSpriteSheet);
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
	
	function createTile(row, col, tileType, tileSpriteSheet)
	{
		/*
		var tileType = {
				sheetImgIdx: <integer>,
				isObstacle: <boolean>
			};
		*/
		
		var x = col * tileWidth;
		var y = row * tileHeight;
		var width = tileWidth;
		var height = tileHeight;
		
		//store info of the tile (its row, column, center point and is obstacle or not)
		tiles[row][col] = {
			row: row, col: col, 
			center: new b2Vec2(x + 0.5 * width, y + 0.5 * height),
			isObstacle: tileType == undefined ? false : tileType.isObstacle,//this tile allow walking through or not
			hashKey: row * tilesPerRow + col
			};
		
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


