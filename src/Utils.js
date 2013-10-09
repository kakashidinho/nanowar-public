"use strict"

var Utils = {};

// the following snippet defines an appropriate high resolution 
// getTimestamp function depends on platform.
if (typeof window === "undefined") {
	console.log("using process.hrtime()");
	Utils.getTimestamp = function() { var t = process.hrtime(); return t[0]*1e3 + t[1]*1.0/1e6} 
} else if (window.performance !== undefined) {
	if (window.performance.now) {
		console.log("using window.performence.now()");
		Utils.getTimestamp = function() { return window.performance.now(); };
	} else if (window.performance.webkitNow) {
		console.log("using window.performence.webkitNow()");
		Utils.getTimestamp = function() { return window.performance.webkitNow(); };
	}
} else {
	console.log("using Date.now();");
	Utils.getTimestamp = function() { return new Date().now(); };
}

//queue
Utils.Queue = function()
{
	var head;//head element
	var last;//last element
	var numElements;
	
	//constructor
	head = undefined;
	last = undefined;
	numElements = 0;
	
	//insert to front of the queue
	this.insert = function(object)
	{
		var newNode = new Object;
		newNode.item = object,
		newNode.next = undefined,
		newNode.prev = undefined;
	
		newNode.next = head;
		if (head != undefined)
			head.prev = newNode;
		else//this is the first element
			last = newNode;//last should be this new element too
			
		head = newNode;
		
		numElements++;
	}
	
	//remove the last element from the queue
	this.popLast = function()
	{
		if (numElements == 0)
			return;
		if (last == head)
		{
			last = undefined;
			head = undefined;
		}
		else 
		{
			last.prev.next = undefined;
			last = last.prev;
		}
		
		numElements --;
	}
	
	this.getLastNode = function()
	{
		return last;
	}
	
	this.getFirstNode = function()
	{
		return head;
	}
	
	this.getNumElements = function()
	{
		return numElements;
	}
}

//list 
Utils.List = function()
{
	var head;//head element
	var last;//last element
	var numElements;
	
	//constructor
	head = undefined;
	last = undefined;
	numElements = 0;
	
	//insert to the front of the list
	this.insertFront = function(object)
	{
		var newNode = new Object;
		newNode.item = object,
		newNode.next = undefined,
		newNode.prev = undefined;
	
		newNode.next = head;
		if (head != undefined)
			head.prev = newNode;
		else//this is the first element
			last = newNode;//last should be this new element too
			
		head = newNode;//new node is the head
		
		numElements++;
	}
	
	//insert to the back of the list
	this.insertBack = function(object)
	{
		var newNode = new Object;
		newNode.item = object,
		newNode.next = undefined,
		newNode.prev = undefined;
	
		newNode.prev = last;
		if (last != undefined)
			last.next = newNode;
		else//this is the first element
			head = newNode;//head should be this new element too
			
		last = newNode;//new node is the last node
		
		numElements++;
	}
	
	//remove the last element from the list
	this.popBack = function()
	{
		if (numElements == 0)
			return;
		if (last == head)
		{
			last = undefined;
			head = undefined;
		}
		else 
		{
			last.prev.next = undefined;
			last = last.prev;
		}
		
		numElements --;
	}
	
	//remove the first element from the list
	this.popFront = function()
	{
		if (numElements == 0)
			return;
		if (last == head)
		{
			last = undefined;
			head = undefined;
		}
		else 
		{
			head.next.prev = undefined;
			head = head.next;
		}
		
		numElements --;
	}
	
	this.removeNode = function(node)
	{
		if (node == head)
			return popFront();
		if (node == last)
			return popBack();
		if (node.next != undefined)
			node.next.prev = node.prev;
		if (node.prev != undefined)
			node.prev.next = node.next;
		numElements --;
	}
	
	this.getLastNode = function()
	{
		return last;
	}
	
	this.getFirstNode = function()
	{
		return head;
	}
	
	this.getNumElements = function()
	{
		return numElements;
	}
	
	//traverse through the list
	this.traverse = function(callbackFunc)
	{
		var node = head;
		while (node != undefined)
		{
			callbackFunc(node.item);
			node = node.next;
		}
	}
}

// For node.js require
global.Utils = Utils;