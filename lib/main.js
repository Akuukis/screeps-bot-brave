//// 0.  //// Defines.
var gobi = Game.getObjectById;
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
			if(Game.spawns.Spawn1.energy<Game.spawns.Spawn1.energyCapacity) {
				Memory.creeps[creep.name].target = Game.spawns.Spawn1;
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
{
	Memory.pulse = (Memory.pulse||1) - 1;
	if(!Memory.t){ Memory.t={}; };
	if(!Memory.threat){ Memory.threat={}; };
	if(!Memory.squads){ Memory.squads={}; };
	if(!Memory.squads.upgr){ Memory.squads.upgr={}; };
	if(!Memory.squads.mine){ Memory.squads.mine={}; };
	if(!Memory.squads.deff){ Memory.squads.deff={}; };
	if(!Memory.squads.patr){ Memory.squads.patr={}; };
	if(!Memory.squads.offn){ Memory.squads.offn={}; };
	if(!Memory.squads.esco){ Memory.squads.esco={}; };
	if(!Memory.squads.scot){ Memory.squads.scot={}; };
	if(!Memory.cities){ Memory.cities=[]; };
	if(!Memory.zones){ Memory.zones={}; };
	if(!Memory.rooms){ Memory.rooms={}; };
	if(!Memory.overlay){ Memory.overlay={}; };
	if(!Memory.taps){ Memory.taps={}; };
	if(!Memory.deffered){ Memory.deffered={}; };
	if(!Memory.deffered.fn){ Memory.deffered.fn=[]; };
	if(!Memory.deffered.wait){ Memory.deffered.wait=[]; };
	if(!Memory.deffered.tmp){ Memory.deffered.tmp=[]; };
};
//// 2.  //// Error diagnostics. TODO.

//// 3.  //// Colony (priority tasks).
var pulse = Memory.pulse==9;
if(Memory.pulse<=0){ // Pulse.
	Memory.pulse = 10;
	for (var i in Game.flags){
		Game.flags[i].remove();
	};
};

//// 4. //// (each) Spawn (priority tasks).
for(i in Memory.cities){
	var city = Memory.cities[i];
	// Memory check.
	if(!city.id){ city.id=[]; console.log("ERROR"); };
	if(!city.spawns){ city.spawns=[]; console.log("ERROR"); };
	if(!city.signup){ city.signup=[]; console.log("ERROR"); };	
};

//// 5. //// (each) Squad tasks in order.
for (i in Memory.squads.upgr){
	var squad = Memory.squads.upgr[i];
	if(!squad.distance) {
		squad.distance = Math.huge;
		for(j in Memory.spawns){
			var path = gobi(i).pos.findPathTo(Memory.spawns[j]);
			if(path[path.length-1].x==0  ||
				 path[path.length-1].x==50 ||
				 path[path.length-1].y==0  ||
				 path[path.length-1].y==50
			){
				// Do something about multi-rooms.
			};
			if(squad.distance>path.length){ squad.distance=path.length; };
		};
	};
	//if(!squad.
};
for (i in Memory.squads.mine){
	var squad = Memory.squads.mine[i];
	if(!squad.distance) {
		squad.distance = Math.huge;
		for(j in Memory.spawns){
			var path = gobi(i).pos.findPathTo(Memory.spawns[j]);
			if(path[path.length-1].x==0  ||
				 path[path.length-1].x==50 ||
				 path[path.length-1].y==0  ||
				 path[path.length-1].y==50
			){
				// Do something about multi-rooms.
			};
			if(squad.distance>path.length){ squad.distance=path.length; };
		};
	};
	
};
for (i in Memory.squads.deff){
	var squad = Memory.squads.deff[i];
};
for (i in Memory.squads.patr){
	var squad = Memory.squads.patr[i];
};
for (i in Memory.squads.offn){
	var squad = Memory.squads.offn[i];
};
for (i in Memory.squads.esco){
	var squad = Memory.squads.esco[i];
};
for (i in Memory.squads.scot){
	var squad = Memory.squads.scot[i];
};

//// 6. //// (each) City.
for(i in Memory.cities){
	var city = Memory.cities[i];
};

//// 7. //// The Colony.
function dAdd(fn, name, extra){
	var found = false;
	var fullName = "dTasks."+fn+"("+name+")"+(extra||"");
	for(i in Memory.deffered.wait){ if(Memory.deffered.wait[i]==fullName){ found=true; }; };
	if(!found){
		Memory.deffered.fn.push("dTasks."+fn+"('"+name+"')");
		Memory.deffered.wait.push(fullName);
	};	
};
for(i in Game.rooms) { // Make overlay for each unexplored room.
	var room = Game.rooms[i];
	if(!Memory.rooms[room.name]){ Memory.rooms[room.name]={}; };
	if(!Memory.rooms[room.name].sources){ dAdd("overlaySources",room.name); };
	if(!Memory.rooms[room.name].contr  ){ dAdd("overlayContr"  ,room.name); };
	if(!Memory.rooms[room.name].zones  ){ dAdd("overlayZones"  ,room.name); };
	if(!Memory.rooms[room.name].deff   ){ dAdd("overlayDeff"   ,room.name); };
	if(!Memory.rooms[room.name].spawns ){ dAdd("overlaySpawns" ,room.name); };
	if(!Memory.rooms[room.name].rating ){ dAdd("calcRating"    ,room.name); };
	if(!Memory.rooms[room.name].finish ){ dAdd("calcFinish"    ,room.name); };
};

//// 8. //// Deferred tasks.
var dTasks = { // Define tasks.
	overlaySources: function(roomName){
		if(!Memory.rooms[roomName].sources){ Memory.rooms[roomName].sources=false; };
		var sourcesRaw = Game.rooms[roomName].find(FIND_SOURCES);
		var sources = {};
		for(s in sourcesRaw){
			var source = {};
			if(sourcesRaw[s].pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }}).length > 0) {
				source.lair = true;
				Game.rooms[roomName].createFlag(sourcesRaw[s].pos,false,COLOR_RED);
			}else{
				source.lair = false;
				Game.rooms[roomName].createFlag(sourcesRaw[s].pos);
			};
			source.pos = sourcesRaw[s].room.getPositionAt(sourcesRaw[s]);
			source.spots = 0;
			for(dx=-1;dx<=1;dx++){
				for(dy=-1;dy<=1;dy++){
					var look = Game.rooms[roomName].lookAt(source.pos);
					look.forEach(function(lookObject){
							if(lookObject.type == 'terrain' && lookObject.terrain != 'wall'){ source.spots++; };
					});
				};
			};
			sources[sourcesRaw[s].id] = source;
		};
		for(i in sources){ if(!Memory.squads.mine[i]){ Memory.squads.mine[i]={}; }; };
		Memory.rooms[roomName].sources = sources;
	},
	overlayContr: function(roomName){
		var contr = Game.rooms[roomName].controller;
		Memory.rooms[roomName].contr={};
		if(contr){
			if(!Memory.squads.upgr[contr.id] && contr.my ){ Memory.squads.upgr[contr.id]={}; };
			Memory.rooms[roomName].contr={};
			Memory.rooms[roomName].contr[contr.id] = contr.room.getPositionAt(contr);
		};
	},
	overlayZones: function(roomName){},
	overlayDeff: function(roomName){},
	overlaySpawns: function(roomName){},
	calcRating: function(roomName){},
	calcFinish: function(roomName){},
};
if(Memory.deffered.fn.length!=Memory.deffered.wait.length){ // Check queue.
	Memory.deffered.fn = [];
	Memory.deffered.wait = [];
};
while(Game.getUsedCpu()/Game.cpuLimit<0.9 && Memory.deffered.fn.length>0){ // Execute queue. TODO think about cpu const.
	eval(Memory.deffered.fn[0]);
	Memory.deffered.fn.shift();
	Memory.deffered.wait.shift();
};

//// Random shit.
if (1) {pipes.safe = findSources(Game.spawns.Spawn1.room)};
if(!Game.spawns.Spawn1.spawning) {
	var contr = Game.spawns.Spawn1.room.controller;
	var count = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "contr") {count++;};};
	//if(count<1) {console.log("Create Contr:",Game.spawns.Spawn1.createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
	for(p in pipes.safe) {
	    var count = 0;
	    for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target.id == pipes.safe[p].id) {count++;};};
	    if(count<3) {console.log("Create miner:",Game.spawns.Spawn1.createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: pipes.safe[p] }));};
	};
	var countTrans = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTrans=countTrans+1;};};
	if(countTrans<15) {console.log("Create Trans:",Game.spawns.Spawn1.createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target: {}}));};
};

for(i in Game.creeps) {
	var creep = Game.creeps[i];
	if     (Memory.creeps[creep.name].role=="miner") { roleMiner(creep) }
	else if(Memory.creeps[creep.name].role=="trans") { roleTrans(creep) }
	else if(Memory.creeps[creep.name].role=="contr") { roleContr(creep) }
	else {console.log("Creep without role!", creep, creep.role) };
};
// CPU monitoring.
{
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
};
// END. Leave empty line below.
