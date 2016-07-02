module.exports = function(creeps) {
	var loop = function(){
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
			for(var s in sources){
				if(sources[s].pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }}).length > 0) {
						//room.createFlag(sources[s].pos,false,COLOR_RED);
				} else {
						safeSources[safeSources.length] = sources[s];
						//room.createFlag(sources[s].pos);
				};
			};
			return safeSources;
		};
		function roleMiner(creep){
			if(Memory.creeps[creep.name].target){
				if(creep.pos.getRangeTo(gobi(Memory.creeps[creep.name].target).pos) > 1) {
					creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target).pos);
				} else {
					creep.harvest(Game.getObjectById(Memory.creeps[creep.name].target));
				};
			}else{
				console.log("I am lost,",creep,creep.name,Memory.creeps[creep.name].role);
				creep.suicide();
			};
		};
		function roleTrans(creep){
			if(creep.carry.energy == 0 || (Memory.creeps[creep.name].state == "empty" && creep.carry.energy < creep.carry.energyCapacity) ) {
				Memory.creeps[creep.name].state = "empty";
				var t = false;
				if(!Memory.creeps[creep.name].target){
					var es = creep.room.find(FIND_DROPPED_RESOURCES);
					var total = 0;
					for(var i in es) {total = total + es[i].energy;};
					var r = Math.random()*total;
					total = 0;
					for(var i in es) {
						total = total + es[i].energy;
						if(!t && r<total) {t = es[i]};
					};
					if(!t){ t = Game.spawns.Spawn1 };
					Memory.creeps[creep.name].target = t;
				};
				t = Memory.creeps[creep.name].target;
				if(creep.pos.getRangeTo(Game.getObjectById(t.id)) > 1) {
					creep.moveTo(Game.getObjectById(t.id));
				}else{
					creep.pickup(Game.getObjectById(t.id));
					Memory.creeps[creep.name].target = false;
				};
			}else{
				Memory.creeps[creep.name].state = "working";
				var t = Memory.creeps[creep.name].target;
				if(t){
					if(creep.pos.getRangeTo(Game.getObjectById(t.id)) > 1) {
						creep.moveTo(Game.getObjectById(t.id));
					}else{
						//if(!!creep.transferEnergy(Game.getObjectById(t.id))){ Memory.creeps[creep.name].target=false; };
						if(!!creep.transfer(Game.getObjectById(t.id), RESOURCE_ENERGY)){ Memory.creeps[creep.name].target=false; };
					};
				}else{
					var target = [];
					/* Go to another room if there's less trans. TODO: signups, otherwise too much trans migrate
					var countTransAll = 0;
					var countCities = 0;
					for(var i in Game.creeps) {
						if(Memory.creeps[Game.creeps[i].name].role == "trans") {countTransAll=countTransAll+1;};
					};
					for(var i in Memory.cities){countCities++;};
					var avgTrans = countTransAll / countCities;
					*/
					for(var i in Game.spawns){
						var spawn = Game.spawns[i];
						var countTrans = 0;
						for(var i in Game.creeps) {
							if(Memory.creeps[Game.creeps[i].name].role == "trans" && Game.creeps[i].room.name == spawn.room.name) {countTrans=countTrans+1;};
						};
						target[target.length] = {
							score: (creep.room.name == spawn.room.name ? 1 : 0 /*Math.max(0, avgTrans / (countTrans+1) - 1)) * (spawn.energy < spawn.energyCapacity ? 3 : 0.1*/),
							target: spawn
						};
					};
					// Decide where to go.
					for(var i in Game.creeps) {
						var creep2 = Game.creeps[i];
						var countTrans = 0;
						for(var i in Game.creeps) {
							if(Memory.creeps[Game.creeps[i].name].role == "trans" && Game.creeps[i].room.name == creep2.room.name) {countTrans=countTrans+1;};
						};
						if(Memory.creeps[creep2.name].role == "contr" || Memory.creeps[creep2.name].role == "settler"){
							target[target.length] = {
								score: (creep.room.name == creep2.room.name ? 1 : 0 /*Math.max(0, avgTrans / countTrans - 1)*/),
								target: creep2
							};
						};
					};
					var sum = 0;
					for(var i in target){ sum = sum + target[i].score; };
					var r = Math.random()*sum;
					for(var i in target){
						sum = sum - target[i].score;
						if( !t && sum < r) { t = target[i].target; continue; };
					};
					var string="";
					for(var i in target){ string=string+Math.round(target[i].score*100)/100+", "; };
					//console.log(creep.name, avgTrans, "->", t, string);
					creep.say("->"+(t.name||t.id));
					if(t){
						Memory.creeps[creep.name].target = t;
						creep.moveTo(t);
					}else{
						//console.log("Trans full & stopped",creep.name)
					};
				};
			};
		};
		function roleContr(creep){
			var ram = Memory.creeps[creep.name];
			if(creep.pos.getRangeTo(Game.getObjectById(ram.target.id)) > 1) {
				creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
			} else {
				creep.upgradeController(Game.getObjectById(ram.target.id));
				if(creep.carry.energy > creep.carry.energyCapacity * 0.8){
					for(var i in Game.creeps){
						if(Memory.creeps[Game.creeps[i].name].role == "contr"){
							if(Game.creeps[i].energy < Game.creeps[i].energyCapacity * 0.8 && !creep.transferEnergy(Game.creeps[i],creep.carry.energy/2)){ continue; };
						};
					};
				};
			};
		};

		// Delete creeps from Memory
		var safe = true;
		for(var i in Game.spawns){ if(Game.spawns.spawning){ safe=false; }; };
		if(safe){ for(var i in Memory.creeps){ if(!Game.creeps[i]){ Memory.creeps[i]=undefined;}; }; };

		if(!Game.spawns.Spawn1){ console.log("I am dead. Please respawn!"); return 1; };
		if (pulse) {pipes.safe = findSources(Game.spawns.Spawn1.room)};
		for(var i in Game.spawns){
			var spawn = Game.spawns[i];
			if(!spawn.spawning) {
				var contr = Game.spawns[i].room.controller;
				var countContr = 0;
				var countTransAll = 0;
				var countTrans = 0;
				var countMiners = 0;
				for(var creep in Game.creeps) {
					if(Memory.creeps[Game.creeps[creep].name].role == "contr" && Game.creeps[creep].room.name == spawn.room.name) {countContr++;};
					if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTransAll=countTransAll+1;};
					if(Memory.creeps[Game.creeps[creep].name].role == "trans" && Game.creeps[creep].room.name == spawn.room.name) {countTrans=countTrans+1;};
					if(Memory.creeps[Game.creeps[creep].name].role == "miner" && Game.creeps[creep].room.name == spawn.room.name) {countMiners=countMiners+1;};
				};
				for(var id in Memory.rooms[spawn.room.name].sources) {
					var source = Memory.rooms[spawn.room.name].sources[id];
					if(source.lair){ continue; };
					var count = 0;
					for(var creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target == id) {count++;};};
					if(countMiners<1) {console.log("Create miner:",Game.spawns[i].createCreep([MOVE, WORK], "miner"+getID(), {role: "miner", target: id }));};
					if(count<source.spots) {console.log("Create miner:",Game.spawns[i].createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: id }));};
				};
				if(countMiners>1 && countTrans<7 && countTransAll < _.size(Game.spawns)*8) {console.log("Create Trans:",Game.spawns[i].createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target:false}));};
				if(countMiners>1 && Memory.rooms[spawn.room.name].contr && countContr<Memory.rooms[spawn.room.name].contr[spawn.room.controller.id].spots.length) {console.log("Create Contr:",Game.spawns[i].createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
				if(countTrans==0) {console.log("Create Trans:",Game.spawns[i].createCreep([MOVE, CARRY], "trans"+getID(), {role: "trans", target:false}));};
			};
		};
		for(var i in Game.creeps) {
			var creep = Game.creeps[i];
			if     (Memory.creeps[creep.name].role=="miner"){ roleMiner(creep) }
			else if(Memory.creeps[creep.name].role=="trans"){ roleTrans(creep) }
			else if(Memory.creeps[creep.name].role=="contr"){ roleContr(creep) }
			else if(Memory.creeps[creep.name].role=="settler"){
				if(creep.carry.energy == 0 || (Memory.creeps[i].state == "empty" && creep.carry.energy < creep.carry.energyCapacity) ) {
					Memory.creeps[i].state = "empty";
					if(creep.pos.getRangeTo(Game.spawns.Spawn1) > 1) {
						creep.moveTo(Game.spawns.Spawn1);
					} else {
						Game.spawns.Spawn1.transferEnergy(creep)
					};
				}else{
					Memory.creeps[i].state = "working";
					if(creep.room.name=="E5S6"){
						creep.moveTo(17,0);
					}else if(!creep.room.controller.my){
						if(creep.pos.getRangeTo(creep.room.controller) > 1) {
							creep.moveTo(creep.room.controller);
						} else {
							creep.claimController(creep.room.controller);
						};
					}else{
						if(creep.pos.getRangeTo(Game.flags.Settle) > 1) {
							creep.moveTo(Game.flags.Settle);
						} else {
							// Think
							var spawn = creep.room.find(FIND_CONSTRUCTION_SITES)[0];
							creep.build(spawn);
						};
					};
				};
			}
			else if(Memory.creeps[creep.name].role=="test" ){}
			else {
				//console.log("Creep without role!", creep, creep.role)
			};
		};

		// Testing - overlay room

		// Watch for enemies.
		var hostilesCount = {};
		for(var i in Game.spawns){
			Game.spawns[i].room.find(FIND_HOSTILE_CREEPS, { filter: function(i) {
				if(i.owner.username != 'Source Keeper') {
					hostilesCount[i.owner.username] = hostilesCount[i.owner.username] || 0;
					hostilesCount[i.owner.username]++;
				}
			}});
		};
		for(var user in hostilesCount) {
			Game.notify(hostilesCount[user] + ' enemies spotted: user ' + user + ' in room ' + creep.room.name);
		};
	};

	return {
		'loop': loop
	};
}();