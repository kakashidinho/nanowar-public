"use strict";

/**
 * Skill Class
 * Abstract class to represent a skill
 * owned by a PlayableEntity instance
 * Subclasses should implement fire(target:NanoEntity)
 */
var Skill = function(_range, _damage, _owner) {
	if (_range == undefined)
		return;//this may be called by prototype inheritance
	// Public fields
	this.range; // Effective range of the skill
	this.damage; // Total damage of the skill
	this.owner; // A reference to the PlayableEntity that owns this skill
	
	this.range = _range;
	this.damage = _damage;	
	this.owner = _owner;
}

// getters
Skill.prototype.getRange = function() {
	return this.range;
}

Skill.prototype.getDamage = function() {
	return this.damage;
}

/**
 * Abstract function to be implemented by subclasses
 * @param target A NanoEntity target to fire at
*/
Skill.prototype.fire = function(target) {
	console.log("Warning: Abstract function Skill.fire should not be called!");
}

/**
 * AcidWeapon Class
 * A skill used by WarriorCell
 */
var AcidWeapon = function ( _owner) {
	if (_owner == undefined)
		return;
	// public fields
	this.effectDuration; // Duration of the damaging effect
	
	// calls superclass constructor
	Skill.call(this, Constant.SKILL_RANGE_LONG, 30, _owner);//range = 240, total damage = 30
	
	this.effectDuration = 3000;//3s
}

//inheritance from Skill
AcidWeapon.prototype = new Skill();
AcidWeapon.prototype.constructor = AcidWeapon;

AcidWeapon.prototype.getEffectDuration = function() {
	return this.effectDuration;
}

/**
 * Implements Skill.fire(target)
 * creates an Acid that chases the target
 * @param target A NanoEntity to fire at
 */
AcidWeapon.prototype.fire = function(target) {
	var ownerPos = this.owner.getPosition();
	//shoot the acid projectile starting from the skill owner's position
	var acid = new Acid(this, target, ownerPos.x, ownerPos.y);
}

/**
 * LifeLeech Class
 * A skill used by LeechVirus
 */
var LifeLeech = function (_owner) {
	if (_owner == undefined)
		return;
		
	// calls superclass constructor
	Skill.call(this, Constant.SKILL_RANGE_MED, 20, _owner);
	
}


//inheritance from Skill
LifeLeech.prototype = new Skill();
LifeLeech.prototype.constructor = LifeLeech;

	
/**
 * Implements Skill.fire(target)
 * reduces HP from the target
 * and increases the same amount of HP
 * for the skill caster
 * @param target A NanoEntity to fire at
 */
LifeLeech.prototype.fire = function(target) {
	var effect = new LifeLeechEffect(this.owner, this.damage);
	target.addEffect(effect);
}


// For node.js require
if (typeof global != 'undefined')
{
	global.Skill = Skill;
	global.AcidWeapon = AcidWeapon;
	global.LifeLeech = LifeLeech;
}