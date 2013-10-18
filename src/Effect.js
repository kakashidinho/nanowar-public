// JavaScript source code

"use strict";
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
AcidEffect.prototype = new NanoEntity();
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
   
	var damage=this.damPerMs*effectElapsedTime;
	target.decreaseHP(damage);
	
	if (this.duration == 0)
		return true;
	return false;
}