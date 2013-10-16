// JavaScript source code

"use strict";
/*-----------Effect class (extends NanoEntity)--------------*/

var Effect = function (_duration, width, height, x, y, spriteModule) {

    this.duration;

    var that = this;
    /*--------constructor---------*/
    //call super class's constructor method
    NanoEntity.call(this, 0, Constant.NEUTRAL, width, height, x, y, spriteModule);
    this.duration = _duration;
	
	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	
    //there is an abstract method called affect
}



/*-----------AcidEffect class (extends Effect)--------------*/

var AcidEffect = function (_producer) {
    this.producer;
    var damPerMs;//damage per millisecond
	
    var that = this;

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, _producer.getEffectDuration(), Constant.EFFECT_SIZE, Constant.EFFECT_SIZE, 0, 0, "AcidEffect");
	this.producer = _producer;
	var damageDuration = this.producer.getEffectDuration();
	var totalDamage=this.producer.getDamage();
    damPerMs=totalDamage/damageDuration;


	//return true if the effect has ended
    this.affect = function (target,elapsedTime) {
		var effectElapsedTime ;
		if (this.duration > elapsedTime)
		{
			effectElapsedTime = elapsedTime;
			that.duration -= effectElapsedTime;
		}
		else//because the current time already pass the end time of the effect
		{
			effectElapsedTime = duration;//effect's elapsed time is the remaining duration of it
			that.duration = 0;
		}
        //can define the affect later, maybe add more function in the nanoentity
        //since affect will be called in a frequency(framerate), we divide the total damage into piece according to the elapse time
       
        var damage=damPerMs*effectElapsedTime;
        target.decreaseHP(damage);
		
		if (that.duration == 0)
			return true;
		return false;
    }




}