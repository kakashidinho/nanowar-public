
"use strict";
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_target, width, height, x, y, oriSpeed, spriteModule) {
    this.Target;//the projectile weapon's target(is an NanoEntity)
    var that = this;

    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, 100, Constant.NEUTRAL, width, height, x, y, oriSpeed, spriteModule);
    this.Target = _target;



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
        //change the velocity direction
        var _pv = new b2Vec2(_tx-_px,_ty-_py);
        _pv.Normalize();
        _pv.Multiply(that.currentSpeed);
        that.body.SetLinearVelocity(_pv);
    }


    this.onHitTarget = function () {
        //decrease the HP of the target
        that.Target.decreaseHP(20);
        //stop the projectile since it hits the target
        that.stop();
        //kill the projectile since it hits the target
        that.setAlive(false);
    }

}