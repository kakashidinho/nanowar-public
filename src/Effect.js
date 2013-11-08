// JavaScript source code

"use strict";

/*short-form of box2d's functions and classes-------*/
var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape

/*-----------Effect class (extends NanoEntity)--------------*/

var Effect = function (_producer, _affectedTarget, _duration, width, height, x, y, spriteModule, ground) {
	if (typeof _affectedTarget == 'undefined')
		return;//this may be called by prototype inheritance
	
	this.producer;
    this.duration;
	this.affectedTarget;//affected victim, maybe null.
	this.started;
	
    /*--------constructor---------*/
    //call super class's constructor method
    NanoEntity.call(this, -1, 0, Constant.NEUTRAL, width, height, x, y, spriteModule, ground == undefined? false: ground);
	this.producer = _producer;
    this.duration = _duration;
	this.affectedTarget = _affectedTarget;
	
	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	//change the body type to kinematic
	this.body.SetType(b2Body.b2_kinematicBody);
	
	this.started = false;
}

//inheritance from NanoEntity
Effect.prototype = new NanoEntity();
Effect.prototype.constructor = Effect;

Effect.prototype.getProducerID = function()
{
	return this.producer.getID();
}

Effect.prototype.getProducerOwnerID = function()
{
	return this.producer.getOwner().getID();
}

Effect.prototype.getAffectedTarget = function(){
	return this.affectedTarget;
}

//sub class should implement this method if they have area of effect
//<entity> is the one detected to come into contact with the effect's region
Effect.prototype.areaAffect = function(entity){
	//do nothing
}

//implementation dependent udpate
Effect.prototype._implUpdate = function(elapsedTime){
	//do nothing
}

Effect.prototype.update = function(elapsedTime){
	//base class's update
	NanoEntity.prototype.update.call(this, elapsedTime);
	
	if (this.started == false)
	{
		this.started = true;
		if (this.affectedTarget != null)
			this.affectedTarget.notifyEffectStarted(this);
	}
	
	this._implUpdate(elapsedTime);//subclass must implement _implUpdate()
}


/*-----------AcidEffect class (extends Effect)--------------*/

var AcidEffect = function (_producer, affectedTarget) {
	if (_producer == undefined)
		return;//this may be called by prototype inheritance
		
    this.damPerMs;//damage per millisecond

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, _producer, affectedTarget, _producer.getEffectDuration(), Constant.EFFECT_SIZE, Constant.EFFECT_SIZE, 0, 0, "AcidEffect");
	var damageDuration = this.producer.getEffectDuration();
	var totalDamage=this.producer.getDamage();
    this.damPerMs=totalDamage/damageDuration;
	
	this.className = 'AcidEffect';
}

//inheritance from Effect
AcidEffect.prototype = new Effect();
AcidEffect.prototype.constructor = AcidEffect;


AcidEffect.prototype._implUpdate = function (elapsedTime) {
	var effectElapsedTime ;
	if (this.duration > elapsedTime)
	{
		effectElapsedTime = elapsedTime;
		this.duration -= effectElapsedTime;
	}
	else//because the current time already pass the end time of the effect
	{
		effectElapsedTime = this.duration;//effect's elapsed time is the remaining duration of it
		this.duration = 0;
	}
	//can define the affect later, maybe add more function in the nanoentity
	//since affect will be called in a frequency(framerate), we divide the total damage into piece according to the elapse time
   
	if (Director.dummyClient == false)
	{
		//dummy client will not do this damage effect. Instead, it will be done by server
		var damage=this.damPerMs*effectElapsedTime;
		if(this.affectedTarget.isAlive())
			this.affectedTarget.decreaseHP(damage);
	}
	
	if (this.duration == 0 || this.affectedTarget.isAlive() == false)
		this.destroy();//effect has end its duration
}

/*-----------LifeLeechEffect class (extends Effect)--------------*/

var LifeLeechEffect = function (_producer, affectedTarget) {
	if (_producer == undefined)
		return;//this may be called by prototype inheritance
		
    this.leecher;

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, _producer, affectedTarget, 1, Constant.CELL_SIZE, Constant.CELL_SIZE, 0, 0, "LifeLeechEffect");
	this.leecher = _producer.getOwner();
	
	this.className = 'LifeLeechEffect';
}

//inheritance from Effect
LifeLeechEffect.prototype = new Effect();
LifeLeechEffect.prototype.constructor = LifeLeechEffect;

LifeLeechEffect.prototype._implUpdate = function (elapsedTime) {
	if (Director.dummyClient == false)
	{
		var dHP = this.affectedTarget.decreaseHP(this.producer.getDamage());
		this.leecher.increaseHP(dHP);
	}
	
	this.destroy();//this is one time effect, so it should be destroyed immediately
}


/*------------------WebAreaEffect (extends Effect)--------------*/
var WebAreaEffect = function (_producer, x, y) {
	this.affectedTargets;//list of targets inside this effect's region

    /*--------constructor---------*/
    //call super class's constructor method
    Effect.call(this, _producer, null, 200, 5 * Constant.CELL_SIZE, 5 * Constant.CELL_SIZE, x, y, "WebAreaEffect", true);
	
	this.affectedTargets = new Utils.List();
}

//inheritance from Effect
WebAreaEffect.prototype = new Effect();
WebAreaEffect.prototype.constructor = WebAreaEffect;

//someone has gone to my region
WebAreaEffect.prototype.areaAffect = function(entity){
	if (entity.getSide() == Constant.NEUTRAL || entity.getSide() == this.producer.getOwner().getSide())
		return;//not enemy
	if (Director.dummyClient)
		return;//dummy client does nothing
	this.affectedTargets.insertBack(entity);//add to pending affected targets list
}

WebAreaEffect.prototype._implUpdate = function (elapsedTime){
	this.duration -= elapsedTime;
	
	while (this.affectedTargets.getNumElements() > 0)
	{
		var entity = this.affectedTargets.getFirstElem();
		this.affectedTargets.popFront();
		//slow him down
		var effect = new WebEffect(this.producer, entity);
		entity.addEffect(effect);
	}
	
	if (this.duration <= 0)
	{
		this.destroy();
	}
}

/*------------------WebEffect (extends Effect)--------------*/
var WebEffect = function (_producer, affectedTarget) {
	this.speedReduceAmount;
	/*--------constructor---------*/
    //call super class's constructor method
	//8s effect
    Effect.call(this, _producer, affectedTarget, _producer.getEffectDuration(), Constant.CELL_SIZE, Constant.CELL_SIZE, 0, 0, "WebEffect");
	
	var speedReduceAmount = _producer.getDamage();
	
	//reduce the speed of affected target by <speedReduceAmount>
	affectedTarget.changeSpeed(- speedReduceAmount);
	
	this.className = 'WebEffect';
}

//inheritance from Effect
WebEffect.prototype = new Effect();
WebEffect.prototype.constructor = WebEffect;


WebEffect.prototype._implUpdate = function (elapsedTime){
	this.duration -= elapsedTime;
	
	if (this.duration <= 0 || this.affectedTarget.isAlive() == false)
	{
		var speedReduceAmount = this.producer.getDamage();
		
		//revert back the speed of the affected target
		this.affectedTarget.changeSpeed(speedReduceAmount);
		
		this.destroy();
	}
}



// For node.js require
if (typeof global != 'undefined')
{
	global.Effect = Effect;
	global.AcidEffect = AcidEffect;
	global.LifeLeechEffect = LifeLeechEffect;
	global.WebAreaEffect = WebAreaEffect;
	global.WebEffect = WebEffect;
}