var Constant = {
	NEUTRAL	:0,
	VIRUS	:1,
	CELL	:2,
	CELL_SIZE: 40,
	VIRUS_SIZE: 40,
	EFFECT_SIZE: 20,
	SPEED_NORMAL: 100,//typically, playable entity's speed
	SPEED_VERY_FAST: 300,//typically, bullet's speed
	SKILL_RANGE_MED: 120,
	SKILL_RANGE_LONG: 240,
	HEALTH_BAR_HEIGHT: 5,
	MAX_PLAYERS: 4
};

if (typeof global != 'undefined')
	global.Constant = Constant;