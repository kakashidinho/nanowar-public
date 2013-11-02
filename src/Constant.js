var Constant = {
	NEUTRAL	:0,
	VIRUS	:1,
	CELL	:2,
	CELL_SIZE: 2,//units in physics
	VIRUS_SIZE: 2,//units in physics
	EFFECT_SIZE: 1,//units in physics
	SPEED_NORMAL: 5,//typically, playable entity's speed in physics' units
	SPEED_VERY_FAST: 15,//typically, bullet's speed in physics' units
	SKILL_RANGE_MED: 6,//units in physics
	SKILL_RANGE_LONG: 12,//units in physics
	HEALTH_BAR_HEIGHT: 0.4,//units in physics
	SERVER_MAX_CONNECTIONS: 4,
	SERVER_NAME: "localhost",
	SERVER_PORT: 8001,
	FRAME_RATE: 30,
	PHYSICS_UNIT_SCALE: 20//1 unit in physics equals 30 pixels
};

if (typeof global != 'undefined')
	global.Constant = Constant;