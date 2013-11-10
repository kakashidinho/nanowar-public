var Constant = {
	NEUTRAL	:0,
	VIRUS	:1,
	CELL	:2,
	CELL_SIZE: 3,//units in physics
	VIRUS_SIZE: 3,//units in physics
	EFFECT_SIZE: 2,//units in physics
	SPEED_NORMAL: 5,//typically, playable entity's speed in physics' units
	SPEED_SLOW: 8,
	SPEED_FAST: 10,
	SPEED_VERY_FAST: 15,//typically, bullet's speed in physics' units
	SKILL_RANGE_MED: 9,//units in physics
	SKILL_RANGE_LONG: 18,//units in physics
	HEALTH_BAR_HEIGHT: 0.4,//units in physics
	SERVER_MAX_CONNECTIONS: 50,
	SERVER_NAME: "localhost",
	//SERVER_NAME: "lehoangquyen-i.comp.nus.edu.sg",
	SERVER_PORT: 8000,
	FRAME_RATE: 30,
	PHYSICS_UNIT_SCALE: 20,//1 unit in physics equals 30 pixels
	MAX_SKILL_SLOTS: 2//max number of skills of a player
};

if (typeof global != 'undefined')
	global.Constant = Constant;