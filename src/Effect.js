// JavaScript source code

"use strict";
/*-----------Effect class (extends NanoEntity)--------------*/

var Effect = function (_duration) {

    this.duration;

    var that = this;
    /*--------constructor---------*/
    //call super class's constructor method
    NanoEntity.call(this, 100, Constant.NEUTRAL, 10,10, 1, 1, "Effect");
    this.duration = _duration;
    //there is an abstract method called affect
}





var AcidEffect = function (_producer) {
    this.producer;
    var that = this;

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, 10);



    this.affect = function (target,elapsedTime) {
        //can define the affect later, maybe add more function in the nanoentity
        //since affect will be called in a frequency(framerate), we divide the total damage into piece according to the elapse time
        var damageDuration = that.producer.getEffectDuration();
        var totalDamage=that.producer.getDamage();
        var damagePerMs=totalDamage/damageDuration*elapsedTime;
        target.dcreaseHP(damagePerMs);
    }




}