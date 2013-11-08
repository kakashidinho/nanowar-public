"use strict";
//init box2d short-form of functions and classes
var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape

/*-----------------nano entity class--------------*/
var NanoEntity = function(_id, _maxhp, _side, _width, _height, _x, _y, _spriteModule, ground) {
	if (_id == undefined)//this may be called by prototype inheritance
		return;
	this.id;//unique id
	this.body;//b2Body
	this.width;//body's width
	this.height;//body's height
	//this.collisionRadius;//radius of the circle for collision detection 
	this.maxHP;//maximum hit point.
	this.HP;//current hit point. zero => die
	this.spriteModuleName;
	this.side;
	this.effects;
	this.newEffects;//list of newly added effects
	this.alive;
	this.ground;//is this entity at the ground. it means it is below the other entities. useful for rendering
	this.className;//the class name
	
	/*---------------------------constructor-------------------------------------*/
	this.id = _id;
	this.maxHP = this.HP = _maxhp;
	this.side = _side;
	this.width = _width;
	this.height = _height;
	
	this.spriteModuleName = _spriteModule;	
	this.alive = true;
	
	this.ground = ground == undefined? false: ground;
	
	this.effects = new Utils.List();
	this.newEffects = new Utils.List();
	
	/*----------create physics body-----------*/
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_staticBody;
	bodyDef.angle = 0;
	bodyDef.allowSleep = false;
	//position
	bodyDef.position.x = _x;
	bodyDef.position.y = _y;
	
	/*------the shape of body-----------*/
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 0.0;
	fixDef.restitution = 1.0;
	fixDef.isSensor = false;
	var shape = new b2PolygonShape ;//box shape
	shape.SetAsBox(_width * 0.5, _height * 0.5);
	//var shape = new b2CircleShape ;//circle shape
	//shape.m_p.Set(0, 0);
	//shape.m_radius = this.collisionRadius = new b2Vec2(_width * 0.5, _height * 0.5).Length();
	fixDef.shape = shape;
	
	this.body = Director._createPhysicsBody(bodyDef, fixDef);//create body object
	this.body.SetUserData(this);
	
	//add to director's managed list
	Director._addEntity(this);
}

/*----method definitions-----*/

//may returns null
NanoEntity.prototype.getSpriteModuleName = function() {
	return this.spriteModuleName;
}

NanoEntity.prototype.getPhysicsBody = function() {
	return this.body;
}
//may return undefined
NanoEntity.prototype.getClassName = function()
{
	return this.className;
}

NanoEntity.prototype.isGround = function()
{
	return this.ground;
}

//has ID?
NanoEntity.prototype.hasID = function()
{
	return this.id != -1;
}

//get ID
NanoEntity.prototype.getID = function()
{
	return this.id;
}

NanoEntity.prototype.setHP = function(hp) {
	this.HP = hp;
}

NanoEntity.prototype.getHP = function() {
	return this.HP;
}

NanoEntity.prototype.getMaxHP = function() {
	return this.maxHP;
}

//return value between [0-1]
NanoEntity.prototype.getPercentHP = function() {
	return this.HP / this.maxHP;
}


NanoEntity.prototype.getSide = function() {
	return this.side;
}

NanoEntity.prototype.getWidth = function() {
	return this.width;
}
/*
NanoEntity.prototype.getCollisionRadius = function(){
	return this.collisionRadius;
}*/

NanoEntity.prototype.getHeight = function() {
	return this.height;
}

//return b2Vec2
NanoEntity.prototype.getPosition = function() {
	return this.body.GetPosition();
}

//newPos is b2Vec2
NanoEntity.prototype.setPosition = function(newPos) {
	this.body.SetPosition(newPos);
}

//get distance vector between <anotherPoint> and current position
NanoEntity.prototype.distanceVecTo = function(anotherPoint)
{
	var position = this.getPosition();
	return new b2Vec2(anotherPoint.x - position.x, anotherPoint.y - position.y);
}

