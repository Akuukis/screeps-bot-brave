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
global.RECACHE = true;


//// Routines.
global.markets = require('./market');
// var adis =require('./adis');


//// Classes.
var DTask = require('./dtask');
var Colony = require('./colony');
var City = require('./city');
var Squad = require('./squad');


//// Global entities.
global.Player = {};
Player.colony = new Colony(COLONY_NAME);
Player.cities = new Map();
Player.squads = new Map();
Player.dtasks = new Map();


//// Temporarly.
global.obselete = require('./obselete');


//// Main loop.
module.exports.loop = function() {

	// return;


	//// 0. //// Global entities: Build from Memory to RAM.
	helper.checkMemory();
	if(RECACHE){
		City.recache();
		Squad.recache();
		DTask.recache();
		//Market.recache();
	};


	//// Entity acts: Colony.
	global.IRR = Player.colony.irr();
	global.pulse = Player.colony.pulse();
	Object.keys(Game.rooms).forEach(function(id){ Player.colony.overlay(id); }); // Make overlay for each unexplored room.
	// Memory.demand.forEach(function(id){ Player.colony.distribute(id); }); // Distribute spawning demands to spawns.
	Player.colony.transits();


	//// Entities acts: Cities.
	for(let city of Player.cities.values()){
		city.spawnQueue();
	};


	//// Entities acts: Squads.
	if(Game.cpu.tickLimit < Game.cpu.bucket){
		// Just execute all squads.

		for(let squad of Player.squads.values()) squad.tick();
		// if(pulse) for(let squad of Player.squads.values()) squad.pulse();

	}else{
		// Execute all squads in prioritized order.

		let order = new Set('mine','upgr','deff','patr','offn','esco','scot');
		let subArrays = {};
		let orderedArray = new Array();
		for(let type of order.values()) subArrays[type] = new Array();
		for(let squad of Player.squads.values()) if(typeof subArrays[squad.type] == 'array') subArrays[squad.type].push(squad);
		for(let type of order.values()) orderedArray.push.apply(subArrays[type]);
		orderedArray.forEach( squad=>squad.tick() );
		if(pulse) orderedArray.forEach( squad=>squad.pulse() );

	};


	//// Deferred tasks: anything not urgent and CPU intensive goes here.
	for(let dTask of Player.dtasks.values()){
		if(Game.cpu.getUsed()/Game.tickLimit>0.5) break;
		dTask.do();
	}


	//// Temporarly: code to be removed.
	obselete.loop();


	//// Statistics.
	helper.monitorCPU();


	//// Cleanup.
	global.RECACHE = false;

};
// END. Leave empty line below.
