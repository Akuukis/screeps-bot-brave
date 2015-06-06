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
var roleTrans =function(creep) {
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
// Set of possible threat functions.
var threatsFunctions = {
	lair: function(pos, data){
		if(pos.roomName != data.steps[0].roomName){ return false; }; // Not in the same room.
		if(pos.findInRange(data.steps,3).length>0){
			return gobi(data.lairId).ticksToSpawn; // Returns number (risky) to wait or 0 (run!).
		}else{
			return false; // Not in range.
		};
		var pos = creep.pos;
	}
};
//// 1.  //// Memory structure check, assume good later.
{
	Memory.pulse = (Memory.pulse||1) - 1;
	if(!Memory.t){ Memory.t={}; };
	if(!Memory.threats){ Memory.threats={}; };
	if(!Memory.squads){ Memory.squads={}; };
	if(!Memory.squads.upgr){ Memory.squads.upgr={}; };
	if(!Memory.squads.mine){ Memory.squads.mine={}; };
	if(!Memory.squads.deff){ Memory.squads.deff={}; };
	if(!Memory.squads.patr){ Memory.squads.patr={}; };
	if(!Memory.squads.offn){ Memory.squads.offn={}; };
	if(!Memory.squads.esco){ Memory.squads.esco={}; };
	if(!Memory.squads.scot){ Memory.squads.scot={}; };
	if(!Memory.cities){ Memory.cities={}; };
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

//// 4. //// (each) City (priority tasks).
for(i in Memory.cities){
	var city = Memory.cities[i];
	// Memory check.
	if(!city.spawns){ city.spawns={}; console.log("ERROR 01"); };
	if(!city.signup){ city.signup={}; console.log("ERROR 02"); };	
	if(!city.ext && city.ext!=0){ 
		city.ext = Game.rooms[i].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}}).length;
		console.log("ERROR 03");
	};
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
};
for (id in Memory.squads.mine){
	var squad = Memory.squads.mine[id];
	if(!squad.uniq){ squad.uniq={}; };
	if(typeof squad.uniq.lair === "undefined" || typeof squad.uniq.fort === "undefined"){
		console.log("squads.mine["+id+"].uniq.lair = ...constructing... ");
		console.log("squads.mine["+id+"].uniq.fort = ...constructing... ");
		var lair = gobi(id).pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }})[0];
		if(lair) {
			var path = [ new RoomPosition(lair.pos.x, lair.pos.y, lair.pos.roomName) ];
			var energy = gobi(id);
			var pathRaw = lair.pos.findPathTo(energy, {ignoreCreeps: true});
			for(j in pathRaw){
				var pos = {x: pathRaw[j].x, y:pathRaw[j].y, roomName:lair.pos.roomName};
				path.push(pos);
			};
			path.pop(); // Discard tile of Source itself.
			var structure = gobi(id).room.lookForAt("structure", path[Math.max(1,path.length-1-1)]);
			if(structure && structure.structureType==STRUCTURE_RAMPART){ structure=structure.id };
			squad.uniq.fort = {
				id: structure||false,
				pos: path[path.length-1-1]
			};
			squad.uniq.lair = lair;
			//squad.uniq.fortified = false;
		}else{
			squad.uniq.lair = false;
			squad.uniq.fort = false;
		};
	};
	if(typeof squad.uniq.fortified != "boolean"){
		console.log("squads.mine["+id+"].uniq.fortified = ...constructing... ");
		squad.uniq.fortified = false;
	};
	if(!squad.tap || !Memory.taps[squad.tap]){
		console.log("squads.mine["+id+"].tap = ...constructing... ");
		console.log("squads.mine["+id+"].spots = ...constructing... ");
		var source = {
			pos: new RoomPosition(gobi(id).pos.x, gobi(id).pos.y, gobi(id).pos.roomName),
			spots: [],
		};
		// Search all spots next to source.
		for(dx=-1;dx<=1;dx++){
			for(dy=-1;dy<=1;dy++){
				source.spots.push( new RoomPosition(source.pos.x+dx,source.pos.y+dy,source.pos.roomName) );
				var objs = Game.rooms[source.pos.roomName].lookAt(source.spots[source.spots.length-1]);
				objs.forEach(function(obj){	if(obj.type == 'terrain' && obj.terrain == 'wall'){ source.spots.pop(); }; });
			};
		};
		// Test every pos next to every spot.
		var taps = {};
		var best = {score:100, id:""};
		for(i in source.spots){
			var spot = source.spots[i];
			for(dx=-1;dx<=1;dx++){
				for(dy=-1;dy<=1;dy++){
					// Exclude pos==spot, already checked pos and if wall.
					var tap = new RoomPosition(spot.x+dx,spot.y+dy,spot.roomName);
					if((dx!=0 || dy!=0) && !taps["X"+(tap.x)+"Y"+(tap.y)]){
						var objs = Game.rooms[spot.roomName].lookAt(tap);
						var ok = true;
						objs.forEach(function(obj){	if(obj.type == 'terrain' && obj.terrain == 'wall'){ ok = false; }; });
						if(ok){
							// Calculate ranges to spots.
							var ranges = [];
							//var spotFort = source.spots.push(squad.uniq.fort.pos);
							for(s in source.spots){
								var r = tap.findPathTo(source.spots[s]).length;
								ranges[ranges.length] = {d:r, s:source.spots[s]};
								var index = ranges.length;
								while(r<ranges[index-1].d && index>0){
									ranges[index] = ranges[index-1];
									ranges[index-1] = {d:r, s:source.spots[s]};
									index--;
								};
							};
							// Take at max 2 or less spots and save.
							//console.log(id,i,"START",ranges.length,ranges);
							var cut = ranges.slice(0,Math.min(2,source.spots.length)); //TODO.
							//if(squad.uniq.lair){ cut.push(squad.uniq.fort.pos); }; // Insert fort position for consideration.
							ranges = {d:0, s:[]};
							for(j in cut){ 
								ranges.d = ranges.d + cut[j].d;
								ranges.s.push(cut[j].s);
							};
							//ranges = ranges.reduce(function(a,b){ return {d:a.d+b.d, s:a.s.concat(b.s)}; })
							//console.log(id,i,"END  ", ranges.d, ranges.s.length);
							taps["X"+(tap.x)+"Y"+(tap.y)] = tap;
							if(ranges.d<best.score){ best={score:ranges.d, spots:ranges.s, id:"X"+(tap.x)+"Y"+(tap.y)}; };
						};
					};
				};
			};
		};
		//for(i in taps){ console.log("taps",i,taps[i]) };
		//for(i in best){ console.log("best",i,best[i]) };
		var bt = taps[best.id];
		//for(i in bt){ if(typeof bt[i] != "function"){ console.log("bt",i,bt[i]) }; };
		squad.tap = bt.roomName+"X"+bt.x+"Y"+bt.y;
		squad.uniq.spots = best.spots;
		Memory.taps[squad.tap] = {
			pos: new RoomPosition(bt.x, bt.y, bt.roomName),
		};
	};
	if(!Memory.taps[squad.tap].distance){
		console.log("Memory.taps["+squad.tap+"].distance = ...constructing... ");
		var distance = Number.MAX_VALUE;
		for(j in Memory.spawns){
			var path = gobi(i).pos.findPathTo(Memory.spawns[j]);
			if(path[path.length-1].x==0  ||
				 path[path.length-1].x==50 ||
				 path[path.length-1].y==0  ||
				 path[path.length-1].y==50
			){
				// Do something about multi-rooms.
			};
			// Assume plains only. TODO detect swamps & roads.
			if(distance>path.length){ distance=path.length; };
		};
		Memory.taps[squad.tap].distance = distance;
	};
	if(!squad.options){
		console.log("squads.mine["+id+"].options = ...constructing... ");
		var spots = squad.uniq.spots;
		var opt = [];
		if(spots.length+1>=1){
			opt.push(
				{e:0, c:[{J:"miner",M:1,W:2}]}, {e:0, c:[{J:"miner",M:2,W:2}]},	{e:1, c:[{J:"miner",M:1,W:3}]},
				{e:2, c:[{J:"miner",M:2,W:3}]}, {e:3, c:[{J:"miner",M:1,W:4}]}, {e:4, c:[{J:"miner",M:2,W:4}]}, 
				{e:5, c:[{J:"miner",M:1,W:5}]}, {e:6, c:[{J:"miner",M:2,W:5}]}, {e:7, c:[{J:"miner",M:3,W:5}]}, 
				{e:8, c:[{J:"miner",M:3,W:5}]}, {e:9, c:[{J:"miner",M:3,W:6}]}
			);
		};
		if(spots.length+1>=2){
			opt.push( 
				{e:0, c:[{J:"miner",M:1,W:2,C:1},{J:"miner",M:1,W:2,C:1}]}, {e:0, c:[{J:"miner",M:2,W:2},{J:"miner",M:2,W:2}]}, 
				{e:1, c:[{J:"miner",M:1,W:2    },{J:"miner",M:1,W:3    }]}, {e:2, c:[{J:"miner",M:2,W:3},{J:"miner",M:2,W:3}]}
			);
		};
		if(squad.uniq.lair){ // Add hunter.
			for(i in opt){
				if(opt[i].e==0){ delete opt[i];
				}else if(opt[i].e==1){ opt[i].c.push({J:"slayer",M:1,A:3});
				}else if(opt[i].e==2){ opt[i].c.push({J:"slayer",M:1,A:4});
				}else if(opt[i].e==3){ opt[i].c.push({J:"slayer",M:1,A:5});
				}else if(opt[i].e==4){ opt[i].c.push({J:"slayer",M:1,A:5});
				}else if(opt[i].e==5){ opt[i].c.push({J:"slayer",M:1,A:6});
				}else if(opt[i].e==6){ opt[i].c.push({J:"slayer",M:1,A:6});
				}else if(opt[i].e==7){ opt[i].c.push({J:"slayer",M:1,A:7});
				}else if(opt[i].e==8){ opt[i].c.push({J:"slayer",M:1,A:8});
				}else if(opt[i].e>=9){ opt[i].c.push({J:"slayer",M:1,A:8}); }; 
			};
		};
		for (var i = 0; i < opt.length; i++) {
			if (opt[i] == null){ opt.splice(i, 1); i--; };
		};
		for(i in opt){ // Add collector/buffer zone.
					 if(opt[i].e==0){ opt[i].c.push({J:"collector",M:1,C:5}); }
			else if(opt[i].e==1){ opt[i].c.push({J:"collector",M:2,C:5}); }
			else if(opt[i].e==2){ opt[i].c.push({J:"collector",M:2,C:6}); }
			else if(opt[i].e==3){ opt[i].c.push({J:"collector",M:2,C:7}); }
			else if(opt[i].e==4){ opt[i].c.push({J:"collector",M:2,C:8}); }
			else if(opt[i].e==5){ opt[i].c.push({J:"collector",M:2,C:9}); }
			else if(opt[i].e==6){ opt[i].c.push({J:"collector",M:2,C:10}); }
			else if(opt[i].e==7){ opt[i].c.push({J:"collector",M:3,C:10}); }
			else if(opt[i].e==8){ opt[i].c.push({J:"collector",M:3,C:11}); }
			else if(opt[i].e>=9){ opt[i].c.push({J:"collector",M:3,C:12}); }; 
		};
		for(i in opt){
			var mass = {C:0, M:0, W:0, A:0, R:0, H:0, T:0};
			for(cr in opt[i].c){
				for(bp in opt[i].c[cr]){
					if(bp!="J"){ mass[bp] = mass[bp] + opt[i].c[cr][bp]; };
				};
			};
			opt[i].mass = mass;
			opt[i].cost = mass.C*50 + mass.M*50 + mass.W*100 + mass.A*80 + mass.R*150 + mass.H*200 + mass.T*20; 
		};
		if(opt && opt.length>0){ squad.options=opt; };
	};
	if(!squad.wish){
		console.log("squads.mine["+id+"].wish = ...constructing... ");
		var distance = Memory.taps[squad.tap].distance;
		var best = false;
		var scores = [];
		for(i in squad.options){
			var option = squad.options[i];
			//var string = ""; for(i in option){ string=string+i+":"+option[i]+", "; }; console.log(string);
			var score = { // In e/t.
				extractEnergy: Math.min(10, option.mass.W*2),
				upkeep: -option.cost/(30*60-distance),
				penaltyAway: -squad.tap.away*0.1,// TODO: insert transportation+escort costs here.
				penaltyLair: -(squad.lair ? Math.max(0,10-option.mass.W*2*(option.mass.R*10/5000)/(option.mass.H*12/100)/300):0)
			};
			score.total = score.extractEnergy + score.upkeep + score.penaltyAway + score.penaltyLair;
			scores[i]=score;
			if(!best || scores[best]<score){ best=i; };
		};
		if(best){ squad.wish=squad.options[best]; };
	};
	if(!squad.perf){
		console.log("squads.mine["+id+"].perf = ...constructing... ");
		squad.perf={};
	};
	if(!squad.creeps){
		console.log("squads.mine["+id+"].creeps = ...constructing... ");
		squad.creeps=[];
	};
	if(!squad.state){ squad.state="idle"; }; // Either "idle", "normal", "initDef", "hunt"
	// Check if we have wished creeps and order more.
	var wishlist = {};
	for(j in squad.wish.c){ wishlist[squad.wish.c[j]] = (wishlist[squad.wish.c[j]] ? wishlist[squad.wish.c[j]]+1 : 1); };
	if(squad.creeps.length==0){
		squad.state="idle";
		
		// Signup all!
	};
	for(i in [] /*squad.creeps*/){
		var screep = gobi(i);
		var ram = squad.creeps[i];
		if(!screep){
			// He has died.
		}else if(ram.role == "miner"){
			wishlist.miner--;
			if(!ram.pos){
				// Error, ask where to go?
			};
			if(!ram.inPosition){
				creep.moveTo(ram.pos);
				if(creep.pos.inRangeTo(ram.pos,0)){ ram.inPosition=true; };
			};
			if(ram.inPosition){
				creep.harvest(gobi(id));
			};
		}else if(ram.role == "collector"){
			wishlist.collector--;
			if(!ram.inPosition){
				creep.moveTo(Memory.taps[squad.tap].pos);
				if(creep.pos.isNearTo(Memory.taps[squad.tap].pos)){ ram.inPosition=true; };
			};
			if(ram.inPosition){
				if(!ram.energies || ram.energies.length==0){
					ram.energies = [];
					var all = creep.room.find(FIND_DROPPED_ENERGY);
					for(e in all){ if(creep.pos.inRangeTo(all[e].pos)){ ram.energies.push(all[e]); }; };
				};
				if(ram.energies[0]){
					var err = creep.pickup(ram.energies[0])
					if(ram.energies[0].energy==0){ ram.energies.shift(); };
				};
			};
		}else if (ram.role == "hunt"){
			wishlist.hunt--;
			// Do stuff
		}else if (ram.role == "medic"){
			wishlist.medic--;
			// Do stuff
		}else if (ram.role == "dummy"){
			wishlist.medic--;
			// Do stuff
		}else if (ram.role == "slayer"){
			wishlist.medic--;
			// Do stuff
		}else{
			// Suicide?
		};
	};
	for(i in wishlist){
		// Signup selectively.
	};
};
for (id in Memory.squads.deff){
	var squad = Memory.squads.deff[i];
};
for (id in Memory.squads.patr){
	var squad = Memory.squads.patr[i];
};
for (id in Memory.squads.offn){
	var squad = Memory.squads.offn[i];
};
for (id in Memory.squads.esco){
	var squad = Memory.squads.esco[i];
};
for (id in Memory.squads.scot){
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
	if(room.controller && room.controller.my && !Memory.cities[room.name]){ Memory.cities[room.name]={}; };
	if(!Memory.rooms[room.name]){ Memory.rooms[room.name]={}; };
	if(!Memory.rooms[room.name].threats){ dAdd("overlayThreats",room.name); };
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
	overlayThreats: function(roomName){
		console.log(roomName,": overlayThreats");
		var lairs = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_KEEPER_LAIR }});
		var threats = {}
		for(i in lairs){
			var lair = lairs[i];
			var sources = [ new RoomPosition(lair.pos.x, lair.pos.y, lair.pos.roomName) ];
			var energy = lair.pos.findClosest(FIND_SOURCES, {ignoreCreeps: true});
			var path = lair.pos.findPathTo(energy, {ignoreCreeps: true});
			for(j in path){
				var pos = {x: path[j].x, y:path[j].y, roomName:lair.pos.roomName};
				sources.push(pos);
			};
			sources.pop(); // Discard tile of Source itself.
			threats[lairs[i].id] = {
				id: "lair",
				data: {
					lairId: lairs[i].id,
					steps: sources,
				}
			};
		};
		Memory.threats = threats;
		Memory.rooms[roomName].threats = threats;		
	},
	overlaySources: function(roomName){
		console.log(roomName,": overlaySources");		
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
			source.pos = new RoomPosition(sourcesRaw[s].pos.x, sourcesRaw[s].pos.y, sourcesRaw[s].pos.roomName);
			source.spots = 0;
			for(dx=-1;dx<=1;dx++){
				for(dy=-1;dy<=1;dy++){
					var look = Game.rooms[roomName].lookAt(source.pos.x+dx,source.pos.y+dy,source.pos.roomName);
					var string = "";
					source.spots++;
					look.forEach(function(lookObject){
						string = string + lookObject.type + (lookObject.terrain||"") + " ";
						if(lookObject.type == 'terrain' && lookObject.terrain == 'wall'){ source.spots--;	};
					});
					//if(s==0){ console.log(source.pos.x+dx,source.pos.y+dy," - ",look.length, string); };
				};
			};
			sources[sourcesRaw[s].id] = source;
		};
		for(i in sources){ if(!Memory.squads.mine[i]){ Memory.squads.mine[i]={}; }; };
		Memory.rooms[roomName].sources = sources;
	},
	overlayContr: function(roomName){
		console.log(roomName,": overlayContr");		
		var contr = Game.rooms[roomName].controller;
		Memory.rooms[roomName].contr={};
		if(contr){
			if(!Memory.squads.upgr[contr.id] && contr.my ){ Memory.squads.upgr[contr.id]={}; };
			Memory.rooms[roomName].contr={};
			Memory.rooms[roomName].contr[contr.id] = contr.room.getPositionAt(contr.pos);
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
if (pulse) {pipes.safe = findSources(Game.spawns.Spawn1.room)};
if(!Game.spawns.Spawn1.spawning) {
	var contr = Game.spawns.Spawn1.room.controller;
	var count = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "contr") {count++;};};
	if(count<3) {console.log("Create Contr:",Game.spawns.Spawn1.createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
	for(p in pipes.safe) {
	    var count = 0;
	    for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target.id == pipes.safe[p].id) {count++;};};
	    if(count<2) {console.log("Create miner:",Game.spawns.Spawn1.createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: pipes.safe[p] }));};
	};
	var countTrans = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTrans=countTrans+1;};};
	var countMiners = 0;
	for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].role == "miner") {countMiners=countMiners+1;};};
	if(countMiners>0 && countTrans<4) {console.log("Create Trans:",Game.spawns.Spawn1.createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target: {}}));};
};
for(i in Game.creeps) {
	var creep = Game.creeps[i];
	if     (Memory.creeps[creep.name].role=="miner"){ roleMiner(creep) }
	else if(Memory.creeps[creep.name].role=="trans"){ roleTrans(creep) }
	else if(Memory.creeps[creep.name].role=="contr"){ roleContr(creep) }
	else if(Memory.creeps[creep.name].role=="test" ){}
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
