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
	Object.keys(Memory.cities).forEach(name=>{
		if(!CITIES.has(name)) CITIES.set(name, new City(name));
		CITIES.get(name).spawnQueue();
	});

	//// 5. //// (each) Squad tasks in order.
	// Object.keys(Memory.squads.mine).forEach(function(id){ squad.doMine(id); });
	// Object.keys(Memory.squads.upgr).forEach(function(id){ squad.doUpgr(id); });
	// Object.keys(Memory.squads.deff).forEach(function(id){ squad.doDeff(id); });
	// Object.keys(Memory.squads.patr).forEach(function(id){ squad.doPatr(id); });
	// Object.keys(Memory.squads.offn).forEach(function(id){ squad.doOffn(id); });
	// Object.keys(Memory.squads.esco).forEach(function(id){ squad.doEsco(id); });
	// Object.keys(Memory.squads.scot).forEach(function(id){ squad.doScot(id); });

	//// 6. //// (each) City. Everythin of scope room.
	// Memory.cities.forEach(function(name){ city.spawnQueue(name); });

	//// 7. //// The Colony. Everything of scope global.
	Object.keys(Game.rooms).forEach(function(id){ COLONY.overlay(id); }); // Make overlay for each unexplored room.
	// Memory.demand.forEach(function(id){ COLONY.distribute(id); }); // Distribute spawning demands to spawns.
	COLONY.transits();

	//// 8. //// Deferred tasks. Anything not urgent and CPU intensive goes here.

	for(let dTask of DTASKS.values()){
		console.log('doing', Game.cpu.tickLimit, Game.cpu.getUsed());
		if(Game.cpu.tickLimit<400) break;
		if(Game.cpu.getUsed()/Game.tickLimit>0.6) break;
		dTask.do();
	}

	//// Old code to be removed.
	obselete.loop();

	//// 9. //// statistics.
	helper.monitorCPU();

	global.RECACHE = false;
};
// END. Leave empty line below.
