"use strict";


/*-----------------nano entity class--------------*/
var NanoEntity = function(_maxhp, _side, _width, _height, _x, _y, _spriteModule) {
	this.body;//b2Body
	this.width;//body's width
	this.height;//body's height
	//this.collisionRadius;//radius of the circle for collision detection 
	this.maxHP;//maximum hit point.
	this.HP;//current hit point. zero => die
	this.spriteModuleName;
	this.side;
	this.alive;
	
	var that = this;
	/*---------------------------constructor-------------------------------------*/
	
	this.maxHP = this.HP = _maxhp;
	this.side = _side;
	this.width = _width;
	this.height = _height;
	
	this.spriteModuleName = _spriteModule;	
	this.alive = true;
	
	/*----------create physics body-----------*/
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_staticBody;
	bodyDef.angle = 0;
	bodyDef.allowSleep = false;
	//position
	bodyDef.position.x = _x;
	bodyDef.position.y = _y;
	
	this.body = Director._getPhysicsWorld().CreateBody(bodyDef);//create body object
	this.body.SetUserData(this);

	/*------create the shape of body-----------*/
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 1.0;
	fixDef.restitution = 1.0;
	fixDef.isSensor = false;
	var shape = new b2PolygonShape ;//box shape
	shape.SetAsBox(_width * 0.5, _height * 0.5);
	//var shape = new b2CircleShape ;//circle shape
	//shape.m_p.Set(0, 0);
	//shape.m_radius = this.collisionRadius = new b2Vec2(_width * 0.5, _height * 0.5).Length();
	fixDef.shape = shape;
	
	this.body.CreateFixture(fixDef);//add this shape to the body
	
	/*----method definitions-----*/
	this.getSpriteModuleName = function() {
		return that.spriteModuleName;
	}
	
	this.getHP = function() {
		return that.HP;
	}
	
	this.getSide = function() {
		return that.side;
	}
	
	this.getWidth = function() {
		return that.width;
	}
	/*
	this.getCollisionRadius = function(){
		return that.collisionRadius;
	}*/
	
	this.getHeight = function() {
		return that.height;
	}
	
	//return b2Vec2
	this.getPosition = function() {
		return that.body.GetPosition();
	}
	
	this.setPosition = function(newPos) {
		that.body.SetPosition(newPos);
	}
	
	//get distance vector between <anotherPoint> and current position
	this.distanceVecTo = function(anotherPoint)
	{
		var position = that.getPosition();
		return new b2Vec2(anotherPoint.x - position.x, anotherPoint.y - position.y);
	}
	
	//get distance vector between <entity>'s position and current position
	this.distanceVecToEntity = function(entity)
	{
		return that.distanceVecTo(entity.getPosition());	
	}
	
	this.isAlive = function()
	{
		return that.alive;
	}
	
	this.setAlive = function(_alive)
	{
		that.alive = _alive;
	}
	
	//add to director's managed list
	Director._addEntity(this);
}


/*-----------------MovingEntity class (extends NanoEntity)--------------*/

var MovingEntity = function(_maxhp, _side, _width, _height, _x, _y, _oripeed, _sprite)
{
	this.maxSpeed;//original speed. (in units per second)
	this.currentSpeed;//current speed (may be slower than original speed or faster)
	this.destination;//movement destination
	
	var noDestination;
	
	var that = this;
	/*--------constructor---------*/
	//call super class's constructor method
	NanoEntity.call(this, _maxhp, _side, _width, _height, _x, _y, _sprite);
	
	//change the body type to dynamic
	this.body.SetType(b2Body.b2_dynamicBody);

	this.originalSpeed = this.currentSpeed = _oripeed;
	this.destination = new b2Vec2(_x, _y);
	
	noDestination = true;//currently has no destination
	
	//start moving to destination(x, y)
	this.startMoveTo = function (x, y) {
		that.destination.x = x;
		that.destination.y = y;
		
		var position = that.getPosition();
		var velocity = new b2Vec2(that.destination.x - position.x, that.destination.y - position.y);
		
		velocity.Normalize();
		velocity.Multiply(that.currentSpeed);
		
		that.body.SetLinearVelocity(velocity);
		
		noDestination = false;//now we have a destination
	}
	
	//start moving along the direction (x, y)
	this.startMoveDir = function(x, y) {
		var velocity = new b2Vec2(x, y);
		
		velocity.Normalize();
		velocity.Multiply(that.currentSpeed);
		
		that.body.SetLinearVelocity(velocity);
		
		noDestination = true;//we have started moving without destination
	}
	
	//stop the entity if it already at its destination. If this method isn't called, this entity may move forever
	this.stopIfAtDest = function()
	{
		if (noDestination)//if currently moving without destination
			return;
		
		var position = that.getPosition();
		var distance = new b2Vec2(that.destination.x - position.x, that.destination.y - position.y);
		var velocity = that.body.GetLinearVelocity();
		
		if ((distance.x == 0 && distance.y == 0) || (velocity.x * distance.x + velocity.y * distance.y < 0))//already at or pass the destination
		{
			//stop
			that.body.SetPosition(that.destination);
			that.body.SetLinearVelocity(new b2Vec2(0, 0));
			
			
			noDestination = true;//now we have no destination again, because we already reached it
		}
		
	}
	
	//stop moving
	this.stop = function()
	{
		var position = that.getPosition();
		that.destination.SetV(position);
		
		that.body.SetLinearVelocity(new b2Vec2(0, 0));
		
		noDestination = true;
	}
	
	//start move backward
	this.startMoveBackward = function()
	{
		var velocity = that.body.GetLinearVelocity();
		
		that.body.SetLinearVelocity(new b2Vec2(-velocity.x, -velocity.y));
		
		noDestination = true;
	}
	
	//get destination
	this.getDestination = function()
	{
		if (noDestination)//no destination
		{
			//the destination is current position itself
			var position = that.getPosition();
			that.destination.SetV(position);
		}
		return that.destination;
	}
	
	//make the entity move without any destination
	this.removeDestination = function()
	{
		noDestination = true;
	}
	
	this.isMoving = function()
	{
		var velocity = that.body.GetLinearVelocity();
		
		return velocity.x != 0 || velocity.y != 0;
	}
	
	//get current speed
	this.getSpeed = function()
	{
		return that.currentSpeed;
	}
}



/*-----------PlayableEntity class (extends MovingEntity)--------------*/

var PlayableEntity = function( _maxhp, _side, _width, _height, _x, _y, _oriSpeed, _sprite)
{
	this.skills;//skills set
	this.activeSkill;//current active skill
	
	var that = this;
	/*------constructor---------*/
	//call super class's constructor method
	MovingEntity.call(this, _maxhp, _side, _width, _height, _x, _y, _oriSpeed, _sprite);
	
	this.skills = new Array();
	this.activeSkill = -1;
	
	//current active skill
	this.getCurrentSkill = function()
	{
		return that.activeSkill;
	}
	
	//cycle to next skill
	this.nextSkill = function()
	{
		//TO DO
	}
}

