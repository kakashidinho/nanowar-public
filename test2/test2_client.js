"use strict"
	
function start()
{	
	var client = new Client("canvas");
	client.start();
}

setTimeout(function() {
	start();
	; }, 500);


 