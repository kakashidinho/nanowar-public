"use strict"
	
function start()
{	
	while(document.readyState !== "complete") {console.log("loading...");};
	
	var client = new Client("canvas");
	client.start();
}

setTimeout(function() {
	start();
	; }, 1000);


 