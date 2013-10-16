
"use strict";
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_target, width, height, x, y, oriSpeed, spriteModule) {
    this.Target;//the projectile weapon's target(is an NanoEntity)
    var that = this;

    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, 0, Constant.NEUTRAL, width, height, x, y, oriSpeed, spriteModule);
    this.Target = _target;

	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	

    this.getTarget = function () {

        return that.Target;

    }

    this.seekTarget = function () {
        //get the current location of the target
        var _tp = that.Target.getPosition();
        var _tx = _tp.x;
        var _ty = _tp.y;
        //get the current location of the projectile
        var _pp = that.getPosition();
        var _px = _pp.x;
        var _py = _pp.y;
     
        that.startMoveDir(_tx - _px, _ty - _py);
    }



}


/*-----------Acid class (extends Projectile)--------------*/

var Acid = function (_producer, _target, x, y) {
    this.producer;
    
    var that = this;
    /*------constructor---------*/
    //call super class's constructor method

    Projectile.call(this,_target,10,10,x,y,Constant.SPEED_VERY_FAST,"Acid");

    //call when acid hit the target, new an acideffect, 

    this.onHitTarget = function () {

        var effect = new AcidEffect(that.producer);
        this.Target.addEffect(effect);

    }

}