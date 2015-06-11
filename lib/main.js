var gobi = Game.getObjectById;
function getID(){
	var id = Game.time;
	if( id>Memory.lastId ){
		Memory.lastId = id;
		return id % 1800;
	}else{
		Memory.lastId++;
		return Memory.lastId % 1800;
	};
};
var pulse = Game.time%16==0 ? true : false;
var pipes = {
	safe: [],
	keep: [],
};
function layStraPos(spawn){
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
function findSources(room){
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
function roleMiner(creep){
	if(Memory.creeps[creep.name].target){
		if(creep.pos.getRangeTo(gobi(Memory.creeps[creep.name].target.id).pos) > 1) {
			creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
		} else {
			creep.harvest(Game.getObjectById(Memory.creeps[creep.name].target.id));
		};
	}else{
		console.log("I am lost,",creep,creep.name,Memory.creeps[creep.name].role);
		creep.suicide();
	};
};
function roleTrans(creep){
	if(creep.energy < creep.energyCapacity * 0.5) {
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
				for(creep2 in Game.creeps) {
					if(  Memory.creeps[Game.creeps[creep2].name].target
						&& Memory.creeps[Game.creeps[creep2].name].target.id == creep.room.controller.id
						&& Game.creeps[creep2].energy < Game.creeps[creep2].energyCapacity * 0.8
					){
						target=creep2;
					};
				};
				Memory.creeps[creep.name].target=Game.creeps[target];
			};
			if(_.size(Memory.creeps[creep.name].target)>0) {
				creep.moveTo(Memory.creeps[creep.name].target);
			} else {
				//console.log("Trans full & stopped",creep.name)
			};
		};
	};
};
function roleContr(creep){
	if(creep.pos.getRangeTo(Game.getObjectById(Memory.creeps[creep.name].target.id)) > 1) {
		creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
	} else {
		creep.upgradeController(Game.getObjectById(Memory.creeps[creep.name].target.id));
	};
};
if(!Game.spawns.Spawn1){ console.log("I am dead. Please respawn!"); return 1; };
if (pulse) {pipes.safe = findSources(Game.spawns.Spawn1.room)};
if(!Game.spawns.Spawn1.spawning) {
	var contr = Game.spawns.Spawn1.room.controller;
	var countContr = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "contr") {countContr++;};};
	var countTrans = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTrans=countTrans+1;};};
	var countMiners = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "miner") {countMiners=countMiners+1;};};
	for(p in pipes.safe) {
	    var count = 0;
	    for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target.id == pipes.safe[p].id) {count++;};};
	    if(countMiners<1) {console.log("Create miner:",Game.spawns.Spawn1.createCreep([MOVE, WORK], "miner"+getID(), {role: "miner", target: pipes.safe[p] }));};
	    if(count<2) {console.log("Create miner:",Game.spawns.Spawn1.createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: pipes.safe[p] }));};
	};
	if(countMiners>1 && countTrans<4) {console.log("Create Trans:",Game.spawns.Spawn1.createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target: {}}));};
	if(countMiners>1 && countContr<3) {console.log("Create Contr:",Game.spawns.Spawn1.createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
	if(countTrans==0) {console.log("Create Trans:",Game.spawns.Spawn1.createCreep([MOVE, CARRY], "trans"+getID(), {role: "trans", target: {}}));};
};
for(i in Game.creeps) {
	var creep = Game.creeps[i];
	if     (Memory.creeps[creep.name].role=="miner"){ roleMiner(creep) }
	else if(Memory.creeps[creep.name].role=="trans"){ roleTrans(creep) }
	else if(Memory.creeps[creep.name].role=="contr"){ roleContr(creep) }
	else if(Memory.creeps[creep.name].role=="test" ){}
	else {
		//console.log("Creep without role!", creep, creep.role)
	};
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
