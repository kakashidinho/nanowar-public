"use strict";

//message type
var MsgType = {
	MOVE_ALONG: 0,//move along a direction
	MOVE_TO: 1,//move to a destination
	ATTACK: 2,
	EFFECT: 3,
	START:	4,//start game
	PLAYER_READY: 5,//player is ready to receive in-game messages
	PLAYER_CLASS: 6,
	PLAYER_ID: 7,//message notifying player's ID
	ENTITY_SPAWN: 8,
	ENTITY_MOVEMENT_UPDATE: 9,
	PLAYER_CONNECT: 10,
	PLAYER_DISCONNECT: 11,
	ENTITY_HP_CHANGE: 12,
	ENTITY_DEATH: 13,
	ATTACK_OUT_OF_RANGE: 14,
	CHANGE_FAKE_DELAY: 15,
	PING: 16,
	PING_NOTIFICATION: 17,
	SELF_CORRECT_PREDICTION: 18,
	SKILL_NOT_READY: 19,
	FIRE_TO: 20,
	ADD_EFFECT: 21,
	ENTITY_DESTROY: 22,
	ENTITY_RESPAWN: 23,
	ENTITY_RESPAWN_END: 24,
	KILL_COUNT: 25,
	DEATH_COUNT: 26,
	JOIN : 27,
	END_GAME: 28,
	GAME_ALREADY_START: 29,
	GAME_DURATION: 30,
	YOU_ARE_HOST: 31,
	CONNECTED_PLAYERS_INFO: 32,
	IN_GAME_PLAYERS_INFO: 33
};

function MoveAlongMsg(entity, dirx, diry){
	this.type = MsgType.MOVE_ALONG;
	this.entityID = entity.getID();
	this.dirx = dirx;
	this.diry = diry;
}

function MoveToMsg(entity, destx, desty){
	this.type = MsgType.MOVE_TO;
	this.entityID = entity.getID();
	this.destx = destx;
	this.desty = desty;
}

function AttackMsg(entity, target, skillIdx){
	this.type = MsgType.ATTACK;
	this.entityID = entity.getID();
	this.targetID = target.getID();
	this.skillIdx = skillIdx;
}

function FireToMsg(entity, destx, desty, skillIdx){
	this.type = MsgType.FIRE_TO;
	this.entityID = entity.getID();
	this.destx = destx;
	this.desty = desty;
	this.skillIdx = skillIdx;
}

function StartGameMsg(initXML)
{
	this.type = MsgType.START;
	this.initXML = initXML;
}

function JoinMsg() {
	this.type = MsgType.JOIN;
}

//player ready to receive in-game messages
function PlayerReadyMsg(playerID) {
	this.type = MsgType.PLAYER_READY;
	this.playerID = playerID;
}

function PlayerClassMsg(className){
	this.type = MsgType.PLAYER_CLASS;
	this.className = className;
}

function PlayerFinishLoadMsg(playerID){
	this.type = MsgType.PLAYER_FINISHED_LOAD;
	this.playerID = playerID;
}

function PlayerIDMsg(playerID){
	this.type = MsgType.PLAYER_ID;
	this.playerID = playerID;
}

function EntitySpawnMsg(entityID, className, hp, x, y){
	this.type = MsgType.ENTITY_SPAWN;
	this.entityID = entityID;
	this.className = className;
	this.x = x;
	this.y = y;
	this.dirx = 0;
	this.diry = 0;
	this.hp = hp;
}

function EntitySpawnMsg2(entity){
	var pos = entity.getPosition();
	var vel = entity.getVelocity();
	this.type = MsgType.ENTITY_SPAWN;
	this.entityID = entity.getID();
	this.className = entity.getClassName();
	this.x = pos.x;
	this.y = pos.y;
	this.dirx = vel.x;
	this.diry = vel.y;
	this.hp = entity.getHP();
}

function EntityRespawnMsg2(entity){
	var pos = entity.getPosition();
	var vel = entity.getVelocity();
	this.type = MsgType.ENTITY_RESPAWN;
	this.entityID = entity.getID();
	this.x = pos.x;
	this.y = pos.y;
	this.hp = entity.getHP();
}

function EntityMoveMentMsg(entity){
	var position = entity.getPosition();
	var velocity = entity.getVelocity();

	this.type = MsgType.ENTITY_MOVEMENT_UPDATE;
	this.entityID = entity.getID();
	this.x = position.x;
	this.y = position.y;
	this.dirx = velocity.x;
	this.diry = velocity.y;
}

