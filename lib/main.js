//// 0.  //// Defines.
var layStraPos = function(spawn){
	// Find nearest
	var x;
	var y;
	var count=0;
	var nearest = {};
	var debug = 1;
	var bugs = {};
	var i = 1;
	while (count<4 && debug < 200) {
		var j = 1;
		while (count<4 && j < i*8+1 && debug < 10000) {
			if (
				(j<=i*8/4  & !nearest[1]) |
				(j>i*8*3/4 & !nearest[4]) |
				(j%2===0   & !nearest[2] & j>i*8/4 & j<=i*8*3/4) |
				(j%2==1    & !nearest[3] & j>i*8/4 & j<=i*8*3/4)  )
			{
				if (j%2===0) {
					x = spawn.pos.x - i + Math.min(2*i,j/2	);
					y = spawn.pos.y - i + Math.max(0 ,j/2-2*i);
				} else {
					x = spawn.pos.x - i + Math.max(0 ,(j-1)/2-2*i);
					y = spawn.pos.y - i + Math.min(2*i,(j-1)/2	);
				}
				//console.log(spawn.room.createFlag(spawn.room.getPositionAt(x,y),x + "-" + y + "-" + debug));
				debug++;
					var test = spawn.room.lookAt(x,y);
				for (var k in test) {
					if (test[k].type=="terrain" && test[k].terrain=="wall") {
						if (j<=i*8/4) {
							nearest[1] = spawn.room.getPositionAt(x,y);
							spawn.room.createFlag(spawn.room.getPositionAt(x,y),"1-" + x + "-" + y + "-" + debug);
						}
						else if (j>i*8*3/4) {
							nearest[4] = spawn.room.getPositionAt(x,y);
							spawn.room.createFlag(spawn.room.getPositionAt(x,y),"4-" + x + "-" + y + "-" + debug);
						}
						else if (j%2===0) {
							nearest[2] = spawn.room.getPositionAt(x,y);
							spawn.room.createFlag(spawn.room.getPositionAt(x,y),"2-" + x + "-" + y + "-" + debug);
						}
						else if (j%2==1) {
							nearest[3] = spawn.room.getPositionAt(x,y);
							spawn.room.createFlag(spawn.room.getPositionAt(x,y),"3-" + x + "-" + y + "-" + debug);
						}
						count++;
					}
				}
			}
			j++;
		}
		i++;
	}
	console.log(nearest[1],nearest[2],nearest[3],nearest[4]);
};
var findSources = function(room){
	var sources = room.find(FIND_SOURCES);
	var safeSources = [];
	for(s in sources){
		if(sources[s].pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }}).length > 0) {
				room.createFlag(sources[s].pos,false,COLOR_RED);
		} else {
				safeSources[safeSources.length] = sources[s];
				room.createFlag(sources[s].pos);
		};
	};
	return safeSources;
};
var roleMiner = function(creep) {
	if(creep.pos.getRangeTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos) > 1) {
		creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
	} else {
		creep.harvest(Game.getObjectById(Memory.creeps[creep.name].target.id));
	};
};
var roleTrans =function(creep) {
	if(creep.energy < creep.energyCapacity) {
		var t = {};
		if(_.size(Memory.creeps[creep.name].target||{})==0){
			t = {};
			var es = creep.room.find(FIND_DROPPED_ENERGY);
			var total = 0;
			for(i in es) {total = total + es[i].energy;};
			var r = Math.random()*total;
			total = 0;
			for(i in es) {
				total = total + es[i].energy;
				if(_.size(t)==0 && r<total) {t = es[i]};
			};
			Memory.creeps[creep.name].target = t;
		} else {
			t = Memory.creeps[creep.name].target;
		};
		if(creep.pos.getRangeTo(Game.getObjectById(t.id)) > 1) {
			creep.moveTo(Game.getObjectById(t.id));
		} else {
			creep.pickup(Game.getObjectById(t.id));
			Memory.creeps[creep.name].target = {};
		};
	} else {
		var t = Memory.creeps[creep.name].target||{};
		if(_.size(t)>0){
			if(creep.pos.getRangeTo(Game.getObjectById(t.id)) > 1) {
				creep.moveTo(Game.getObjectById(t.id));
			} else {
				creep.transferEnergy(Game.getObjectById(t.id));
				Memory.creeps[creep.name].target={};
			};
			if(creep.energy==0) {Memory.creeps[creep.name].target=={};};
		} else {
			if(Game.spawns.SpawnVXRBP.energy<Game.spawns.SpawnVXRBP.energyCapacity) {
				Memory.creeps[creep.name].target = Game.spawns.SpawnVXRBP;
			} else if (creep.room.controller) {
				//console.log("SEIT")
				var target = {};
				for(creep2 in Game.creeps) {if(Memory.creeps[Game.creeps[creep2].name].target && Memory.creeps[Game.creeps[creep2].name].target.id == creep.room.controller.id) {target=creep2;};};
				Memory.creeps[creep.name].target=Game.creeps[target];
			};
			if(_.size(Memory.creeps[creep.name].target)>0) {
				creep.moveTo(Memory.creeps[creep.name].target);
			} else {
				console.log("Trans full & stopped",creep.name)
			};
		};
	};
};
var roleContr = function(creep) {
	if(creep.pos.getRangeTo(Game.getObjectById(Memory.creeps[creep.name].target.id)) > 1) {
		creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
	} else {
		creep.upgradeController(Game.getObjectById(Memory.creeps[creep.name].target.id));
	};
};
var _ = require('lodash');
function getID() {
	Memory.id = (Memory.id || 0) + 1;
	return Memory.id;
};
var pipes = {
	safe: [],
	keep: [],
};

