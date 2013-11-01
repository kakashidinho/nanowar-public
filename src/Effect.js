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

var Effect = function (_duration, width, height, x, y, spriteModule) {
	if (_duration == undefined)
		return;//this may be called by prototype inheritance
	
    this.duration;
	
    /*--------constructor---------*/
    //call super class's constructor method
    NanoEntity.call(this, -1, 0, Constant.NEUTRAL, width, height, x, y, spriteModule);
    this.duration = _duration;
	
	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	//change the body type to kinematic
	this.body.SetType(b2Body.b2_kinematicBody);
	
    //there is an abstract method called affect
}

//inheritance from NanoEntity
Effect.prototype = new NanoEntity();
Effect.prototype.constructor = Effect;


/*-----------AcidEffect class (extends Effect)--------------*/

var AcidEffect = function (_producer) {
	if (_producer == undefined)
		return;//this may be called by prototype inheritance
		
    this.producer;
    this.damPerMs;//damage per millisecond

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, _producer.getEffectDuration(), Constant.EFFECT_SIZE, Constant.EFFECT_SIZE, 0, 0, "AcidEffect");
	this.producer = _producer;
	var damageDuration = this.producer.getEffectDuration();
	var totalDamage=this.producer.getDamage();
    this.damPerMs=totalDamage/damageDuration;
}

//inheritance from Effect
AcidEffect.prototype = new Effect();
AcidEffect.prototype.constructor = AcidEffect;


//return true if the effect has ended
AcidEffect.prototype.affect = function (target,elapsedTime) {
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
		target.decreaseHP(damage);
	}
	
	if (this.duration == 0)
		return true;
	return false;
}

/*-----------LifeLeechEffect class (extends Effect)--------------*/

var LifeLeechEffect = function (_leecher, _damage) {
	if (_leecher == undefined)
		return;//this may be called by prototype inheritance
		
    this.leecher;
	this.damage;

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, 1, Constant.CELL_SIZE, Constant.CELL_SIZE, 0, 0, "LifeLeechEffect");
	this.leecher = _leecher;
	this.damage = _damage;
}

//inheritance from Effect
LifeLeechEffect.prototype = new Effect();
LifeLeechEffect.prototype.constructor = LifeLeechEffect;


//return true if the effect has ended
LifeLeechEffect.prototype.affect = function (target,elapsedTime) {
	if (Director.dummyClient == false)
	{
		var dHP = target.decreaseHP(this.damage);
		this.leecher.increaseHP(dHP);
	}
	
	return true;//one time effect
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Effect = Effect;
	global.AcidEffect = AcidEffect;
	global.LifeLeechEffect = LifeLeechEffect;
}