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

var Effect = function (_affectedTarget, _duration, width, height, x, y, spriteModule) {
	if (typeof _affectedTarget == 'undefined')
		return;//this may be called by prototype inheritance
	
    this.duration;
	this.affectedTarget;//affected victim, maybe null.
	
    /*--------constructor---------*/
    //call super class's constructor method
    NanoEntity.call(this, -1, 0, Constant.NEUTRAL, width, height, x, y, spriteModule);
    this.duration = _duration;
	this.affectedTarget = _affectedTarget;
	
	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	//change the body type to kinematic
	this.body.SetType(b2Body.b2_kinematicBody);
	
    //there is an abstract method called affect
}

//inheritance from NanoEntity
Effect.prototype = new NanoEntity();
Effect.prototype.constructor = Effect;

//sub class should implement this method if they have area of effect
//<entity> is the one detected to come into contact with the effect's region
Effect.prototype.areaAffect = function(entity){
	//do nothing
}

Effect.prototype.update = function(elapsedTime){
	//base class's update
	NanoEntity.prototype.update.call(this, elapsedTime);
}


/*-----------AcidEffect class (extends Effect)--------------*/

var AcidEffect = function (_producer, affectedTarget) {
	if (_producer == undefined)
		return;//this may be called by prototype inheritance
		
    this.producer;
    this.damPerMs;//damage per millisecond

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, affectedTarget, _producer.getEffectDuration(), Constant.EFFECT_SIZE, Constant.EFFECT_SIZE, 0, 0, "AcidEffect");
	this.producer = _producer;
	var damageDuration = this.producer.getEffectDuration();
	var totalDamage=this.producer.getDamage();
    this.damPerMs=totalDamage/damageDuration;
}

//inheritance from Effect
AcidEffect.prototype = new Effect();
AcidEffect.prototype.constructor = AcidEffect;


AcidEffect.prototype.update = function (elapsedTime) {
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

var LifeLeechEffect = function (_leecher, _damage, affectedTarget) {
	if (_leecher == undefined)
		return;//this may be called by prototype inheritance
		
    this.leecher;
	this.damage;

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, affectedTarget, 1, Constant.CELL_SIZE, Constant.CELL_SIZE, 0, 0, "LifeLeechEffect");
	this.leecher = _leecher;
	this.damage = _damage;
}

//inheritance from Effect
LifeLeechEffect.prototype = new Effect();
LifeLeechEffect.prototype.constructor = LifeLeechEffect;

LifeLeechEffect.prototype.update = function (elapsedTime) {
	if (Director.dummyClient == false)
	{
		var dHP = this.affectedTarget.decreaseHP(this.damage);
		this.leecher.increaseHP(dHP);
	}
	
	this.destroy();//this is one time effect, so it should be destroyed immediately
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Effect = Effect;
	global.AcidEffect = AcidEffect;
	global.LifeLeechEffect = LifeLeechEffect;
}