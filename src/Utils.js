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
	head = null;
	last = null;
	numElements = 0;
	
	//insert to front of the queue
	this.insert = function(object)
	{
		var newNode = new Object;
		newNode.item = object,
		newNode.next = null,
		newNode.prev = null;
	
		newNode.next = head;
		if (head != null)
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
			last = null;
			head = null;
		}
		else 
		{
			last.prev.next = null;
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
	head = null;
	last = null;
	numElements = 0;
	
	//insert to the front of the list
	this.insertFront = function(object)
	{
		var newNode = new Object;
		newNode.item = object,
		newNode.next = null,
		newNode.prev = null;
	
		newNode.next = head;
		if (head != null)
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
		newNode.next = null,
		newNode.prev = null;
	
		newNode.prev = last;
		if (last != null)
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
			last = null;
			head = null;
		}
		else 
		{
			last.prev.next = null;
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
			last = null;
			head = null;
		}
		else 
		{
			head.next.prev = null;
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
		if (node.next != null)
			node.next.prev = node.prev;
		if (node.prev != null)
			node.prev.next = node.next;
		numElements --;
	}
	
	this.removeAll = function()
	{
		head = null;
		last = null;
		numElements = 0;
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
	
	this.getFirstElem = function()
	{
		if (head == null)
			return null;
		return head.item;
	}
	
	this.getLastElem = function()
	{
		if (last == null)
			return null;
		return last.item;
	}
	
	//traverse through the list
	this.traverse = function(callbackFunc)
	{
		var node = head;
		while (node != null)
		{
			callbackFunc(node.item);
			node = node.next;
		}
	}
}


//a binary heap which stores elements in increasing order, the first element is the one which smallest score
Utils.BinaryHeap = function(_scoreFunction){
	var content = [];
	var scoreFunction = _scoreFunction;
	
	
	this.getNumElements = function()
	{
		return content.length;
	}
	
	this.insert = function(object)
	{
		//insert to the last place
		var LastIdx = content.length;
		content.push(object);
		
		upHeap();
	}
	
	this.getRoot = function()
	{
		if (content.length == 0)
			return null;
		return content[0];
	}
	
	//returns removed root
	this.removeRoot = function()
	{
		if (content.length == 0)
			return null;
		var removedRoot = content[0];
		//move the last element to root
		content[0] = content[content.length - 1];
		content.pop();
		
		if (content.length > 0)
			downHeap();
		
		return removedRoot;
	}
	
	this.doesContain = function(object)
	{
		for (var i = 0; i < content.length; ++i)
		{
			if (content[i] == object)
				return true;
		}
		
		return false;
	}
	
	function upHeap()
	{
		//start from the last place
		var idx = content.length - 1;
		if (idx == 0)//this is the root
			return;
		var parentIdx = Math.floor((idx  - 1) / 2);
		var object = content[idx];
		var parent = content[parentIdx];
		
		while (idx > 0 && scoreFunction(object) < scoreFunction(parent)){
			//swap parent <-> object
			content[idx] = parent;
			content[parentIdx] = object;
			
			//move to next upper level
			idx = parentIdx;
			parentIdx = Math.floor((idx  - 1) / 2);
			if (idx > 0)
			{
				object = content[idx];
				parent = content[parentIdx];
			}
		}
	}
	
	function downHeap() {
		var idx = 0;//start from the root
		var _notBreak = true;
		
		
		while (_notBreak){
			var _2idx =  2 * idx;
			var c1Idx = _2idx + 1;
			var c2Idx = _2idx + 2;
			var object = content[idx];
			var parentScore = scoreFunction(object);
			var childScore = -1;
			var childIdxToSwap = -1;
			var childToSwap = null;
			//compare with 1st child
			if (c1Idx < content.length)
			{
				var child1 = content[c1Idx];
				var childScore1 = scoreFunction(child1);
				if (childScore1 < parentScore)
				{
					//will swap with this child
					childIdxToSwap = c1Idx;
					childToSwap = child1;
					childScore = childScore1;
				}
			}
			
			//compare with 2nd child
			if (c2Idx < content.length){
				var child2 = content[c2Idx];
				var childScore2 = scoreFunction(child2);
				if (childScore2 < (childToSwap == null? parentScore : childScore))
				{
					//will swap with this child
					childIdxToSwap = c2Idx;
					childToSwap = child2;
				}
			}
		
			if (childToSwap != null)
			{
				//swap parent <-> child
				content[idx] = childToSwap;
				content[childIdxToSwap] = object;
				
				//move to next lower level
				idx = childIdxToSwap;
			}
			else
				_notBreak = false;//stop now
		}
	}
}

/*------------end code from eloquentjavascript.net---*/

// For node.js require
global.Utils = Utils;