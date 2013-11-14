"use strict"

/*---------Consumable (extends MovingEntity)-------*/
var Consumable = function(_director, id, startx, starty, dirx, diry, spriteModule){
	if (typeof startx == 'undefined')
		return;
	/*------constructor---------*/
	//call super class's constructor method
	MovingEntity.call(this, _director, id, 0, Constant.NEUTRAL, 3, 3, startx, starty, Constant.SPEED_FAST, spriteModule);
	
	if (!this.director.dummyClient)
		this.bounceEnabled = true;//will bounce back when colliding with obstacle
	
	this.startMoveDir(dirx, diry);
}

//inheritance from MovingEntity
Consumable.prototype = new MovingEntity();
Consumable.prototype.constructor = Consumable;


Consumable.prototype.update = function(elapsedTime){
	//super class's update
	MovingEntity.prototype.update.call(this, elapsedTime);
	
	if (this._implUpdate(elapsedTime))
		this.destroy();
}

//implementation dependent.
//return true of this Consumable is consumed
Consumable.prototype._implUpdate = function(elapsedTime){
}

/*----------class HealingDrug extends Consumable------------*/
var HealingDrug = function(_director, id, startx, starty, dirx, diry){
	this.consumer ;

	//super class constructor
	Consumable.call(this, _director, id, startx, starty, dirx, diry, "HealingDrug");
	
	this.consumer = null;
	
	this.className = "HealingDrug";
}



//inheritance from MovingEntity
HealingDrug.prototype = new Consumable();
HealingDrug.prototype.constructor = HealingDrug;

HealingDrug.prototype._implUpdate = function(elapsedTime){
	if(this.consumer != null)
	{
		if (this.consumer.isAlive())
		{
			var effect = new HealingEffect(this.director, this.consumer, 300);
			this.consumer.addEffect(effect);
		}
		return true;//I am consumed
	}
	return false;
}

HealingDrug.prototype.onCollideMovingEntity = function(entity){
	if(this.consumer != null ||//already has consumer
		this.director.dummyClient)//dummy client does nothing
		return ;
	if (entity.getSide() == Constant.CELL)//my consumer is a cell
		this.consumer = entity;
}

/*----------class MeatCell extends Consumable------------*/
/*-------HealingDrug equivalent for Viruses--------------*/
var MeatCell = function(_director, id, startx, starty, dirx, diry){
	this.consumer ;

	//super class constructor
	Consumable.call(this, _director, id, startx, starty, dirx, diry, "MeatCell");
	
	this.consumer = null;
	
	this.className = "MeatCell";
}



//inheritance from MovingEntity
MeatCell.prototype = new Consumable();
MeatCell.prototype.constructor = MeatCell;

MeatCell.prototype._implUpdate = function(elapsedTime){
	if(this.consumer != null)
	{
		if (this.consumer.isAlive())
		{
			var effect = new HealingEffect(this.director, this.consumer, 300);
			this.consumer.addEffect(effect);
		}
		return true;//I am consumed
	}
	return false;
}

MeatCell.prototype.onCollideMovingEntity = function(entity){
	if(this.consumer != null ||//already has consumer
		this.director.dummyClient)//dummy client does nothing
		return ;
	if (entity.getSide() == Constant.VIRUS)//my consumer is a virus
		this.consumer = entity;
}

if (typeof global != 'undefined')
{
	global.Consumable = Consumable;
	global.HealingDrug = HealingDrug;
	global.MeatCell = MeatCell;
}