//get distance vector between <entity>'s position and current position
NanoEntity.prototype.distanceVecToEntity = function(entity)
{
	return this.distanceVecTo(entity.getPosition());	
}

//get distance  between <anotherPoint> and current position
NanoEntity.prototype.distanceTo = function(anotherPoint)
{
	return this.distanceVecTo(anotherPoint).Length();	
}

//get distance between <entity>'s position and current position
NanoEntity.prototype.distanceToEntity = function(entity)
{
	return this.distanceVecTo(entity.getPosition()).Length();	
}

NanoEntity.prototype.isAlive = function()
{
	return this.alive;
}

NanoEntity.prototype.setAlive = function(_alive)
{
	this.alive = _alive;
	
	if (!this.alive)
	{
		//remove all effects
		this.effects.removeAll();
		this.newEffects.removeAll();
	}
}

NanoEntity.prototype.destroy = function()
{
	this.setAlive(false);
	
	Director._destroyEntity(this);//notify director
}

NanoEntity.prototype.getNewEffectList = function()
{
	return this.newEffects;
}

NanoEntity.prototype.addEffect = function(effect)
{
	this.newEffects.insertBack(effect);
	//stick effect to its affected target
	effect.setPosition(this.getPosition());
}

//return real amount of HP changed
NanoEntity.prototype.increaseHP = function(dhp){
	if (this.HP < this.maxHP){
		var newHP = this.HP + dhp;
		if (newHP > this.maxHP)
			newHP = this.maxHP;
		
		var realdDHP = newHP - this.HP;
		this.HP = newHP;
		
		Director._onHPChanged(this, realdDHP, false);//notify director
		
		return realdDHP;
	}
	return 0;
}

//return real amount of HP changed
NanoEntity.prototype.decreaseHP = function(dhp){
	if (this.HP > 0){
		var newHP = this.HP - dhp;
		if (newHP < 0)
			newHP = 0;
		var realdDHP = this.HP - newHP;
		this.HP = newHP;
		
		Director._onHPChanged(this, realdDHP, true);//notify director
		
		return realdDHP;
	}
	return 0;
}

//notify entity that the effect has started
NanoEntity.prototype.notifyEffectStarted = function(effect){
	var node = this.newEffects.findNode(effect);
	if (node == null)
		return;
	//pop new effect from the newEffects list and push to list of current effects
	var neweffect = node.item;
	this.newEffects.removeNode(node);
	this.effects.insertBack(neweffect);
}

NanoEntity.prototype.updateEffects = function(elapsedTime){
	var node = this.effects. getFirstNode();
	while (node != null)
	{
		//stick the effect to its affected target
		node.item.setPosition(this.getPosition());
		
		if (node.item.isAlive() == false)
		{
			//the duration of effect has ended
			var del = node;
			node = node.next;
			this.effects.removeNode(del);//remove the effect
		}
		else
		{	
			node = node.next;
		}
	}
}

//update the entity after <elapsedTime>
NanoEntity.prototype.update = function(elapsedTime){
	this.updateEffects(elapsedTime);
	
	if (this.maxHP > 0 && this.HP <= 0 && !Director.dummyClient)
	{
		this.setAlive(false);
		Director._notifyEntityDeath(this);
	}
}


/*-----------------MovingEntity class (extends NanoEntity)--------------*/

