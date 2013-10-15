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
var AcidWeapon = function (_range, _damage, _owner, _effectDuration) {
	// public fields
	this.effectDuration; // Duration of the damaging effect
	
	// calls superclass constructor
	Skill.call(this, _range, _damage, _owner);
	
	var that = this;
	
	/**
	 * Implements Skill.fire(target)
	 * creates an Acid that chases the target
	 * @param target A NanoEntity to fire at
	 */
	this.fire = function(target) {
		// TODO match arguments of Acid API
		var acid = new Acid(that, target, that.effectDuration);
	}
}

/**
 * LifeLeech Class
 * A skill used by LeechVirus
 */
var LifeLeech = function (_range, _damage, _owner) {
	// calls superclass constructor
	Skill.call(this, _range, _damage, _owner);
	
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