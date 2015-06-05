//var layStraPos = require("layStraPos");
var findSources = require("findSources");
var roleMiner = require("roleMiner");
var roleTrans = require("roleTrans");
var roleContr = require("roleContr");
var _ = require('lodash');
function getID() {
	Memory.id = (Memory.id || 0) + 1;
	return Memory.id;
};
Memory.pulse--;
var pulse = Memory.pulse==9;
if(Memory.pulse<=0) {
	Memory.pulse = 10;
	for (var i in Game.flags) {
		Game.flags[i].remove();
	};
};
var pipes = {
	safe: [],
	keep: [],
};
if (pulse) {pipes.safe = findSources(Game.spawns.SpawnVXRBP.room)};
if(!Game.spawns.SpawnVXRBP.spawning) {
	var contr = Game.spawns.SpawnVXRBP.room.controller;
	var count = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "contr") {count++;};};
	if(count<1) {console.log("Create Contr:",Game.spawns.SpawnVXRBP.createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
	for(p in pipes.safe) {
	    var count = 0;
	    for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target.id == pipes.safe[p].id) {count++;};};
	    if(count<3) {console.log("Create miner:",Game.spawns.SpawnVXRBP.createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: pipes.safe[p] }));};
	};
	var countTrans = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTrans=countTrans+1;};};
	if(countTrans<9) {console.log("Create Trans:",Game.spawns.SpawnVXRBP.createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target: {}}));};
};
for(var i in Game.creeps) {
	var creep = Game.creeps[i];
	if     (Memory.creeps[creep.name].role=="miner") { roleMiner(creep) }
	else if(Memory.creeps[creep.name].role=="trans") { roleTrans(creep) }
	else if(Memory.creeps[creep.name].role=="contr") { roleContr(creep) }
	else {console.log("Creep without role!", creep, creep.role) };
};
// CPU monitoring.
Memory.CPU = Memory.CPU || [];
Memory.CPU[Game.time%16] = Game.getUsedCpu(),"of",Game.cpuLimit;
if(pulse) {
	var avgCPU = 0;
	for(k in Memory.CPU) {avgCPU=avgCPU+Memory.CPU[k]; };
	avgCPU = Math.round(avgCPU/Memory.CPU.length*100)/100;
	console.log("avg CPU used:",avgCPU);
};