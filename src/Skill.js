"use strict";

/**
 * Skill Class
 * Abstract class to represent a skill
 * owned by a PlayableEntity instance
 * Subclasses should implement _fireForReal(target:NanoEntity)
 */
var Skill = function(skillID, _range, _damage, _owner, _maxCooldown, spriteModule) {
	if (skillID == undefined)
		return;//this may be called by prototype inheritance
	// Public fields
	this.range; // Effective range of the skill
	this.damage; // Total damage of the skill
	this.owner; // A reference to the PlayableEntity that owns this skill
	this.cooldown;//milliseconds need to wait before continue firing again
	this.maxCooldown;
	this.spriteModule;
	this.fired;
	this.reducedCooldownByLag;//reduced cooldown because of network delay
	this.skillID;
	
	this.range = _range;
	this.damage = _damage;	
	this.owner = _owner;
	this.maxCooldown = _maxCooldown;
	this.cooldown = 0;
	this.spriteModule = spriteModule;
	this.fired = false;
	this.reducedCooldownByLag = 0;
	this.skillID = skillID;
}

// getters
Skill.prototype.getOwner = function()
{
	return this.owner;
}

Skill.prototype.getOwnerID = function()
{
	return this.owner.getID();
}

Skill.prototype.getID = function()
{
	return this.skillID;
}

Skill.prototype.getRange = function() {
	return this.range;
}

Skill.prototype.getDamage = function() {
	return this.damage;
}

Skill.prototype.getCooldown = function() {
	return this.cooldown;
}

Skill.prototype.getMaxCooldown = function(){
	return this.maxCooldown;
}

Skill.prototype.getSpriteModuleName = function(){
	return this.spriteModule;
}

Skill.prototype.reduceCooldown = function(d){
	this.reducedCooldownByLag = d;
}

Skill.prototype.update = function(elapsedTime) {
	if (this.fired)//has just fired
	{
		this.fired = false;
		this.cooldown += this.maxCooldown;//make the skill unable to be used again until <cooldown> time later
		
		this.cooldown -= this.reducedCooldownByLag;
		
		this.reducedCooldownByLag = 0;
		
		if (this.cooldown < 0)
			this.cooldown = 0;
	}
	else if (this.cooldown > 0)
	{
		this.cooldown -= elapsedTime;
		if (this.cooldown < 0)
			this.cooldown = 0;
	}
}

/**
 * @param target A NanoEntity target to fire at
*/
Skill.prototype.fire = function(target) {
	if (this.cooldown > 0 || this.fired)
		return;
		
	this._fireForReal(target);//sub class's specific implementation 
	
	this.fired = true;
}

/**
 * @param destination a destination position to fire to
*/
Skill.prototype.fireToDest = function(destination) {
	if (this.cooldown > 0 || this.fired)
		return;
		
	this.fired = this._fireToDestForReal(destination);//sub class's specific implementation 
}

/**
* Implementation dependant function
 * @param target, a destination position to fire to
*/
Skill.prototype._fireToDestForReal = function(destination) {
	//do nothing
	return false;//return false to indicate that this skill does not support arbitrary destination
}


/**
 * AcidWeapon Class
 * A skill used by WarriorCell
 */
var AcidWeapon = function ( _owner, skillID) {
	if (_owner == undefined)
		return;
	// public fields
	this.effectDuration; // Duration of the damaging effect
	
	// calls superclass constructor
	Skill.call(this, skillID, Constant.SKILL_RANGE_LONG, 30, _owner, 700, "AcidWeapon");//0.7s cooldown
	
	this.effectDuration = 3000;//3s
}

//inheritance from Skill
AcidWeapon.prototype = new Skill();
AcidWeapon.prototype.constructor = AcidWeapon;

AcidWeapon.prototype.getEffectDuration = function() {
	return this.effectDuration;
}

/**
 * Implements Skill._fireForReal(target)
 * creates an Acid that chases the target
 * @param target A NanoEntity to fire at
 */
