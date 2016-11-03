"use strict";

var COLONY_NAME = 'Akuukis Swarm';

// Requires
// var _ = require('lodash');
global.helper = require('./helpers');
global.getID = helper.getID;
global.gobi = helper.gobi;
global.posify = helper.posify;

// var adis =require('./adis');

// Classes
var Colony = require('./colony');
var City = require('./city');
var Squad = require('./squad');
var DTask = require('./dtask');

// Cache
global.RECACHE = true;
global.COLONY = new Colony(COLONY_NAME);
global.CITIES = new Map();
global.SQUADS = new Map();
global.DTASKS = new Map();

global.obselete = require('./obselete');

module.exports.loop = function() {
	// return;

	//// 0. //// Recache objects in-memory.
	helper.checkMemory();
	if(RECACHE){
		City.recache();
		Squad.recache();
		DTask.recache();
	};

	//// 1. //// Helper functions.

	//// 2. //// Adis - Automatic Debugging & Isolation System. a.k.a. self-debugger.

	//// 3. //// Colony (priority tasks).
	global.pulse = COLONY.pulse();

	//// 4. //// (each) City (priority tasks).
	for(let city of CITIES.values()){
		city.spawnQueue();
	};

	//// 5. //// (each) Squad.
	if(Game.cpu.tickLimit < Game.cpu.bucket){
		// Just execute all squads.
		// for(let squad of SQUADS.values()) squad.do();
	}else{
		// Execute all squads in prioritized order.
		let order = new Set('mine','upgr','deff','patr','offn','esco','scot');
		let subArrays = {};
		let orderedArray = new Array();
		for(let type of order.values()) subArrays[type] = new Array();
		for(let squad of SQUADS.values()) if(typeof subArrays[squad.type] == 'array') subArrays[squad.type].push(squad);
		for(let type of order.values()) orderedArray.push.apply(subArrays[type]);
		orderedArray.forEach( squad=>squad.do() );
	};

	//// 6. //// (each) City. Everythin of scope room.
	// Memory.cities.forEach(function(name){ city.spawnQueue(name); });

	//// 7. //// The Colony. Everything of scope global.
	Object.keys(Game.rooms).forEach(function(id){ COLONY.overlay(id); }); // Make overlay for each unexplored room.
	// Memory.demand.forEach(function(id){ COLONY.distribute(id); }); // Distribute spawning demands to spawns.
	COLONY.transits();

	//// 8. //// Deferred tasks. Anything not urgent and CPU intensive goes here.
	for(let dTask of DTASKS.values()){
		if(Game.cpu.getUsed()/Game.tickLimit>0.5) break;
		dTask.do();
	}

	//// Old code to be removed.
	obselete.loop();

	//// 9. //// statistics.
	helper.monitorCPU();

	global.RECACHE = false;
};
// END. Leave empty line below.
