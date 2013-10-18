
"use strict";
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_target, width, height, x, y, oriSpeed, spriteModule) {
	if (_target == undefined)
		return;//this may be called by prototype inheritance
	

    this.Target;//the projectile weapon's target(is an NanoEntity)

    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, -1, 0, Constant.NEUTRAL, width, height, x, y, oriSpeed, spriteModule);
    this.Target = _target;

	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
}


//inheritance from MovingEntity
Projectile.prototype = new MovingEntity();
Projectile.prototype.constructor = Projectile;

Projectile.prototype.getTarget = function () {

	return this.Target;

}

Projectile.prototype.seekTarget = function () {
	//get the current location of the target
	var _tp = this.Target.getPosition();
	var _tx = _tp.x;
	var _ty = _tp.y;
	//get the current location of the projectile
	var _pp = this.getPosition();
	var _px = _pp.x;
	var _py = _pp.y;
 
	this.startMoveDir(_tx - _px, _ty - _py);
}

//update the entity after <elapsedTime>
Projectile.prototype.update = function(elapsedTime){
	this.seekTarget();
	//super class update
	MovingEntity.prototype.update.call(this, elapsedTime);
}


/*-----------Acid class (extends Projectile)--------------*/

var Acid = function (_producer, _target, x, y) {
	if (_producer == undefined)
		return;
    this.producer;
	this.hit ;//does it hit target yet?
    /*------constructor---------*/
    //call super class's constructor method

    Projectile.call(this,_target,10,10,x,y,Constant.SPEED_VERY_FAST,"Acid");
	
	this.producer = _producer;
	this.hit = false;

}

//inheritance from Projectile
Acid.prototype = new Projectile();
Acid.prototype.constructor = Acid;

//update the entity after <elapsedTime>
Acid.prototype.update = function(elapsedTime){
	if (this.hit)//hit
	{
		var effect = new AcidEffect(this.producer);
		this.Target.addEffect(effect);
		this.destroy();
	}
	else
	{	
		//super class update
		Projectile.prototype.update.call(this, elapsedTime);
	}
}

//call when acid hit the target, new an acideffect, 

Acid.prototype.onHitTarget = function () {
	
	this.hit = true;//set the "hit" flag, so that next update will do something based on this flag
}