AcidWeapon.prototype._fireForReal = function(target) {
	var ownerPos = this.owner.getPosition();
	//shoot the acid projectile starting from the skill owner's position
	var acid = new Acid(this, target, ownerPos.x, ownerPos.y);
}

/**
 * LifeLeech Class
 * A skill used by LeechVirus
 */
var LifeLeech = function (_owner, skillID) {
	if (_owner == undefined)
		return;
		
	// calls superclass constructor
	Skill.call(this, skillID, Constant.SKILL_RANGE_MED, 28, _owner, 1000, "LifeLeech");//1s cooldown
	
}


//inheritance from Skill
LifeLeech.prototype = new Skill();
LifeLeech.prototype.constructor = LifeLeech;

	
/**
 * Implements Skill._fireForReal(target)
 * @param target A NanoEntity to fire at
 */
LifeLeech.prototype._fireForReal = function(target) {
	if (Director.dummyClient)
		return;//dummy client does nothing
		
	var effect = new LifeLeechEffect(this, target);
	target.addEffect(effect);
}


/**
 * AcidCannon Class
 * A skill used by WarriorCell
 */
var AcidCannon = function (_owner, skillID) {
	if (_owner == undefined)
		return;
	
	this.effectDuration; // Duration of the acid area
	
	// calls superclass constructor
	Skill.call(this, skillID, 
			Constant.SKILL_RANGE_MED, 
			30, //total damage
			_owner,
			12000, //12s cooldown
			"AcidCannon");
			
	this.effectDuration = 6000;//6s
	
}


//inheritance from Skill
AcidCannon.prototype = new Skill();
AcidCannon.prototype.constructor = AcidCannon;

AcidCannon.prototype.getAreaEffectDuration = function() {
	return this.effectDuration;
}

//the duration of the effect that produces by acid area effect
AcidCannon.prototype.getEffectDuration = function() {
	return this.effectDuration;
}
	
/**
 * Implements Skill._fireForReal(target)
 * @param target A NanoEntity to fire at
 */
AcidCannon.prototype._fireForReal = function(target) {
	this._fireToDestForReal(target.getPosition());
}

/**
 * Implements Skill._fireToDestForReal(dest)
 * @param dest A destination position to fire to
 */
AcidCannon.prototype._fireToDestForReal = function(dest) {
	var ownerPos = this.owner.getPosition();
	//shoot the acid bomb projectile starting from the skill owner's position
	var web = new AcidBomb(this, dest, ownerPos.x, ownerPos.y);
	
	return true;
}


/**
 * WebGun Class
 * A skill used by LeechVirus
 */
var WebGun = function (_owner, skillID) {
	if (_owner == undefined)
		return;
	this.effectDuration;
	
	// calls superclass constructor
	//the amount of speed that the target will be reduced by this skill
	//is stored as damage of this skill
	Skill.call(this, skillID, Constant.SKILL_RANGE_LONG, Constant.SPEED_NORMAL, _owner, 10000, "WebGun");//10s cooldown
	
	this.effectDuration = 3000;//3s
	
}


//inheritance from Skill
WebGun.prototype = new Skill();
WebGun.prototype.constructor = WebGun;

WebGun.prototype.getEffectDuration = function() {
	return this.effectDuration;
}
	
/**
 * Implements Skill._fireForReal(target)
 * @param target A NanoEntity to fire at
 */
WebGun.prototype._fireForReal = function(target) {
	this._fireToDestForReal(target.getPosition());
}

/**
 * Implements Skill._fireToDestForReal(dest)
 * @param dest A destination position to fire to
 */
WebGun.prototype._fireToDestForReal = function(dest) {
	var ownerPos = this.owner.getPosition();
	//shoot the web projectile starting from the skill owner's position
	var web = new Web(this, dest, ownerPos.x, ownerPos.y);
	
	return true;
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Skill = Skill;
	global.AcidWeapon = AcidWeapon;
	global.LifeLeech = LifeLeech;
	global.AcidCannon = AcidCannon;
	global.WebGun = WebGun;
}