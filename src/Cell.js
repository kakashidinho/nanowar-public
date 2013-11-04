"use strict";
/*----------WarriorCell class (extends PlayableEntity)------------*/

var WarriorCell = function(id, x, y)
{
	if (id == undefined)
		return;//this may be called by prototype inheritance
	
	//call super class's initializing method
	PlayableEntity.call( this,
				id, //unique ID
				100, //hit point
				Constant.CELL, //this object is on cell's side 
				Constant.CELL_SIZE, Constant.CELL_SIZE, //the size of the object
				x, y,//position
				Constant.SPEED_NORMAL,//max speed (units/second)
				"WarriorCell"
				);
				
	//add AcidWeapon skill
	this.skills.push(new AcidWeapon(this));
	
	this.className = "WarriorCell";
}


//inheritance from PlayableEntity
WarriorCell.prototype = new PlayableEntity();
WarriorCell.prototype.constructor = WarriorCell;

// For node.js require
if (typeof global != 'undefined')
	global.WarriorCell = WarriorCell;