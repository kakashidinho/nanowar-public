"use strict";

/**
 * Skill Class
 * Abstract class to represent a skill
 * owned by a PlayableEntity instance
 * Subclasses should implement fire(target:NanoEntity)
 */
var Skill = function(_range, _damage, _owner) {
	// Public fields
	this.range; // Effective range of the skill
	this.damage; // Total damage of the skill
	this.owner; // A reference to the PlayableEntity that owns this skill
	
	var that = this;
	this.range = _range;
	this.damage = _damage;	
	this.owner = _owner;
	
	// getters
	this.getRange = function() {
		return that.range;
	}
	
	this.getDamage = function() {
		return that.damage;
	}

	/**
	 * Abstract function to be implemented by subclasses
	 * @param target A NanoEntity target to fire at
	*/
	this.fire = function(target) {
		console.log("Warning: Abstract function Skill.fire should not be called!");
	}
}

/**
 * AcidWeapon Class
 * A skill used by WarriorCell
 */
var AcidWeapon = function ( _owner) {
	// public fields
	this.effectDuration; // Duration of the damaging effect
	
	// calls superclass constructor
	Skill.call(this, Constant.SKILL_RANGE_LONG, 30, _owner);//range = 240, total damage = 30
	
	var that = this;
	this.effectDuration = 3000;//3s
	
	this.getEffectDuration = function() {
		return that.effectDuration;
	}
	
	/**
	 * Implements Skill.fire(target)
	 * creates an Acid that chases the target
	 * @param target A NanoEntity to fire at
	 */
	this.fire = function(target) {
		var ownerPos = that.owner.getPosition();
		//shoot the acid projectile starting from the skill owner's position
		var acid = new Acid(that, target, ownerPos.x, ownerPos.y);
	}
}

/**
 * LifeLeech Class
 * A skill used by LeechVirus
 */
var LifeLeech = function (_owner) {
	// calls superclass constructor
	Skill.call(this, Constant.SKILL_RANGE_MED, 20, _owner);
	
	var that = this;
	
	/**
	 * Implements Skill.fire(target)
	 * reduces HP from the target
	 * and increases the same amount of HP
	 * for the skill caster
	 * @param target A NanoEntity to fire at
	 */
	this.fire = function(target) {
		// TODO match NanoEntity API
		target.decreaseHP(that.damage);
		that.owner.increaseHP(that.damage);
	}
}