var MovingEntity = function(_id, _maxhp, _side, _width, _height, _x, _y, _oripeed, _sprite)
{
	if (_id == undefined)//this may be called by prototype inheritance
		return;
	this.maxSpeed;//original speed. (in units per second)
	this.currentSpeed;//current speed (may be slower than original speed or faster)
	this.movingPath;//the path this entity has to follow
	this.velChangeListener;// velocity change listener
	
	this.deferConvergence;//defer the convergence until next update?
	this.convergeVelocity;//convergence's velocity
	this.convergeDuration;//convergence duration
	this.afterConversePosition;//position after convergence ends
	this.afterConverseDirection;//direction after convergence ends
	
	/*--------constructor---------*/
	//call super class's constructor method
	NanoEntity.call(this, _id, _maxhp, _side, _width, _height, _x, _y, _sprite);
	
	//change the body type to dynamic
	this.body.SetType(b2Body.b2_dynamicBody);

	this.originalSpeed = this.currentSpeed = _oripeed;
	this.movingPath = new Utils.List();
	
	
	this.deferConvergence = false;
	this.convergeDuration = -1;
	this.convergeVelocity = new b2Vec2();
	this.afterConversePosition = new b2Vec2();
	this.afterConverseDirection = new b2Vec2();
	
	this.setVelChangeListener(null);
}

//inheritance from NanoEntity
MovingEntity.prototype = new NanoEntity();
MovingEntity.prototype.constructor = MovingEntity;


//set a listener to be notified via onVelChanged(entity) method 
//whenever the entity changes its velocity.
MovingEntity.prototype.setVelChangeListener = function(listener){
	if (listener == null || listener == undefined)
	{
		//default dummy listener
		this.velChangeListener = {
			onVelocityChanged: function(entity) {}
		};
	}
	else
	{
		this.velChangeListener = listener;
	}
}

//start moving to destination(x, y)
MovingEntity.prototype.startMoveTo = function (x, y) {
	var newDestination = new b2Vec2(x, y);
	
	Director._findPath(this.movingPath, this, newDestination);
	
	this.startMoveToNextPointInPath();
}

//start moving along the direction (x, y) 
MovingEntity.prototype.startMoveDir = function(x, y)
{
	var velocity = new b2Vec2(x, y);
	
	if (velocity.x != 0 && velocity.y != 0)
	{
		velocity.Normalize();
		velocity.Multiply(this.currentSpeed);
	}
	
	this.body.SetLinearVelocity(velocity);
	
	this.removeDestination();//we have started moving without destination
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
}

MovingEntity.prototype.updateMovement = function(elapsedTime)
{
	if (!this.deferConvergence && this.convergeDuration != -1)
	{
		//we are doing the convergence
		this.convergeDuration -= elapsedTime;
		if (this.convergeDuration <= 0)//convergence has ended
		{
			this.convergeDuration = -1;
			
			/*debugging
			var pos = this.getPosition();
			var vel = this.getVelocity();
			console.log("convergence ended position is: " + pos.x + "," + pos.y);
			console.log("convergence ended velocity is: " + vel.x + "," + vel.y);
			*/
			//now follow the correct path
			this.setPosition(this.afterConversePosition);
			this.startMoveDir(this.afterConverseDirection.x, this.afterConverseDirection.y);
		}
	}
	else
	{
		//this flag for telling the entity to start convergence only after this update
		if (this.deferConvergence)
		{
			this.deferConvergence = false;
			this._startConverge();
		}
	
		var currentPoint = this.movingPath.getFirstElem();
		if (currentPoint == null)
			return;
		
		var position = this.getPosition();
		var distance = new b2Vec2(currentPoint.x - position.x, currentPoint.y - position.y);
		var velocity = this.body.GetLinearVelocity();
		
		if ((distance.x == 0 && distance.y == 0) || (velocity.x * distance.x + velocity.y * distance.y < 0))//already at or pass the destination
		{
			//snap the position to the current destination
			this.body.SetPosition(currentPoint);
			//remove the current destination in the path
			this.movingPath.popFront();
			//start moving to next destination in the path
			this.startMoveToNextPointInPath();
		}
	}
}

//stop moving
MovingEntity.prototype.stop = function()
{
	this.body.SetLinearVelocity(new b2Vec2(0, 0));
	
	this.removeDestination();
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
}

//start move backward
MovingEntity.prototype.startMoveBackward = function()
{
	var velocity = this.body.GetLinearVelocity();
	
	this.body.SetLinearVelocity(new b2Vec2(-velocity.x, -velocity.y));
	
	this.removeDestination();
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
}

