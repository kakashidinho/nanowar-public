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
	this.head;//head element
	this.last;//last element
	this.numElements;
	
	//constructor
	this.head = null;
	this.last = null;
	this.numElements = 0;
	
}


//insert to front of the queue
Utils.Queue.prototype.insert = function(object)
{
	var newNode = new Object;
	newNode.item = object,
	newNode.next = null,
	newNode.prev = null;

	newNode.next = this.head;
	if (this.head != null)
		this.head.prev = newNode;
	else//this is the first element
		this.last = newNode;//this.last should be this new element too
		
	this.head = newNode;
	
	this.numElements++;
}

//remove the this.last element from the queue
Utils.Queue.prototype.popLast = function()
{
	if (this.numElements == 0)
		return;
	if (this.last == this.head)
	{
		this.last = null;
		this.head = null;
	}
	else 
	{
		this.last.prev.next = null;
		this.last = this.last.prev;
	}
	
	this.numElements --;
}

Utils.Queue.prototype.getLastNode = function()
{
	return this.last;
}

Utils.Queue.prototype.getFirstNode = function()
{
	return this.head;
}

Utils.Queue.prototype.getNumElements = function()
{
	return this.numElements;
}

//list 
Utils.List = function()
{
	this.head;//this.head element
	this.last;//this.last element
	this.numElements;
	
	//constructor
	this.head = null;
	this.last = null;
	this.numElements = 0;
}

//insert to the front of the list. return newly created node
Utils.List.prototype.insertFront = function(object)
{
	var newNode = new Object;
	newNode.item = object,
	newNode.next = null,
	newNode.prev = null;

	newNode.next = this.head;
	if (this.head != null)
		this.head.prev = newNode;
	else//this is the first element
		this.last = newNode;//this.last should be this new element too
		
	this.head = newNode;//new node is the this.head
	
	this.numElements++;
	
	return newNode;
}

//insert to the back of the list. return newly created node
Utils.List.prototype.insertBack = function(object)
{
	var newNode = new Object;
	newNode.item = object,
	newNode.next = null,
	newNode.prev = null;

	newNode.prev = this.last;
	if (this.last != null)
		this.last.next = newNode;
	else//this is the first element
		this.head = newNode;//this.head should be this new element too
		
	this.last = newNode;//new node is the this.last node
	
	this.numElements++;
	
	return newNode;
}

//remove the this.last element from the list
Utils.List.prototype.popBack = function()
{
	if (this.numElements == 0)
		return;
	if (this.last == this.head)
	{
		this.last = null;
		this.head = null;
	}
	else 
	{
		this.last.prev.next = null;
		this.last = this.last.prev;
	}
	
	this.numElements --;
}

//remove the first element from the list
Utils.List.prototype.popFront = function()
{
	if (this.numElements == 0)
		return;
	if (this.last == this.head)
	{
		this.last = null;
		this.head = null;
	}
	else 
	{
		this.head.next.prev = null;
		this.head = this.head.next;
	}
	
	this.numElements --;
}

Utils.List.prototype.removeNode = function(node)
{
	if (node == this.head)
		return this.popFront();
	if (node == this.last)
		return this.popBack();
	if (node.next != null)
		node.next.prev = node.prev;
	if (node.prev != null)
		node.prev.next = node.next;
	this.numElements --;
}

//remove the element from this list
Utils.List.prototype.remove = function(elem){
	var node = this.head;
	while(node != null){
		if (node.item == elem)
			break;
		node = node.next;
	}
	
	if (node != null)
		this.removeNode(node);
}

Utils.List.prototype.removeAll = function()
{
	this.head = null;
	this.last = null;
	this.numElements = 0;
}

Utils.List.prototype.getLastNode = function()
{
	return this.last;
}

Utils.List.prototype.getFirstNode = function()
{
	return this.head;
}

//find the element in this list
Utils.List.prototype.findNode = function(elem){
	var node = this.head;
	while(node != null){
		if (node.item == elem)
			return node;
		node = node.next;
	}
	
	return null;
}

Utils.List.prototype.getNumElements = function()
{
	return this.numElements;
}

Utils.List.prototype.getFirstElem = function()
{
	if (this.head == null)
		return null;
	return this.head.item;
}

Utils.List.prototype.getLastElem = function()
{
	if (this.last == null)
		return null;
	return this.last.item;
}

//traverse through the list
Utils.List.prototype.traverse = function(callbackFunc)
{
	var node = this.head;
	while (node != null)
	{
		callbackFunc(node.item);
		node = node.next;
	}
}


