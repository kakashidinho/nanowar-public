"use strict";

var MsgType = {
	MOVING: 1,
	ATTACK: 2,
	EFFECT: 3
};

function MovingMsg(entity, destx, desty){
	this.type = MsgType.MOVING;
	this.entity = entity;
	this.destx = destx;
	this.desty = desty;
}

function AttackMsg(entity, target){
	this.type = MsgType.ATTACK;
	this.entity = entity;
	this.target = target;
}