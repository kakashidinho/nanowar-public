/*
this code is used by nodejs
*/	

/*--------Director instance on server side------------*/

var fs = require('fs'),
    xml2js = require('xml2js');
	
var LIB_PATH = __dirname + "/";
require(LIB_PATH + "Utils.js");
require(LIB_PATH + "box2d.js");
require(LIB_PATH + "Constant.js");
require(LIB_PATH + "DirectorBase.js");
require(LIB_PATH + "Entity.js");
require(LIB_PATH + "Effect.js");
require(LIB_PATH + "Msg.js");
require(LIB_PATH + "Projectile.js");
require(LIB_PATH + "Skill.js");
require(LIB_PATH + "Cell.js");
require(LIB_PATH + "Virus.js");
require(LIB_PATH + "PowerUp.js");

/*-------Director class -------*/	
var Director = function(initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var MAX_POWER_UP_WAIT_TIME = 120000;//2 minutes
	var MIN_POWER_UP_WAIT_TIME = 60000;//1 minute
	var gameInterval; // Interval variable used for gameLoop 
	var managedEntityList;//list of managed entity
	var cellSpawnPoints;//list of spawning locations for cells 
	var virusSpawnPoints;//list of spawning locations for viruses;
	var width;//map's width
	var height;//map's height
	var mapDuration;
	var lastUpdateTime;
	var currentUpdateTime;//for using during update
	var xmlParser;
	var idSeed;//id seed
	var timeUntilNextPUp;//amount of time until next power up
	
	var locked;//lock some operations during update
	
	this.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	this.onEntityDeath ;
	this.onPowerUpAppear ;
	this.onPowerUpChangedDir;//callback being called when power up item has changed its direction
	this.onKillHappen;//callback function called when an enity killed a target
	this.onEndGame;
	
	var that = this;
	
	//init base instance
	DirectorBase.call(this);
	
	lastUpdateTime = -1;
	locked = false;
	idSeed = Constant.SERVER_MAX_CONNECTIONS;//reserve those smallest numbers for player's id
	
	//callback functions
	this.onUpdate = undefined;//no update callback
	this.onEntityDeath = function(id) {}
	this.onPowerUpAppear = function(powerUp) {}
	this.onPowerUpChangedDir = function(powerUp) {}
	this.onKillHappen = function(killer, killed){}
	this.onEndGame = function() {}
	
	/*------------create xml parser-------------------*/
	xmlParser = new xml2js.Parser();
	
	/*------------------------*/
	managedEntityList = new Utils.List();
	cellSpawnPoints = new Array();
	virusSpawnPoints = new Array();
	
	/*---------method definitions----------------*/
	this.startGameLoop = function(frameRate)
	{
		gameInterval = setInterval(function() {gameLoop();}, 1000.0/frameRate);
	}
	
	this.endGameLoop = function()
	{
		if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
        }
	}
	
	this.getCellSpawnPoints = function()
	{
		return cellSpawnPoints;
	}
	
	this.getVirusSpawnPoints = function()
	{
		return virusSpawnPoints;
	}
	
	this.getMapDuration = function(){
		return mapDuration;
	}
	
	this.stop = function(){
		this._baseStop();
		this.endGameLoop();
	}
	
	//notification from an entity telling that is hp has changed
	this._onHPChanged = function(entity, dhp, isNegative){
		entity.managedWrapper.cumulateHPChange(isNegative? -dhp: dhp);
	}
	
	this._addEntity = function(entity)
	{
		this._baseAddEntity(entity);//call base method
		
		var managedEntity = new ManagedEntity(entity);
		
		managedEntity.listNode = managedEntityList.insertBack(managedEntity);
		
		//if this entity is created during game update, then dont update this entity yet
		managedEntity.locked = locked;
	}
	
	//the death notification from entity
	this._notifyEntityDeath = function(entity){
		this.onEntityDeath(entity.getID());
	}
	
	this._destroyEntity = function(entity){
		this._baseDestroyEntity(entity);//call base method
	
		var managedEntity = entity.managedWrapper;
		
		managedEntityList.removeNode(managedEntity.listNode );//remove this entity from the managed list
	}
	
	
	this._notifyKillCount = function(killer, victim){
		this.onKillHappen(killer, victim);//notify outsider
	}
	
	
	function gameLoop() {
		currentUpdateTime = Utils.getTimestamp();
		if (lastUpdateTime == -1)
			lastUpdateTime = currentUpdateTime;
		
		var elapsedTime = currentUpdateTime - lastUpdateTime;
		
		mapDuration -= elapsedTime;
		
		//var elapsedTime = 1000/60.0;
		//lastUpdateTime = currentUpdateTime - elapsedTime;
		
		locked = true;//lock some operations
		
		that._baseGameLoop(elapsedTime);//call base game update method
		
		//update the entities 
		managedEntityList.traverse(function(managedEntity) {
			if (managedEntity.locked)
			{
				//this entity has just been created, dont update it yet
				managedEntity.locked = false;
			}
			else
			{
				managedEntity.getEntity().update(elapsedTime);
			}
		}
		);
		
		//call update callback function
		if (that.onUpdate != undefined)
			that.onUpdate(lastUpdateTime, currentUpdateTime);
			
		locked = false;//unlock some operations
		
		if (mapDuration <= 0)//game ended
		{
			that.onEndGame();
		}
		
		//randomly generate power up
		generatePowerUp(elapsedTime);
		
		lastUpdateTime = currentUpdateTime;
	}
	
	
	//callback = function(xmlData)
	function parseXMLFile(file, callback)
	{
		fs.readFile(file, function(err, data) {
			xmlParser.parseString(data, function (err, result) {
				callback(result);
			});
		});
	}
	
	function readInitFile(initFileXML)
	{
		parseXMLFile(initFileXML, function(data){
			var mapFileXML = data['initialization']['mapFile'][0];
			var mapDurationStr = data['initialization']['mapDuration'][0];
			mapDuration = parseInt(mapDurationStr);
			
			parseXMLFile(mapFileXML, function(mapData) {
				initMap(mapData['map']);
				
				//finish our initialization
				onInitFinished();
			});
		});
	}
	
	function initMap(mapData)
	{
		width = mapData['$'].width;
		height = mapData['$'].height;
		var tilesInfo = mapData.tilesInfo[0];
		var tilesMapStr = tilesInfo.tilesMap[0];
		that.tilesPerRow = mapData['$'].tilesPerRow;
		that.tilesPerCol = mapData['$'].tilesPerCol;
		
		that.tileWidth = width / that.tilesPerRow;
		that.tileHeight = height / that.tilesPerCol;
		
		/*----------boundary-------*/
		//physics boundary
		that._initPhysicsBounds(width,height);
		
		/*---init the tiles on the map------*/
		initTiles(tilesMapStr, tilesInfo);
	}
	
	function initTiles(tileMapStr, tilesInfo) {
		//init tile types
		var tileTypes = new Array();
		var tileTypeInfos = tilesInfo.tileType;
		for (var i = 0; i < tileTypeInfos.length; ++i)
		{
			var typeID = tileTypeInfos[i]['$'].id;
			var tileType = {
				isObstacle: tileTypeInfos[i]['$'].obstacle == "true",
				spawnVirus: tileTypeInfos[i]['$'].spawnVirus == "true",
				spawnCell: tileTypeInfos[i]['$'].spawnCell == "true"
			};
			
			tileTypes[typeID] = tileType;//put to the list
		}//for (var i = 0; i < tileTypeInfos.length; ++i)
		
		//now init the tiles in the map
		that.tiles = new Array();
		var rows = tileMapStr.split(/[\s\W]+/);
		if (rows[0].length == 0)
			rows.shift();
		for (var row = 0; row < that.tilesPerCol; ++row)
		{
			that.tiles[row] = new Array();
			
			for (var col = 0; col < that.tilesPerRow; ++col)
			{
				var tileID = rows[row].charAt(col);
				createTile(row, col, tileTypes[tileID]);
			}//for (var col = 0; col < that.tilesPerRow; ++col)
		}//for (var row = 0; row < that.tilesPerCol; ++row)
	}
	
	
	function createTile(row, col, tileType)
	{
		/*
		var tileType = {
				isObstacle: <boolean>
			};
		*/
		
		var tile = that._createPhysicsTile(row, col, tileType == undefined ? false : tileType.isObstacle);
		
		if (tileType == undefined)
			return;
		//insert to virus or cell spawning points
		if (tileType.spawnVirus)
			virusSpawnPoints.push(tile.center);
		else if (tileType.spawnCell)
			cellSpawnPoints.push(tile.center);
	}

	//generate random power up
	function generatePowerUp(elapsedTime){
		timeUntilNextPUp -= elapsedTime;
		
		if (timeUntilNextPUp <= 0)
		{
			var POWER_UPS = ['HealingDrug', 'MeatCell'];
			
			var rand_idx = Math.round(Math.random() * (POWER_UPS.length - 1));
			var powerupClass = POWER_UPS[rand_idx];
			
			//randomize starting position and direction
			var startingTile = null;
			do{
				//find a starting tile
				var rand_row = Math.round(Math.random() * (that.tilesPerCol - 1));
				var rand_col = Math.round(Math.random() * (that.tilesPerRow - 1));
				
				if (that.tiles[rand_row][rand_col].isObstacle == false)
					startingTile = that.tiles[rand_row][rand_col];
			} while (startingTile == null);
			
			//direction
			var rand_angle = Math.random() * Math.PI * 2;
			var dirx = Math.cos(rand_angle);
			var diry = Math.sin(rand_angle);
			
			var spawn_entity;
			
			switch (powerupClass)
			{
			case "HealingDrug":
				spawn_entity = new HealingDrug(that, idSeed, startingTile.center.x, startingTile.center.y, dirx, diry);
				break;
			case "MeatCell":
				spawn_entity = new MeatCell(that, idSeed, startingTile.center.x, startingTile.center.y, dirx, diry);
				break;
			}
			
			//listen to power up's direction change
			spawn_entity.setVelChangeListener(
			{
				onVelocityChanged : function(powerUp){
					that.onPowerUpChangedDir(powerUp);//call calback function
				}
			}
			);
			
			++idSeed;//increase the id seeding number
			
			randomPowerUpWaitTime();//calculate next waiting time
			
			//notify listener
			that.onPowerUpAppear(spawn_entity);
		}
	}
	
	//randomly calculate the wait time for next power up
	function randomPowerUpWaitTime(){
		var rand = Math.random();
		timeUntilNextPUp = rand * MAX_POWER_UP_WAIT_TIME + (1.0 - rand) * MIN_POWER_UP_WAIT_TIME;
	}
	
	/*----------------ManagedEntity - a wrapper for entity that is managed by director----------*/
	function ManagedEntity(_entity)
	{
		this.entity;//related entity
		this.dHPPos;//positive change in HP per frame
		this.dHPNeg;//negative change in HP per frame
		
		this.entity = _entity;
		this.dHPPos = this.dHPNeg = 0;
		
		this.entity.managedWrapper = this;//now the entity will know what is its wrapper
		
	}
	
	//get positive hp change
	ManagedEntity.prototype.getPosHPChange = function()
	{
		return this.dHPPos;
	}
	
	//get negative hp change
	ManagedEntity.prototype.getNegHPChange = function()
	{
		return this.dHPNeg;
	}
	
	ManagedEntity.prototype.getEntity = function(){
		return this.entity;
	}
	
	ManagedEntity.prototype.cumulateHPChange = function(dHP) {
		if (dHP > 0)//positive change
		{
			this.dHPPos += dHP;
		}
		else if (dHP <0)//negative change
		{
			this.dHPNeg += dHP;
		}
	}
	
	ManagedEntity.prototype.resetHPChange = function()
	{
		this.dHPPos = this.dHPNeg = 0;
	}
	
	/*----------all functions and member properties are ready ------*/
	/*----------start initialization using the configuration file---------*/
	readInitFile(initFileXML);
	//calculate next waiting time for power up
	randomPowerUpWaitTime();
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Director = Director;
}
