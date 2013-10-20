"use strict"
	
function start() {
	
	//create cell & virus object
	var cell = new WarriorCell(0, 200, 300);
	//cell.startMoveTo(300, 600);
	
	var virus = new LeechVirus(1, 300, 300);
	
	//update function
	Director.onUpdate = function(lastTime, currentTime) {
	}
	
	//on click event handler
	Director.onClick = function(x, y, target) {
		if (target == null)
		{
			Director.postMessage(new MoveToMsg(cell, x, y));
		}
		else
			Director.postMessage(new AttackMsg(cell, target));
	};
	
	Director.makeCameraFollow(cell);
	  
	Director.startGameLoop(60);//60 frames per second
}


setTimeout(function() {
	//init director
	Director.init(document.getElementById("canvas"), 600, 400, "init.xml", function() {
		start();//start after the Director has finished its initialization
	})
	; }, 500);


 