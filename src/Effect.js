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

    /*--------constructor---------*/
    //call super class's constructor method

    Effect.call(this, 10);



    this.affect = function (target,elapsedTime) {
        //can define the affect later, maybe add more function in the nanoentity
        target.dcreaseHP(20);
    }




}