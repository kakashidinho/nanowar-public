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

/*-------Director instance-------*/	
var Director = {};

Director.init = function(initFileXML, onInitFinished)
{
	/*---------Director instance definition-------------*/
	//private
	var gameInterval; // Interval variable used for gameLoop 
	var managedEntityList;//list of managed entity
	var cellSpawnPoints;//list of spawning locations for cells 
	var virusSpawnPoints;//list of spawning locations for viruses; 
	var lastUpdateTime;
	var currentUpdateTime;//for using during update
	var xmlParser;
	
	Director.onUpdate;//update callback function. should be function(lastUpdateTime, currentTime)
	
	var that = this;
	
	//init base instance
	DirectorBase.call(this);
	
	lastUpdateTime = -1;
	
	Director.onUpdate = undefined;//no update callback
	
	/*------------create xml parser-------------------*/
	xmlParser = new xml2js.Parser();
	
	/*------------------------*/
	managedEntityList = new Utils.List();
	cellSpawnPoints = new Array();
	virusSpawnPoints = new Array();
	
	/*---------method definitions----------------*/
	Director.startGameLoop = function(frameRate)
	{
		gameInterval = setInterval(function() {gameLoop();}, 1000.0/frameRate);
	}
	
	Director.endGameLoop = function()
	{
		if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
        }
	}
	
	Director.getCellSpawnPoints = function()
	{
		return cellSpawnPoints;
	}
	
	Director.getVirusSpawnPoints = function()
	{
		return virusSpawnPoints;
	}
	
	
	//notification from an entity telling that is hp has changed
	Director._onHPChanged = function(entity, dhp, isNegative){
		entity.managedWrapper.cumulateHPChange(isNegative? -dhp: dhp);
	}
	
	Director._addEntity = function(entity)
	{
		this._baseAddEntity(entity);//call base method
		
		var managedEntity = new ManagedEntity(entity);
		
		managedEntity.listNode = managedEntityList.insertBack(managedEntity);
	}
	
	Director._destroyEntity = function(entity){
		this._baseDestroyEntity(entity);//call base method
	
		var managedEntity = entity.managedWrapper;
		
		managedEntityList.removeNode(managedEntity.listNode );//remove this entity from the managed list
	}
	
	
	
	function gameLoop() {
		currentUpdateTime = Utils.getTimestamp();
		if (lastUpdateTime == -1)
			lastUpdateTime = currentUpdateTime;
		
		//var elapsedTime = currentUpdateTime - lastUpdateTime;
		var elapsedTime = 1000/60.0;
		lastUpdateTime = currentUpdateTime - elapsedTime;
		
		that._baseGameLoop(elapsedTime);//call base game update method
		
		//update the entities 
		managedEntityList.traverse(function(managedEntity) {
			managedEntity.getEntity().update(elapsedTime);
		}
		);
		
		//call update callback function
		if (Director.onUpdate != undefined)
			Director.onUpdate(lastUpdateTime, currentUpdateTime);
			
		
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
			
			parseXMLFile(mapFileXML, function(mapData) {
				initMap(mapData['map']);
				
				//finish our initialization
				onInitFinished();
			});
		});
	}
	
	function initMap(mapData)
	{
		var width = mapData['$'].width;
		var height = mapData['$'].height;
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
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Director = Director;
}
