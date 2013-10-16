"use strict";
/*----------WarriorCell class (extends PlayableEntity)------------*/

var WarriorCell = function(x, y)
{
	var that = this;

	//call super class's initializing method
	PlayableEntity.call( this,
				100, //hit point
				Constant.CELL, //this object is on cell's side 
				Constant.CELL_SIZE, Constant.CELL_SIZE, //the size of the object
				x, y,//position
				Constant.SPEED_NORMAL,//max speed (units/second)
				"WarriorCell"
				);
				
	//add AcidWeapon skill
	this.skills.push(new AcidWeapon(this));
	
	this.activeSkill = 0;
}
