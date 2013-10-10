"use strict"
	
function start() {
	
	Director.init("canvas", 600, 600, "map.xml");
	
	Director.initSpritesFromXML("sprites.xml");
	
	//create cell & virus object
	var cell = new WarriorCell(150, 150);
	cell.startMoveTo(300, 0);
	
	var virus = new LeechVirus(300, 300);
	
	//update function
	Director.onUpdate = function(lastTime, currentTime) {
		cell.stopIfAtDest();
	}
	
	//on click event handler
	Director.setOnClick ( function(mouseEvent) {
		cell.startMoveTo(mouseEvent.x, mouseEvent.y);
	});
	  
	Director.startGameLoop(60);//60 frames per second
}


setTimeout(function() {start(); }, 500);


 