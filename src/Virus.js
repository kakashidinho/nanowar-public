"use strict";
/*----------LeechVirus class (extends PlayableEntity)------------*/

var LeechVirus = function(_director, id, x, y)
{
	if (_director == undefined)
		return;//this may be called by prototype inheritance
	
	//call super class's initializing method
	PlayableEntity.call( this,
				_director,
				id, //unique id
				300, //hit point
				Constant.VIRUS, //this object is on virus's side 
				Constant.VIRUS_SIZE, Constant.VIRUS_SIZE, //the size of the object
				x, y,//position
				Constant.SPEED_NORMAL,//units/ second
				"LeechVirus"
				);
				
	//add LifeLeech skill
	this.skills.push(new LifeLeech(_director, this, 0));
	
	//add WebGun skill
	this.skills.push(new WebGun(_director, this, 1));
	
	this.className = "LeechVirus";
}

//inheritance from PlayableEntity
LeechVirus.prototype = new PlayableEntity();
LeechVirus.prototype.constructor = LeechVirus;

// For node.js require
if (typeof global != 'undefined')
{
	global.LeechVirus = LeechVirus;
}