//dHPNeg must be a positive number
function EntityHPChange(entityID, dHPPos, dHPNeg) {
	this.type = MsgType.ENTITY_HP_CHANGE;
	this.entityID = entityID;
	this.dHPPos = Math.abs(dHPPos);//the amount of HP changed positively
	this.dHPNeg = Math.abs(dHPNeg);//the absolute amount of HP changed negatively
}

function EntityDeathMsg(entityID){
	this.type = MsgType.ENTITY_DEATH;
	this.entityID = entityID;
}

function EntityDestroyMsg(entityID){
	this.type = MsgType.ENTITY_DESTROY;
	this.entityID = entityID;
}

function AttackOutRangeMsg(){
	this.type = MsgType.ATTACK_OUT_OF_RANGE;
}

function SkillNotReadyMsg(){
	this.type = MsgType.SKILL_NOT_READY;
}

function ChangeFakeDelayMsg(dDelay){
	this.type = MsgType.CHANGE_FAKE_DELAY;
	this.dDelay = dDelay;
}

function PingMsg(time){
	this.type = MsgType.PING;
	this.time = time;
}

function PingNotifyMsg(ping) {
	this.type = MsgType.PING_NOTIFICATION;
	this.ping = ping;
}

function AddEffectMsg(effect){
	this.type = MsgType.ADD_EFFECT;
	this.producerID = effect.getProducerID();
	this.producerOwnerID = effect.getProducerOwnerID();
	this.affectedTargetID = effect.getAffectedTarget().getID();
	this.className = effect.getClassName();
}

function EntityRespawnEndMsg(entityID){
	this.type = MsgType.ENTITY_RESPAWN_END;
	this.entityID = entityID;
}

function KillDeathCountMsg(isKillCountMsg, count){
	this.type = isKillCountMsg? MsgType.KILL_COUNT: MsgType.DEATH_COUNT;
	this.count = count;
}

function EndMsg(virusesRank, cellsRank) {
	this.type = MsgType.END;
	this.virusesRank = virusesRank;
	this.cellsRank = cellsRank;
}

function GameDurationMsg(duration){
	this.type = MsgType.GAME_DURATION;
	this.duration = duration;
}

function GameAlreadyStartedMsg(){
	this.type = MsgType.GAME_ALREADY_START;
}

function YouHostMsg(){
	this.type = MsgType.YOU_ARE_HOST;
}

function ConnectedPlayersInfoMsg(virusCount, cellCount){
	this.type = MsgType.CONNECTED_PLAYERS_INFO;
	this.virusCount = virusCount;
	this.cellCount = cellCount;
}

function IngamePlayersInfoMsg(virusCount, cellCount){
	this.type = MsgType.IN_GAME_PLAYERS_INFO;
	this.virusCount = virusCount;
	this.cellCount = cellCount;
}

// For node.js require
if (typeof global != 'undefined')
{
	global.MoveAlongMsg = MoveAlongMsg;
	global.MoveToMsg = MoveToMsg;
	global.AttackMsg = AttackMsg;
	global.StartGameMsg = StartGameMsg;
	global.PlayerReadyMsg = PlayerReadyMsg;
	global.PlayerClassMsg = PlayerClassMsg;
	global.PlayerFinishLoadMsg = PlayerFinishLoadMsg;
	global.PlayerIDMsg = PlayerIDMsg;
	global.EntitySpawnMsg = EntitySpawnMsg;
	global.EntitySpawnMsg2 = EntitySpawnMsg2;
	global.EntityRespawnMsg2 = EntityRespawnMsg2;
	global.EntityMoveMentMsg = EntityMoveMentMsg;
	global.EntityHPChange = EntityHPChange;
	global.EntityDeathMsg = EntityDeathMsg;
	global.AttackOutRangeMsg = AttackOutRangeMsg;
	global.SkillNotReadyMsg = SkillNotReadyMsg;
	global.ChangeFakeDelayMsg = ChangeFakeDelayMsg;
	global.PingMsg = PingMsg;
	global.PingNotifyMsg = PingNotifyMsg;
	global.FireToMsg = FireToMsg;
	global.AddEffectMsg = AddEffectMsg;
	global.EntityDestroyMsg = EntityDestroyMsg;
	global.EntityRespawnEndMsg = EntityRespawnEndMsg;
	global.KillDeathCountMsg = KillDeathCountMsg;
	global.EndMsg = EndMsg;
	global.GameDurationMsg = GameDurationMsg;
	global.GameAlreadyStartedMsg = GameAlreadyStartedMsg;
	global.YouHostMsg = YouHostMsg;
	global.ConnectedPlayersInfoMsg = ConnectedPlayersInfoMsg;
	global.IngamePlayersInfoMsg = IngamePlayersInfoMsg;
	global.MsgType = MsgType;
}