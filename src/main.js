"use strict";
console.log('Reinitiate.')

//// Variables.
var COLONY_NAME = 'Akuukis Swarm';


//// Helpers.
// var _ = require('lodash');
global.helper = require('./helpers');
helper.checkMemory();
global.getID = helper.getID;
global.gobi = helper.gobi;
global.posify = helper.posify;
global.CACHE = false;


{  //// Extend existing classes.
	let extend = function extend(screepsClass, newMethods){
		for(let key in newMethods) screepsClass.prototype[key] = newMethods[key];
	};
	extend(global.Room, require('extendRoom'));
};


{ //// New classes.
	global.Player = require('./colony');
	// global.Bazaar = require('./bazaar');
	global.Squad = require('./squad');
	global.DTask = require('./dtask');
};


//// Temporarly.
global.obselete = require('./obselete');


//// Main loop.
module.exports.loop = function() {

	// return;


	//// 0. //// Global entities: Build from Memory to RAM.
	helper.checkMemory();
	if(!global.CACHE){
		global.CACHE = {};
		global.CACHE.player = new global.Player(COLONY_NAME);
		// global.CACHE.bazaar = Bazaar.recache();
		global.CACHE.squads = Squad.recache();
		global.CACHE.dtasks = DTask.recache();
	};
	for(let key in global.CACHE) Game[key] = global.CACHE[key];


	//// Entity acts: Colony.
	global.IRR = Game.player.irr();
	global.pulse = Game.player.pulse();
	Object.keys(Game.rooms).forEach(function(id){ Game.player.overlay(id); }); // Make overlay for each unexplored room.
	// Memory.demand.forEach(function(id){ Game.player.distribute(id); }); // Distribute spawning demands to spawns.
	Game.player.transits();


	//// Entities act: Rooms.
	for(let key in Game.rooms){
		Game.rooms[key].spawnQueue();
	};


	//// Entities acts: Squads.
	if(Game.cpu.tickLimit < Game.cpu.bucket){
		// Just execute all squads.

		for(let squad of Game.squads.values()) squad.tick();
		// if(pulse) for(let squad of Game.squads.values()) squad.pulse();

	}else{
		// Execute all squads in prioritized order.

		let order = new Set('mine','upgr','deff','patr','offn','esco','scot');
		let subArrays = {};
		let orderedArray = new Array();
		for(let type of order.values()) subArrays[type] = new Array();
		for(let squad of Game.squads.values()) if(typeof subArrays[squad.type] == 'array') subArrays[squad.type].push(squad);
		for(let type of order.values()) orderedArray.push.apply(subArrays[type]);
		orderedArray.forEach( squad=>squad.tick() );
		if(pulse) orderedArray.forEach( squad=>squad.pulse() );

	};


	//// Deferred tasks: anything not urgent and CPU intensive goes here.
	for(let dTask of Game.dtasks.values()){
		if(Game.cpu.getUsed()/Game.tickLimit>0.5) break;
		dTask.do();
	}


	//// Temporarly: code to be removed.
	obselete.loop();


	//// Statistics.
	helper.monitorCPU();

};
// END. Leave empty line below.
