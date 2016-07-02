"use strict";

module.exports.loop = function() {

	// return;

	//// 0. //// Memory structure check, assume good later.

	//// 1. //// Helper functions.
	// var _ = require('lodash');
	var helper =require('./helpers');
	helper.checkMemory();
	global.getID = helper.getID;
	global.gobi = helper.gobi;
	global.posify = helper.posify;
	//// 2. //// Adis - Automatic Debugging & Isolation System. a.k.a. self-debugger.
	// var adis =require('./adis');

	//// 3. //// Colony (priority tasks).
	var colony = require('./colony');
	global.pulse = colony.pulse();

	//// 4. //// (each) City (priority tasks).
	var city = require('./city');
	Object.keys(Memory.cities).forEach(function(name){
		city.memoryCheck(name);
		city.spawnQueue(name);
	});

	//// 5. //// (each) Squad tasks in order.
	var squad = require('./squad');
	Object.keys(Memory.squads.mine).forEach(function(id){ squad.doMine(id); });
	Object.keys(Memory.squads.upgr).forEach(function(id){ squad.doUpgr(id); });
	Object.keys(Memory.squads.deff).forEach(function(id){ squad.doDeff(id); });
	Object.keys(Memory.squads.patr).forEach(function(id){ squad.doPatr(id); });
	Object.keys(Memory.squads.offn).forEach(function(id){ squad.doOffn(id); });
	Object.keys(Memory.squads.esco).forEach(function(id){ squad.doEsco(id); });
	Object.keys(Memory.squads.scot).forEach(function(id){ squad.doScot(id); });

	//// 6. //// (each) City. Everythin of scope room.
	// Memory.cities.forEach(function(name){ city.spawnQueue(name); });

	//// 7. //// The Colony. Everything of scope global.
	Object.keys(Game.rooms).forEach(function(id){ colony.overlay(id); }); // Make overlay for each unexplored room.
	// Memory.demand.forEach(function(id){ colony.distribute(id); }); // Distribute spawning demands to spawns.
	colony.transits();

	//// 8. //// Deferred tasks. Anything not urgent and CPU intensive goes here.
	var dtask = require('dtask');
	dtask.checkMemory();

	while(Game.cpuLimit>400 && Game.cpu.getUsed()/Game.cpuLimit<0.8 && Memory.deffered.fn.length>0){ // TODO const.
		dtask.doNext();
	}

	//// Old code to be removed.
	var obselete = require('obselete');
	obselete.loop();

	//// 9. //// statistics.
	helper.monitorCPU();
};
// END. Leave empty line below.
