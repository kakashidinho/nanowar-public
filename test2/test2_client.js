"use strict"
	
function start()
{	
	while(document.readyState !== "complete") {console.log("loading...");};
	
	var client = new Client("canvas");
	client.start();
	client.initXMLFile = 'init2.xml';
}

setTimeout(function() {
	start();
	; }, 1000);


 