//a binary heap which stores elements in increasing order, the first element is the one which smallest score
Utils.BinaryHeap = function(_scoreFunction){
	this.content = [];
	this.scoreFunction = _scoreFunction;
}


Utils.BinaryHeap.prototype.getNumElements = function()
{
	return this.content.length;
}

Utils.BinaryHeap.prototype.insert = function(object)
{
	//insert to the last place
	var LastIdx = this.content.length;
	this.content.push(object);
	
	this.upHeap();
}

Utils.BinaryHeap.prototype.getRoot = function()
{
	if (this.content.length == 0)
		return null;
	return this.content[0];
}

//returns removed root
Utils.BinaryHeap.prototype.removeRoot = function()
{
	if (this.content.length == 0)
		return null;
	var removedRoot = this.content[0];
	//move the last element to root
	this.content[0] = this.content[this.content.length - 1];
	this.content.pop();
	
	if (this.content.length > 0)
		this.downHeap();
	
	return removedRoot;
}

Utils.BinaryHeap.prototype.doesContain = function(object)
{
	/*
	//inefficient way
	for (var i = 0; i < this.content.length; ++i)
	{
		if (this.content[i] == object)
			return true;
	}*/
	var objScore = this.scoreFunction(object);
	if (this.content.length > 0)
		return this.doesContainInSubTree(0, object, objScore);
}

Utils.BinaryHeap.prototype.doesContainInSubTree = function(subtreeNodeIdx, object, objScore)
{
	var node = this.content[subtreeNodeIdx];
	var score = this.scoreFunction(node);
	
	if (objScore < score)
		return false;//no way this tree branch can contain this object
	else if (objScore == score && node == object)
		return true;
		
	var _2idx =  2 * subtreeNodeIdx;
	var c1Idx = _2idx + 1;
	var inChildTree = false;
	//first child
	if (c1Idx < this.content.length)
		inChildTree = this.doesContainInSubTree(c1Idx, object, objScore);
	
	if (inChildTree)
		return true;
	
	//second child
	var c2Idx = _2idx + 2;
	if (c2Idx < this.content.length)
		inChildTree = this.doesContainInSubTree(c2Idx, object, objScore);
		
	return inChildTree;
}

Utils.BinaryHeap.prototype.upHeap = function()
{
	//start from the last place
	var idx = this.content.length - 1;
	if (idx == 0)//this is the root
		return;
	var parentIdx = Math.floor((idx  - 1) / 2);
	var object = this.content[idx];
	var parent = this.content[parentIdx];
	
	while (idx > 0 && this.scoreFunction(object) < this.scoreFunction(parent)){
		//swap parent <-> object
		this.content[idx] = parent;
		this.content[parentIdx] = object;
		
		//move to next upper level
		idx = parentIdx;
		parentIdx = Math.floor((idx  - 1) / 2);
		if (idx > 0)
		{
			object = this.content[idx];
			parent = this.content[parentIdx];
		}
	}
}

Utils.BinaryHeap.prototype.downHeap = function() {
	var idx = 0;//start from the root
	var _notBreak = true;
	
	
	while (_notBreak){
		var _2idx =  2 * idx;
		var c1Idx = _2idx + 1;
		var c2Idx = _2idx + 2;
		var object = this.content[idx];
		var parentScore = this.scoreFunction(object);
		var childScore = -1;
		var childIdxToSwap = -1;
		var childToSwap = null;
		//compare with 1st child
		if (c1Idx < this.content.length)
		{
			var child1 = this.content[c1Idx];
			var childScore1 = this.scoreFunction(child1);
			if (childScore1 < parentScore)
			{
				//will swap with this child
				childIdxToSwap = c1Idx;
				childToSwap = child1;
				childScore = childScore1;
			}
		}
		
		//compare with 2nd child
		if (c2Idx < this.content.length){
			var child2 = this.content[c2Idx];
			var childScore2 = this.scoreFunction(child2);
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
			this.content[idx] = childToSwap;
			this.content[childIdxToSwap] = object;
			
			//move to next lower level
			idx = childIdxToSwap;
		}
		else
			_notBreak = false;//stop now
	}
}

//testing
if (false)
{
	var heap = new Utils.BinaryHeap(function(a) {return a;});
	
	heap.insert(5);
	heap.insert(4);
	heap.insert(3);
	heap.insert(6);
	heap.insert(6);
	heap.insert(1);
	heap.insert(9);
	
	var found = heap.doesContain(2);
	found = heap.doesContain(6);
}

// For node.js require
if (typeof global != 'undefined')
	global.Utils = Utils;