//get destination
MovingEntity.prototype.getDestination = function()
{
	if (this.movingPath.getNumElements() == 0)//no destination
	{
		//the destination is current position itself
		var position = this.getPosition();
		return position;
	}
	return this.movingPath.getLastElem();//destination is the last point in our moving path
}

//make the entity move without any destination
MovingEntity.prototype.removeDestination = function()
{
	this.movingPath.removeAll();
}

MovingEntity.prototype.isMoving = function()
{
	var velocity = this.body.GetLinearVelocity();
	
	return velocity.x != 0 || velocity.y != 0;
}

MovingEntity.prototype.isConverging = function(){
	return this.convergeDuration != -1;
}

//return b2Vec2
MovingEntity.prototype.getVelocity = function(){
	return this.body.GetLinearVelocity();
}

//get current speed
MovingEntity.prototype.getSpeed = function()
{
	return this.currentSpeed;
}

//get original speed
MovingEntity.prototype.getOriSpeed = function()
{
	return this.originalSpeed;
}

//set current speed
MovingEntity.prototype.setSpeed = function(speed)
{
	this.currentSpeed = speed;
}

//set original speed
MovingEntity.prototype.setOriSpeed = function(speed)
{
	this.originalSpeed = speed;
}

//set current speed by percent of original speed.
//percent is 1.0 means 100%
MovingEntity.prototype.setSpeedByPercent = function(percent)
{
	this.currentSpeed = this.originalSpeed * percent;
}

//change the speed by an amount <dSpeed>
MovingEntity.prototype.changeSpeed = function(dSpeed){
	var newSpeed = this.currentSpeed + dSpeed;
	if (newSpeed < 0)
		newSpeed = 0;
	
	var dSpeed = newSpeed - this.currentSpeed;
	this.currentSpeed = newSpeed;
	
	//change the speed of physical body
	var velocity = this.getVelocity();
	
	velocity.Normalize();
	velocity.Multiply(this.currentSpeed);
	
	this.body.SetLinearVelocity(velocity);
	
	if (this.currentSpeed == 0)
		this.removeDestination();
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
	
	return dSpeed;
	
}

MovingEntity.prototype.startMoveToNextPointInPath = function()
{
	var nextPoint = this.movingPath.getFirstElem();
	if (nextPoint == null)
	{
		this.stop();
		return;
	}
	var position = this.getPosition();
	var velocity = new b2Vec2(nextPoint.x - position.x, nextPoint.y - position.y);
	
	velocity.Normalize();
	velocity.Multiply(this.currentSpeed);
	
	this.body.SetLinearVelocity(velocity);
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
}

//change the position and velocity of the entity to reflect the correct state indicated in parameters
MovingEntity.prototype.correctMovement = function(posx, posy, dirx, diry, deferConvergence){
	//convergence
	var COVERGENCE_MAX_DURATION = 300;//0.3s
	
	this.convergeDuration = COVERGENCE_MAX_DURATION;
	
	this.afterConversePosition.Set(posx, posy);
	this.afterConverseDirection.Set(dirx, diry);
	
	if (!deferConvergence)//do not want deferring? 
	{
		//start convergence immediately
		this._startConverge();
	}
	
	//this flag for telling the entity to start convergence only after next update
	this.deferConvergence = deferConvergence;
	
}

//start convergence
MovingEntity.prototype._startConverge = function(){
	
	//find convergence's end point
	var vel = new b2Vec2(this.afterConverseDirection.x, this.afterConverseDirection.y);
	if (this.afterConverseDirection.x != 0 || this.afterConverseDirection.y != 0)
	{
		vel.Normalize();
		vel.Multiply(this.currentSpeed);
	}
	
	this.afterConversePosition.x += this.convergeDuration * vel.x / 1000.0;
	this.afterConversePosition.y += this.convergeDuration * vel.y / 1000.0;
	
	//find the velocity to move to the convergence's end point in <convergeDuration> time
	var pos = this.getPosition();
	this.convergeVelocity.Set(this.afterConversePosition.x - pos.x, this.afterConversePosition.y - pos.y);
	this.convergeVelocity.Multiply(1000.0 / this.convergeDuration);
	
	/*debugging
	console.log("convergence's end point is " + this.afterConversePosition.x + "," + this.afterConversePosition.y);
	console.log("convergence's velocity is " + this.convergeVelocity.x + "," + this.convergeVelocity.y);
	*/

	//now start moving to that convergence's end point
	this.body.SetLinearVelocity(this.convergeVelocity);
	
	this.removeDestination();//remove any destination
	
	this.velChangeListener.onVelocityChanged(this);//notify listener
}


