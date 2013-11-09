"use strict"

var Player = function(_connID, _playerID, num_dk_versions) {
	this.connID;
	this.playerID;
	this.character;
	this.charPredict;//prediction versions of my character, for dead reckoning. 
	this.className;//name of the character class that player chose
	this.killCount;
	this.deathCount;
	this.ping;//network ping delay of this player
	this.pingSamples;//sampled ping values
	this.pingSamplesSum;//sum of samples of network ping delay
	this.pingUpdateInterval;
	this.fakeDelay;//fake additional network one-way delay for this player
	this.respawnWaitTime;
	this.respawnDuration;
	this.subscribers;//list of updating subscribers
	this.isHost;//is this player the one that decides the game map
	
	//Server will wait for this amount of time before updating clients 
	//about the hp of this player's character
	this.hpUpdateDelay;
	
	this.connID = _connID;
	this.playerID = _playerID;
	this.character = null;
	this.charPredict = new Array();
	for (var i = 0; i < num_dk_versions; ++i)
	{
		this.charPredict.push(null);
	}
	
	this.killCount = this.deathCount = 0;
	
	this.ping = 0;
	this.fakeDelay = 0;
	this.pingSamples = new Utils.List();
	this.pingSamplesSum = 0;
	this.pingUpdateInterval = undefined;
	
	this.respawnWaitTime = this.respawnDuration = 0;
	
	this.subscribers = new Utils.List();
	this.isHost = false;
	
	this.hpUpdateDelay = 500;//0.5s delay by default
	
	this.needUpdateHPToClients = function(elapsedTime)
	{
		var update = false;
		
		this.hpUpdateDelay -= elapsedTime;
		
		if (this.hpUpdateDelay <= 0 || this.character.isAlive() == false)
		{
			update = true;
			this.hpUpdateDelay = 500;
		}
		
		return update;
	}
}

// For node.js require
if (typeof global != 'undefined')
{
	global.Player = Player;
}