
"use strict";
/*short-form of box2d's functions and classes-------*/
var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape

/*-----------FakeTarget class (extends NanoEntity)----------*/
var FakeTarget = function(_director, x, y){
	NanoEntity.call(this, _director, -1, 0, Constant.NEUTRAL, 1, 1, x, y, null);
	
	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
}

//inheritance from MovingEntity
FakeTarget.prototype = new NanoEntity();
FakeTarget.prototype.constructor = FakeTarget;	
	
/*-----------Projectile class (extends MovingEntity)--------------*/

var Projectile = function (_director, _target, width, height, x, y, oriSpeed, spriteModule) {
	if (typeof _target == 'undefined')
		return;//this may be called by prototype inheritance
	
	//the projectile weapon's  sought target(is an NanoEntity)
    this.Target;
	this.oldTargetPos;

    /*------constructor---------*/
    //call super class's constructor method
    MovingEntity.call(this, _director, -1, 0, Constant.NEUTRAL, width, height, x, y, oriSpeed, spriteModule);
    this.Target = _target;

	//change the body's fixture type to sensor
	this.body.GetFixtureList().SetSensor(true);
	
	//store the old target position
	if (_target != null)
	{
		this.oldTargetPos = new b2Vec2(_target.getPosition().x, _target.getPosition().y);
		//start seeking target
		this.seekTarget();
	}
}


//inheritance from MovingEntity
Projectile.prototype = new MovingEntity();
Projectile.prototype.constructor = Projectile;

Projectile.prototype.getTarget = function () {

	return this.Target;

}

Projectile.prototype.seekTarget = function () {
	//get the current location of the target
	var _tp = this.Target.getPosition();
	var _tx = _tp.x;
	var _ty = _tp.y;
	//get the current location of the projectile
	var _pp = this.getPosition();
	var _px = _pp.x;
	var _py = _pp.y;
 
	this.startMoveDir(_tx - _px, _ty - _py);
}

//update the entity after <elapsedTime>
Projectile.prototype.update = function(elapsedTime){
	if (this.Target != null && this.Target.isAlive() == false)
	{
		this.Target = null;
		this.destroy();
		return;
	}
	if (this.Target != null)
	{
		var currentPos = this.Target.getPosition();
		if (this.oldTargetPos.x != currentPos.x || this.oldTargetPos.y != currentPos.y)
		{
			//only seek target if it changed position
			this.seekTarget();
			this.oldTargetPos.x = currentPos.x;
			this.oldTargetPos.y = currentPos.y;
		}
	}
	//super class update
	MovingEntity.prototype.update.call(this, elapsedTime);
}


/*-----------Acid class (extends Projectile)--------------*/

var Acid = function (_director, _producer, _target, x, y) {
	if (_director == undefined)
		return;
    this.producer;
	this.hit ;//does it hit target yet?
    /*------constructor---------*/
    //call super class's constructor method

    Projectile.call(this, _director, _target,1,1,x,y,Constant.SPEED_VERY_FAST,"Acid");
	
	this.producer = _producer;
	this.hit = false;

}

//inheritance from Projectile
Acid.prototype = new Projectile();
Acid.prototype.constructor = Acid;

//update the entity after <elapsedTime>
Acid.prototype.update = function(elapsedTime){
	if (this.hit)//hit
	{
		if (!this.director.dummyClient)//dummy client does nothing
		{
			var effect = new AcidEffect(this.director, this.producer, this.Target);
			this.Target.addEffect(effect);
		}
		this.destroy();
	}
	else
	{	
		//super class update
		Projectile.prototype.update.call(this, elapsedTime);
	}
}

//call when acid hit the target, new an acideffect, 

Acid.prototype.onHitTarget = function () {
	
	this.hit = true;//set the "hit" flag, so that next update will do something based on this flag
}


/*-----------AcidBomb class (extends Projectile)--------------*/

var AcidBomb = function (_director, _producer, destPos, x, y) {
	if (_director == undefined)
		return;
    this.producer;
	this.hit ;//does it hit target yet?
    /*------constructor---------*/
	//first create the fake target for the projectile
	var fakeTarget = new FakeTarget(_director, destPos.x, destPos.y);
	
    //call super class's constructor method
    Projectile.call(this,_director, fakeTarget,2,2,x,y,Constant.SPEED_FAST,"Acid");
	
	this.producer = _producer;
	this.hit = false;

}

//inheritance from Projectile
AcidBomb.prototype = new Projectile();
AcidBomb.prototype.constructor = AcidBomb;

//update the entity after <elapsedTime>
AcidBomb.prototype.update = function(elapsedTime){
	if (this.hit)//hit
	{
		var effect = new AcidAreaEffect(this.director, this.producer, this.producer.getAreaEffectDuration(), this.Target.getPosition().x, this.Target.getPosition().y);
		this.destroy();
		this.Target.destroy();//destroy fake target
	}
	else
	{	
		//super class update
		Projectile.prototype.update.call(this, elapsedTime);
	}
}

//call when web hit the target
AcidBomb.prototype.onHitTarget = function () {
	
	this.hit = true;//set the "hit" flag, so that next update will do something based on this flag
}

/*-----------Web class (extends Projectile)--------------*/

var Web = function (_director, _producer, destPos, x, y) {
	if (_director == undefined)
		return;
    this.producer;
	this.hit ;//does it hit target yet?
    /*------constructor---------*/
	//first create the fake target for the projectile
	var fakeTarget = new FakeTarget(_director, destPos.x, destPos.y);
	
    //call super class's constructor method
    Projectile.call(this,_director, fakeTarget,1.5,1.5,x,y,Constant.SPEED_VERY_FAST,"Web");
	
	this.producer = _producer;
	this.hit = false;

}

//inheritance from Projectile
Web.prototype = new Projectile();
Web.prototype.constructor = Web;

//update the entity after <elapsedTime>
Web.prototype.update = function(elapsedTime){
	if (this.hit)//hit
	{
		var effect = new WebAreaEffect(this.director, this.producer, this.Target.getPosition().x, this.Target.getPosition().y);
		this.destroy();
		this.Target.destroy();//destroy fake target
	}
	else
	{	
		//super class update
		Projectile.prototype.update.call(this, elapsedTime);
	}
}

//call when web hit the target
Web.prototype.onHitTarget = function () {
	
	this.hit = true;//set the "hit" flag, so that next update will do something based on this flag
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Projectile = Projectile;
	global.Acid = Acid;
	global.AcidBomb = AcidBomb;
	global.Web = Web;
}