//update the entity after <elapsedTime>
MovingEntity.prototype.update = function(elapsedTime){
	this.updateMovement(elapsedTime);
	//super class update
	NanoEntity.prototype.update.call(this, elapsedTime);
}


/*-----------PlayableEntity class (extends MovingEntity)--------------*/

var PlayableEntity = function( _id, _maxhp, _side, _width, _height, _x, _y, _oriSpeed, _sprite)
{
	if (_id == undefined)//this may be called by prototype inheritance
		return;
	this.skills;//skills set
	
	/*------constructor---------*/
	//call super class's constructor method
	MovingEntity.call(this, _id, _maxhp, _side, _width, _height, _x, _y, _oriSpeed, _sprite);
	
	this.skills = new Array();
}

//inheritance from MovingEntity
PlayableEntity.prototype = new MovingEntity();
PlayableEntity.prototype.constructor = PlayableEntity;

PlayableEntity.prototype.getNumSkills = function()
{
	return this.skills.length;
}

PlayableEntity.prototype.getSkill = function(skillIdx)
{
	return this.skills[skillIdx];
}

//check if the target in the skill's attacking range or not
PlayableEntity.prototype.canFireTo = function(skillIdx, destx, desty){
	var pos = this.getPosition();
	var dist = new b2Vec2(pos.x - destx, pos.y - desty)
				   .Length();
	var skill = this.getSkill(skillIdx);
	var range = skill.getRange();
	
	return (dist <= range);
}

//check if the target in the skill's attacking range or not
PlayableEntity.prototype.canAttack = function(skillIdx, target){
	return (this.canFireTo(skillIdx, target.getPosition().x , target.getPosition().y) && 
			target.getSide() != Constant.NEUTRAL && 
			this.getSide() != target.getSide());
}

//fire to an arbitrary position
PlayableEntity.prototype.fireToDest = function(skillIdx, dest){
	var skill = this.getSkill(skillIdx);
	
	if (Director.dummyClient || //dummy client will do whatever it is told to do
		this.canFireTo(skillIdx, dest.x, dest.y))
	{
		skill.fireToDest(dest);
		return PlayableEntity.SUCCEED;
	}
	else
		return PlayableEntity.ATTACK_OUT_OF_RANGE;
}

PlayableEntity.prototype.attack = function(skillIdx, target){
	var skill = this.getSkill(skillIdx);
	
	if (Director.dummyClient || //dummy client will do whatever it is told to do
		this.canAttack(skillIdx, target))
	{
		skill.fire(target);
		return PlayableEntity.SUCCEED;
	}
	else
		return PlayableEntity.ATTACK_OUT_OF_RANGE;
}


//update the entity after <elapsedTime>
PlayableEntity.prototype.update = function(elapsedTime){
	//super class update
	MovingEntity.prototype.update.call(this, elapsedTime);
	
	//update skills' cool down
	for (var i = 0; i < this.skills.length; ++i)
		this.skills[i].update(elapsedTime);
}

PlayableEntity.ATTACK_OUT_OF_RANGE = -1;
PlayableEntity.SUCCEED = 1;

// For node.js require
if (typeof global != 'undefined')
{
	global.NanoEntity = NanoEntity;
	global.MovingEntity = MovingEntity;
	global.PlayableEntity = PlayableEntity;
}