//// 1.  //// Memory structure check, assume good later.
Memory.pulse = (Memory.pulse||1) - 1;
if(!Memory.t){ Memory.t={}; };
if(!Memory.threat){ Memory.threat={}; };
if(!Memory.squads){ Memory.squads={}; };
if(!Memory.squads.upgr){ Memory.squads.upgr=[]; };
if(!Memory.squads.mine){ Memory.squads.mine=[]; };
if(!Memory.squads.deff){ Memory.squads.deff=[]; };
if(!Memory.squads.patr){ Memory.squads.patr=[]; };
if(!Memory.squads.offn){ Memory.squads.offn=[]; };
if(!Memory.squads.esco){ Memory.squads.esco=[]; };
if(!Memory.squads.scot){ Memory.squads.scot=[]; };
//if(!Memory.spawns){ Memory.spawns=[]; };
if(!Memory.zones){ Memory.zones={}; };
if(!Memory.taps){ Memory.taps={}; };
if(!Memory.deffered){ Memory.deffered={}; };
if(!Memory.deffered.fn){ Memory.deffered.fn=[]; };
if(!Memory.deffered.tmp){ Memory.deffered.tmp=[]; };

//// 2.  //// Error diagnostics. TODO.

//// 3.  //// Colony (priority tasks).
// Pulse.
var pulse = Memory.pulse==9;
if(Memory.pulse<=0){
	Memory.pulse = 10;
	for (var i in Game.flags){
		Game.flags[i].remove();
	};
};

//// 4. //// (each) Spawn (priority tasks).
for(spawn in Memory.spawns){
};

//// 5. //// (each) Squad tasks in order.
for (squad in Memory.squads.upgr){
};
for (squad in Memory.squads.mine){
};
for (squad in Memory.squads.deff){
};
for (squad in Memory.squads.patr){
};
for (squad in Memory.squads.offn){
};
for (squad in Memory.squads.esco){
};
for (squad in Memory.squads.scot){
};

//// 6. //// (each) Spawn.
for(spawn in Memory.spawns){
};

//// 7. //// The Colony.

//// 8. //// Deferred tasks.
for(task in Memory.deffered){
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
var tail = 16;
Memory.CPU = Memory.CPU || [];
Memory.CPU[Game.time%tail] = Game.getUsedCpu(),"of",Game.cpuLimit;
if(pulse) {
	var avgCPU = 0;
	for(k in Memory.CPU) {avgCPU=avgCPU+Memory.CPU[k]; };
	avgCPU = Math.round(avgCPU/Memory.CPU.length*100)/100;
	var stdevCPU = 0;
	for(k in Memory.CPU) {stdevCPU=stdevCPU+(Memory.CPU[k]-avgCPU)*(Memory.CPU[k]-avgCPU); };
	stdevCPU=Math.round(Math.sqrt(stdevCPU)/tail*100)/100;
	console.log("CPU:",avgCPU,"+/-",stdevCPU);
};