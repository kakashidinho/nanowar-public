
"use strict";
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_maxhp,_side,_width,_height,_x,_y,_Orispeed,_sprite) {
    this.Target;//the projectile weapon's target(is an NanoEntity)
    var that = this;
    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, _maxhp, _side, _width, _height, _x, _y, _Orispeed, _sprite);






    this.seekTarget = function () {

        that.Target=0;

        
    }


    this.onHitTarget = function () {
        var distance;//distance between the projectile and its target
        //get the target position by public method
        var _tposition=that.Target.getPosition();
        var _tx=_tposition.x;
        var _ty = tposition.y;
        //get the projectile position by public method
        var _pposition=that.getPosition();
        var _px=_pposition.x;
        var _py=_pposition.y;
        //count its distance;
        var total=(_px-_tx)*(_px-_tx)+(_py-_ty)*(_py-_ty);
        distance = Math.sqrt(total);


        if(distance<=10){


        }

    }

}