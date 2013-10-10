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

Director.init = function(canvasID, displayWidth, displayHeight, mapFileXML)
{
	//private
	var caatDirector;
	var physicsWorld;
	var spriteSheetList;
	var spriteList;
	var renderableList;
	var lastUpdateTime;
	
	this.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	
	/*---------graphics--------------*/
	//renderable entity class
	var Renderable;
	
	// create a CAAT director object for handling graphics
	caatDirector = new CAAT.Foundation.Director().initialize(
			displayWidth,    // pixels wide
			displayHeight,    // pixels across
			document.getElementById(canvasID)
	);

	//initially, no update callback
	this.onUpdate = undefined;
	
	// create renderable entity list
	renderableList = new Utils.List();
	
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
		renderableList.traverse(function(renderable) {
			renderable.commitChange();
		}
		);
		
		physicsWorld.ClearForces();
		
		lastUpdateTime = director_time;
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
	
	/*---------init map------*/
	initMap(mapFileXML);
	
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
	
	//initialize sprites from xml
	Director.initSpritesFromXML = function(xmlFile)
	{
		spriteSheetList = new Array();//list of sprite sheet objects
		spriteList = new Array();
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
			var url = sheet.getAttribute("url");
			var cellsPerRow = parseInt(sheet.getAttribute("cellsPerRow"));
			var cellsPerCol = parseInt(sheet.getAttribute("cellsPerCol"));
			//load image and create CAAT's sprite
			var image = new Image();
			image.src = url;
			spriteSheetList[id] = new CAAT.Foundation.SpriteImage().
							initialize(image, cellsPerRow, cellsPerCol );
		}
		
		//get list of sprites
		var sprites = root.getElementsByTagName("sprite");
		
		for (var i = 0; i < sprites.length; ++i)
		{
			var spriteInfo = sprites[i];
			var name = spriteInfo.getAttribute("name");
			var sheetID = spriteInfo.getAttribute("sheetID");
			var animationInfos = spriteInfo.getElementsByTagName("animation");
			
			var newSprite = 
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
				spriteSheetList[newSprite.sheetID].addAnimation(afullName, sequence, interval);
				
				newSprite.animations[aName] = afullName;//store the animation full name
			}//for (var a = 0; a < sprites[i].animations.length; ++a)
			
			//insert to sprite list
			spriteList[name] = newSprite;
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
		var renderable = new Renderable(entity);
		
		renderableList.insertBack(renderable);
	}
	
	//get animation's full name
	function getFullAnimName(spriteName, animation)
	{
		return spriteName + "-" + animation;
	}
	
	function initMap(mapFileXML)
	{
		var Connect = new XMLHttpRequest();
		// define which file to open and
		// send the request.
		Connect.open("GET", mapFileXML, false);
		Connect.setRequestHeader("Content-Type", "text/xml");
		Connect.send(null);

		var map = Connect.responseXML.childNodes[0];
		var width = parseInt(map.getAttribute("width"));
		var height = parseInt(map.getAttribute("height"));
		
		//set boundary
		bg.setBounds(0,0,width,height);
		//physics boundary
		initPhysicsBounds(width,height);
		
	}
	
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
	
	/*----------------Renderable----------*/
	Renderable = function(_entity)
	{
		var caatActor;//visual part of the entity
		var entity;//related entity
		
		entity = _entity;
		//create caat actor
		var sprite = spriteList[entity.getSpriteName()];
		var spriteSheet = spriteSheetList[sprite.sheetID];
	
		caatActor = new CAAT.Foundation.Actor();
		//caatActor.setSize(entity.getWidth(), entity.getHeight());
		caatActor.setBackgroundImage(spriteSheet, true);//indicate that this actor will use the image <spriteSheet>
		caatActor.playAnimation(sprite.animations["normal"]);//play the animation named "normal"
		caatActor.setScale(entity.getWidth() / caatActor.width, entity.getHeight() / caatActor.height);
		
		entity.visualPart = caatActor;//now the entity will know what is its visual part
		
		// add it to the scene
		bg.addChild(caatActor);
		
		//let the visual part change to reflect its physical counterpart
		this.commitChange = function(elapsedTime)
		{
			//change the visual position to reflect the physical part
			var bodyPos = entity.getPosition();
			caatActor.centerAt(bodyPos.x , bodyPos.y );	
		}
		
		this.getEnity = function(){
			return entity;
		}
	}//Renderable = function(entity)
}


