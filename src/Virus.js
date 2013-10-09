"use strict";
/*----------LeechVirus class (extends PlayableEntity)------------*/

var LeechVirus = function(x, y)
{
	var that = this;

	//call super class's initializing method
	PlayableEntity.call( this,
				100, //hit point
				Constant.VIRUS, //this object is on virus's side 
				Constant.VIRUS_SIZE, Constant.VIRUS_SIZE, //the size of the object
				x, y,//position
				100,//max speed = 100 units/ second
				"LeechVirus"
				);
}