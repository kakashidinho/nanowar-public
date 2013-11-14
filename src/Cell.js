"use strict";
/*----------WarriorCell class (extends PlayableEntity)------------*/

var WarriorCell = function(_director, id, x, y)
{
	if (_director == undefined)
		return;//this may be called by prototype inheritance
	
	//call super class's initializing method
	PlayableEntity.call( this,
				_director,
				id, //unique ID
				300, //hit point
				Constant.CELL, //this object is on cell's side 
				Constant.CELL_SIZE, Constant.CELL_SIZE, //the size of the object
				x, y,//position
				Constant.SPEED_NORMAL,//max speed (units/second)
				"WarriorCell"
				);
				
	//add AcidWeapon skill
	this.skills.push(new AcidWeapon(_director, this, 0));
	//add AcidCannon skill. 
	this.skills.push(new AcidCannon(_director, this, 1));
	
	this.className = "WarriorCell";
}


//inheritance from PlayableEntity
WarriorCell.prototype = new PlayableEntity();
WarriorCell.prototype.constructor = WarriorCell;

// For node.js require
if (typeof global != 'undefined')
	global.WarriorCell = WarriorCell;