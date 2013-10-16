
"use strict";
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_target, width, height, x, y, oriSpeed, spriteModule) {
	if (_target == undefined)
		return;//this may be called by prototype inheritance
	

    this.Target;//the projectile weapon's target(is an NanoEntity)

    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, 0, Constant.NEUTRAL, width, height, x, y, oriSpeed, spriteModule);
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

/*-----------Acid class (extends Projectile)--------------*/

var Acid = function (_producer, _target, x, y) {
	if (_producer == undefined)
		return;
    this.producer;
    
    var that = this;
    /*------constructor---------*/
    //call super class's constructor method
	this.producer = _producer;

    Projectile.call(this,_target,10,10,x,y,Constant.SPEED_VERY_FAST,"Acid");

}

//inheritance from Projectile
Acid.prototype = new Projectile();
Acid.prototype.constructor = Acid;



//call when acid hit the target, new an acideffect, 

Acid.prototype.onHitTarget = function () {

	var effect = new AcidEffect(this.producer);
	this.Target.addEffect(effect);

}