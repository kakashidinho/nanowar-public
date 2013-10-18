"use strict";

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
		b2RayCastCallback = Object;
		
function DirectorBase()
{
	this.physicsWorld;
	this.walkRayCastCallback;
	this.tiles;
	this.tilesPerRow;
	this.tilesPerCol;
	this.tileWidth;
	this.tileHeight;
	this.knownEntity;//list of entities that have their own ID
	this.deleteBodyList;//list of bodies waiting for being deleted
	this.msgQueueList;//message queue
	
	var that = this;
	
	//create known entity list
	this.knownEntity = new Object();
	
	//create being deleted bodies list
	this.deleteBodyList = new Utils.List();
	
	//create message queue
	this.msgQueueList = new Utils.List();
	
	/*----------------------physics-----------------------------------------*/
		
	//create physics world
	this.physicsWorld = new b2World(
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
		var fixtureA = contact.GetFixtureA();
		var fixtureB = contact.GetFixtureB();
		var bodyA = fixtureA.GetBody();
		var bodyB = fixtureB.GetBody();
		var entityA = bodyA.GetUserData();
		var entityB = bodyB.GetUserData();
		if (bodyA.GetType() == b2Body.b2_dynamicBody && entityA.isMoving())//A is moving object
		{
			var isProjectile = fixtureA.IsSensor();
			if ( bodyB.GetType() == b2Body.b2_staticBody)//B is obstacle
			{
				if (isProjectile)//projectile
					entityA.destroy();
				else
					entityA.startMoveBackward();//should stop reaching destination now
			}
			else if (isProjectile && entityB == entityA.getTarget())
			{
				entityA.onHitTarget();//projectile has hit is target
			}
		}//if (bodyA.GetType() == b2Body.b2_dynamicBody)
		if (bodyB.GetType() == b2Body.b2_dynamicBody && entityB.isMoving())//B is moving object
		{
			var isProjectile = fixtureB.IsSensor();
			if ( bodyA.GetType() == b2Body.b2_staticBody)//A is obstacle
			{
				if (isProjectile)//projectile
					entityB.destroy();
				else
					entityB.startMoveBackward();//should stop reaching destination now
			}
			else if (isProjectile && entityA == entityB.getTarget())
			{
				entityB.onHitTarget();//projectile has hit is target
			}
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
	
	this.physicsWorld.SetContactListener(contactListener);
	
	/*-----------ray cast call back for walking test------------*/
	this.walkRayCastCallback = new b2RayCastCallback();
	this.walkRayCastCallback.hitObstacle = false;
	this.walkRayCastCallback.ReportFixture = function(fixture, point, normal, fraction){
		if (fixture.GetBody().GetType() == b2Body.b2_staticBody && fraction <= 1.0 && fraction >= 0.0)//hit an obstacle
		{
			this.hitObstacle = true;
		}
	}
	
	/*---------methods-----------------*/	
	//post message to queue
	this.postMessage = function(msg)
	{
		this.msgQueueList.insertBack(msg);
	}
	
	this._baseGameLoop = function(elapsedTime) {
		//process pending messages first
		this._processMessages();
		
		
		/*------update physics---------*/
		this.physicsWorld.Step(elapsedTime/1000.0, 1, 1);//update physics world
		
		this.physicsWorld.ClearForces();
		
		//delete all pending bodies
		this.deleteBodyList.traverse(function(body)
		{
			that.physicsWorld.DestroyBody(body);
		});
		
		this.deleteBodyList.removeAll();
	}
	
	//process all messages in queue
	this._processMessages = function()
	{
		this.msgQueueList.traverse(function(msg) {
			switch(msg.type)
			{
			case MsgType.MOVING:
				{
					that.knownEntity[msg.entityID].startMoveTo(msg.destx, msg.desty);
				}
				break;
			case MsgType.ATTACK:
				{
					that.knownEntity[msg.entityID].attack(that.knownEntity[msg.targetID]);
				}
				break;
			}
		}
		);
		
		this.msgQueueList.removeAll();
	}
	
	this._baseAddEntity = function(entity)
	{
		if (entity.hasID())//this entity has an ID
		{
			//put it to the known entity list
			this.knownEntity[entity.getID()] = entity;
		}
	}
	
	this._baseDestroyEntity = function(entity){
		if (entity.hasID())//this entity has an ID
		{
			//remove it from the known entity list
			this.knownEntity[entity.getID()] = null;
		}
	}
	
	this._createPhysicsBody = function(bodyDef, fixtureDef)
	{
		var body = this.physicsWorld.CreateBody(bodyDef);
		
		body.CreateFixture(fixtureDef);
		
		return body;
	}
	
	this._createPhysicsTile = function(row, col, _isObstacle)
	{
		var x = col * this.tileWidth;
		var y = row * this.tileHeight;
		var width = this.tileWidth;
		var height = this.tileHeight;
		
		//store info of the tile (its row, column, center point and is obstacle or not)
		this.tiles[row][col] = {
			row: row, col: col, 
			center: new b2Vec2(x + 0.5 * width, y + 0.5 * height),
			isObstacle: _isObstacle,//this tile allow walking through or not
			hashKey: (row * this.tilesPerRow + col).toString()
			};
	}
	
	
	//init the world boundary
	this._initPhysicsBounds = function(width, height) {
		var boundBodyDef = new b2BodyDef;
		boundBodyDef.type = b2Body.b2_staticBody;
		boundBodyDef.position.x = 0;
		boundBodyDef.position.y = 0;
		
		var worldBound = this.physicsWorld.CreateBody(boundBodyDef);
		
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
	
	//find the shortest path using A* algorithm. 
	//return a list of points needed to move to along the path through <path> parameter
	var neighborTileOffsets = [
	{dR: -1, dC: -1}, {dR: -1, dC: 0} , {dR: -1, dC: 1},
	{dR: 0, dC: -1}, {dR: 0, dC: 1},
	{dR: 1, dC: -1}, {dR: 1, dC: 0} , {dR: 1, dC: 1}
	];
	
	this._findPath = function(path, entity, to)
	{
		path.removeAll();//clear the path 
		
		var from = entity.getPosition();
	
		//find the tile where the <from> is on
		var rowFrom = Math.floor(from.y / this.tileHeight); 
		var colFrom = Math.floor(from.x / this.tileWidth); 
		var rowTo = Math.floor(to.y / this.tileHeight); 
		var colTo = Math.floor(to.x / this.tileWidth); 
		if (isValidTile(rowTo, colTo) == false)
			return;//cannot reach destination
		var tileFrom = this.tiles[rowFrom][colFrom];
		var tileTo = this.tiles[rowTo][colTo];
		
		if (tileFrom == tileTo)//in the same tile
		{
			path.insertBack(to);//only one point to move to along the path
			return;
		}
		
		var closedSet = new Object();//the set of tiles already evaluated
		var openSet = new Utils.BinaryHeap(function(tile) {return fScore[tile.hashKey];});//the set of this.tiles to be evaluated
		var cameFrom = new Object();//map of navigated node
		
		var gScore = new Object();//distances from the start to the evaluated this.tiles
		var fScore = new Object();//distance from the start plus distance to the destination
		
		cameFrom[tileFrom.hashKey] = null;
		openSet.insert(tileFrom);
		gScore[tileFrom.hashKey] = distanceSqr(from, tileFrom.center);
		fScore[tileFrom.hashKey] = gScore[tileFrom.hashKey] + distanceSqr(tileFrom.center, to);
		
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
			closedSet[current.hashKey] = true;//add it to the closed set
			//for each neightbor tile
			for (var i = 0; i < neighborTileOffsets.length; ++i)
			{
				var neighborRow = current.row + neighborTileOffsets[i].dR;
				var neighborCol = current.col + neighborTileOffsets[i].dC;
				if (isValidTile(neighborRow, neighborCol) == false)
					continue;
				var neighbor = this.tiles[neighborRow][neighborCol];
				//check if we can reach this neighbor
				if (neighbor.isObstacle)
					continue;
					
				if (neighborTileOffsets[i].dR != 0 && neighborTileOffsets[i].dC !=0)
				{
					//these 2 tiles are diagonal to each other
					//vertical neighbor
					var neighborRowV = neighborRow;
					var neighborColV = current.col;
					var neighborV = this.tiles[neighborRowV][neighborColV];
					
					//horizontal neighbor
					var neighborRowH = current.row;
					var neighborColH = neighborCol;
					var neighborH = this.tiles[neighborRowH][neighborColH];
					
					if (neighborV.isObstacle || neighborH.isObstacle)
						continue;//cannot reach the diagonal neighbor because 2 adjacent this.tiles are obstacle
				}
				
				var neighborPoint = neighbor.center;
				if (!walkable(entity, currentPoint, neighborPoint))//a more careful check if we can move the body to the neighbor tile
					continue;
				
				var newgscore = gScore[current.hashKey] + distanceSqr(currentPoint, neighborPoint);
				var newfscore = newgscore + distanceSqr(neighborPoint, to);
				var oldfscore;
				if ((neighbor.hashKey in closedSet) && newfscore >= (oldfscore = fScore[neighbor.hashKey]))//this path is longer than the one evaluated before
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
		
		that.walkRayCastCallback.hitObstacle = false;
		that.physicsWorld.RayCast(that.walkRayCastCallback, point11, point12);
		if (!that.walkRayCastCallback.hitObstacle)
			that.physicsWorld.RayCast(that.walkRayCastCallback, point21, point22);
			
		return that.walkRayCastCallback.hitObstacle == false;
	}
	
	function isValidTile(row, col)
	{
		return (row < that.tilesPerCol  && row >= 0 &&
					col < that.tilesPerRow && col >=0);
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
	
}
	