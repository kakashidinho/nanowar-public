"use strict"
	
function start() {
	
	Director.initSpriteModulesFromXML("sprites.xml");
	
	//create cell & virus object
	var cell = new WarriorCell(200, 300);
	//cell.startMoveTo(300, 600);
	
	var virus = new LeechVirus(300, 300);
	
	//update function
	Director.onUpdate = function(lastTime, currentTime) {
	}
	
	//on click event handler
	Director.onClick = function(x, y, target) {
		if (target == null)
			cell.startMoveTo(x, y);
		else
			cell.attack(target);
	};
	  
	Director.startGameLoop(60);//60 frames per second
}


setTimeout(function() {
	//init director
	Director.init("canvas", 600, 600, "init.xml", function() {
		start();//start after the Director has finished its initialization
	})
	; }, 500);


 