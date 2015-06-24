//// 0.  //// Memory structure check, assume good later.
{
	Memory.pulse = (Memory.pulse||1) - 1;
	Memory.routine = {creeps:{}};
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
	if(!Memory.demand){ Memory.demand={}; };
	if(!Memory.supply){ Memory.supply={}; };
	if(!Memory.cities){ Memory.cities={}; };
	if(!Memory.zones){ Memory.zones={}; };
	if(!Memory.rooms){ Memory.rooms={}; };
	if(!Memory.overlay){ Memory.overlay={}; };
	if(!Memory.taps){ Memory.taps={}; };
	if(!Memory.tmp){ Memory.tmp={}; };
	if(!Memory.network){ Memory.network={}; };
	if(!Memory.deffered){ Memory.deffered={}; };
	if(!Memory.deffered.fn){ Memory.deffered.fn=[]; };
	if(!Memory.deffered.wait){ Memory.deffered.wait=[]; };
	if(!Memory.deffered.tmp){ Memory.deffered.tmp=[]; };
};

//// 1.  //// Defines.
var _ = require('lodash');
var gobi = Game.getObjectById;
var threatsFunctions = {
	lair: function(pos, data){
		if(pos.roomName != data.steps[0].roomName){ return false; }; // Not in the same room.
		if(pos.findInRange(data.steps,3).length>0){
			return gobi(data.lairId).ticksToSpawn || true; // Returns number (risky) to wait or true (run!).
		}else{
			return false; // Not in range.
		};
		var pos = creep.pos;
	}
};
function routine(creep){
	if(!Memory.creeps[creep.name]){ Memory.creeps[creep.name] = {}; };
	var threat = isThreat(creep);
	if((!Memory.creeps[creep.name].lastSafety || !creep.pos.isEqualTo(Memory.creeps[creep.name].lastSafety)) && !threat){
		Memory.creeps[creep.name].lastSafety = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
	};
	Memory.creeps[creep.name].threat = threat;
	if(!Memory.routine.creeps[creep.name].touched){
		Memory.routine.creeps[creep.name].touched = true;
	}else{
		console.log("Multitouch creep "+creep.name);
	};
};
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
function isThreat(creep){
	var threats = false;
	for(t in Memory.threats){
		var t = threatsFunction[Memory.threats[t].id](creep.pos,Memory.threats[t].data);
		if( t && t < threats ){ 
			threats = t;
			if(threats==1){ return true; }; // True means RUN!
		};
	};
	return threats; // Either false (safe) or a number > 1.
};
function dAdd(fn, name, extra){
	var found = false;
	var fullName = "dTasks."+fn+"("+name+")"+(extra||"");
	for(i in Memory.deffered.wait){ if(Memory.deffered.wait[i]==fullName){ found=true; }; };
	if(!found){
		Memory.deffered.fn.push("dTasks."+fn+"('"+name+"')");
		Memory.deffered.wait.push(fullName);
	};	
};
function bodify(bps){
	var body = [];
	var translate = {
		A: ATTACK,
		C: CARRY,
		H: HEAL,
		M: MOVE,
		R: RANGED_ATTACK,
		T: TOUGH,
		W: WORK
	};
	for(bp in bps){
		if(translate[bp]){
			for(i=0;i<bps[bp];i++){ body[body.length]=translate[bp]; };
		};
	};
	return body;
};

//// 2.  //// Adis - Automatic Debugging & Isolation System. a.k.a. self-debugger. TODO.
// for(i in Game.creeps){ if(!Memory.creeps[Game.creeps[i].name]){ console.log(Game.creeps[i].name); }; };


//// 3.  //// Colony (priority tasks).
var pulse = Memory.pulse==9;
if(Memory.pulse<=0){ // Pulse.
	Memory.pulse = 10;
	for (var i in Game.flags){
		//Game.flags[i].remove();
	};
};

//// 4. //// (each) City (priority tasks).
for(name in Memory.cities){
	var city = Memory.cities[name];
	var room = Game.rooms[name];
	if(room){ // If visible.
		// Memory check.
		if(!city.spawns){
			var spawnsRaw = room.find(FIND_MY_SPAWNS);
			city.spawns = {};
			for(i in spawnsRaw){
				city.spawns[spawnsRaw[i].name] = {
					queue: {}, // Production, key is time module of 3.
					stats: {},
					ready: Math.floor(Game.time/3),
					next: Math.floor((Game.time-1800)/3)
				};
			};
		};
		if(!city.ext && city.ext!=0){ 
			var ext = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}});
			city.ext = ext ? ext.length : 0;
		};
	};
};

//// 5. //// (each) Squad tasks in order.
for(id in Memory.squads.upgr){
};
for(id in Memory.squads.mine){
	var squad = Memory.squads.mine[id];
	if(!squad.name){ squad.name="mine_"+gobi(id).pos.roomName+"-"+gobi(id).pos.x+"-"+gobi(id).pos.y; };
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
		for(j in Game.spawns){
			var path = Memory.taps[squad.tap].pos.findPathTo(Game.spawns[j]);
			//console.log(Memory.taps[squad.tap].pos,path,path.length,path[path.length-1]);
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
	if(!squad.perf){
		console.log("squads.mine["+id+"].perf = ...constructing... ");
		squad.perf={
			theory: {},
			partice: {},
			tmp: {},
		};
	};
	if(!squad.options){
		console.log("squads.mine["+id+"].options = ...constructing... ");
		squad.options = [
			{e:0, roles:{ miner:false    , collector:false     , slayer:false     } },
			{e:0, roles:{ miner:{M:1,W:2}, collector:{M:1,C:5 }, slayer:{M:1,A:3} } },
			{e:0, roles:{ miner:{M:2,W:2}, collector:{M:1,C:5 }, slayer:{M:1,A:3} } },
			{e:1, roles:{ miner:{M:1,W:3}, collector:{M:2,C:5 }, slayer:{M:1,A:3} } },
			{e:2, roles:{ miner:{M:2,W:3}, collector:{M:2,C:6 }, slayer:{M:1,A:4} } },
			{e:3, roles:{ miner:{M:1,W:4}, collector:{M:2,C:7 }, slayer:{M:1,A:5} } },
			{e:4, roles:{ miner:{M:2,W:4}, collector:{M:2,C:8 }, slayer:{M:1,A:5} } },
			{e:5, roles:{ miner:{M:1,W:5}, collector:{M:2,C:9 }, slayer:{M:1,A:6} } },
			{e:6, roles:{ miner:{M:2,W:5}, collector:{M:2,C:10}, slayer:{M:1,A:6} } },
			{e:7, roles:{ miner:{M:3,W:5}, collector:{M:3,C:10}, slayer:{M:1,A:7} } },
			{e:8, roles:{ miner:{M:3,W:5}, collector:{M:3,C:11}, slayer:{M:1,A:8} } },
			{e:9, roles:{ miner:{M:3,W:6}, collector:{M:3,C:12}, slayer:{M:1,A:8} } }
		];
	};
	if(!squad.wish){
		console.log("squads.mine["+id+"].wish = ...constructing... ");
		var distance = Memory.taps[squad.tap].distance;
		var best = {score:false, wish:{}};
		var scores = [];
		var eMax = 0;
		for(j in Memory.cities){ eMax=Math.max(eMax,Memory.cities[j].ext); };
		for(j1 in squad.options){
			if(squad.options[j1].e > eMax){ break; };
			//console.log("miner", j1, squad.options[j1]);
			var miner = squad.options[j1].roles.miner;
			for(j2 in squad.options){
				if(squad.options[j2].e > eMax){ break; };
				var collector = squad.options[j2].roles.collector;
				//console.log("collector", j2, squad.options[j2]);
				for(j3 in squad.options){
					if(squad.options[j3].e > eMax){ break; };
					/*console.log("KUKU",
						squad.options[j3].roles.miner,
						squad.uniq.spots.length,
						squad.uniq.spots.length==2,
						squad.options[j3].roles.miner && squad.uniq.spots.length==2
					);*/
					if(!squad.options[j3].roles.miner && squad.uniq.spots.length==2){ continue; };
					var miner2 = squad.options[j3].roles.miner;
					//console.log("\n"+id+" miner2", j3, squad.options[j3]);
					for(j4 in squad.options){
						if(squad.options[j4].e > eMax){ break; }
						/*console.log("------",
							typeof squad.options[j4].roles.slayer,
							typeof squad.uniq.lair,
							typeof squad.options[j4].roles.slayer == typeof squad.uniq.lair
						);*/
						if(!(typeof squad.options[j4].roles.slayer == typeof squad.uniq.lair)){ continue; };
						var slayer = squad.options[j4].roles.slayer;
						//console.log("slayer", j4, squad.options[j4]);
						// Start the decision.
						var option = [];
						option.push(miner, collector, miner2, slayer);
						var mass = {C:0, M:0, W:0, A:0, R:0, H:0, T:0};
						for(cr in option){
							for(bp in option[cr]){
								mass[bp] = mass[bp] + option[cr][bp];
							};
						};
						var cost = mass.C*50 + mass.M*50 + mass.W*100 + mass.A*80 + mass.R*150 + mass.H*200 + mass.T*20; 
						var score = {}; // In e/t.
						score.income = Math.min(10, mass.W*2);
						score.upkeep = -cost/(30*60-distance);
						score.taxes = -0; // TODO: Implement income redistribution to scouts & defences.
						score.penaltyAway = -(Memory.taps[squad.tap].away||0)*0.05;// TODO: insert transportation+escort costs here.
						if(squad.uniq.lair){
							var t = 5000/(30*(mass.A||0.3)); // Time to kill Source Keeper. If no A then don't error but be huge.
							var repairCost = -t*1/(t+300);
							var disturbCost = -Math.max(0, (Math.min(10,mass.W*2)*t - Math.max(0,mass.W*2-10)*(300-t)) / (t+300) );
							var droppedCost = -Math.max(0, (score.income-disturbCost)*(squad.uniq.pickFreq||1) - mass.C*50); // TODO
							score.penaltyUniq = repairCost + disturbCost +droppedCost;
						}else{
							score.penaltyUniq = 0;
						}
						var total = score.income + score.upkeep + score.taxes + score.penaltyAway + score.penaltyUniq;
						if(!best || best.score<total){ 
							best.score = total;
							best.perf = score;
							best.cost = cost;
							best.creeps = {};
							if(miner    ){ best.creeps.miner     = miner     };
							if(miner2   ){ best.creeps.miner2    = miner2    };
							if(collector){ best.creeps.collector = collector };
							if(slayer   ){ best.creeps.slayer    = slayer    };
						};
						if(!squad.wishlist){ squad.wishlist={}; };
						//console.log(
						//	id,""+j1+j2+j3+j4,option.length, cost, distance, 
						//	"-",score.income, score.upkeep, score.taxes, score.penaltyAway, score.penaltyUniq, "=",total,
						//	"###", mass.A,mass.W
						//);
						squad.wishlist[j1+j2+j3+j4] = {total: total, perf: score, screeps: [miner, miner2, collector, slayer] }; 
					};
				};
			};
		};
		if(best.score){
			squad.perf.theory = best.perf;
			squad.wish = best; 
		};
	};
	if(!squad.creeps){
		console.log("squads.mine["+id+"].creeps = ...constructing... ");
		squad.creeps=[];
	};
	if(!squad.state){ squad.state="idle"; }; // Either "idle", "normal", "initDef", "hunt"
	// Check if we have wished creeps and order more.
	var exts = false;
	if(squad.creeps.length==0 && squad.wish){
		squad.state="idle";
		for(i in squad.wish.creeps){
			//if(!Memory.demand[id+"-"+i] && (!Memory.supply[id+"-"+i] || !Game.creeps(Memory.supply[id+"-"+i].id)) ){
			if(!Memory.demand[id+"-"+i] && !Memory.supply[id+"-"+i]){
				var bp = squad.wish.creeps[i];
				//console.log("\n");
				var string = "";
				//console.log(((bp.C||0)*50+ (bp.M||0)*50+ (bp.W||0)*100+ (bp.A||0)*80+ (bp.R||0)*150+ (bp.H||0)*200+ (bp.T||0)*20));
				//string="bp "; for(i in bp){ string=string+i+":"+bp[i]+" "; }; console.log(string);
				//var body = bodify(bp);
				var body = [];
				var translate = {
					A: ATTACK,
					C: CARRY,
					H: HEAL,
					M: MOVE,
					R: RANGED_ATTACK,
					T: TOUGH,
					W: WORK
				};
				for(b in bp){
					if(translate[b]){
						for(j=0;j<bp[b];j++){ body[body.length]=translate[b]; };
					};
				};
				//console.log(((bp.C||0)*50+ (bp.M||0)*50+ (bp.W||0)*100+ (bp.A||0)*80+ (bp.R||0)*150+ (bp.H||0)*200+ (bp.T||0)*20));
				//string="bp "; for(i in bp){ string=string+i+":"+bp[i]+" "; }; console.log(string);
				//string="body "; for(i in body){ string=string+i+":"+body[i]+" "; }; console.log(string);
				var tap = Memory.taps[squad.tap];
				delete Memory.supply[id+"-"+i];
				Memory.demand[id+"-"+i] = {
					name: squad.name+"_"+i,
					fat: body.length,
					bp: bp,
					body: body,
					cost: ((bp.C||0)*50+ (bp.M||0)*50+ (bp.W||0)*100+ (bp.A||0)*80+ (bp.R||0)*150+ (bp.H||0)*200+ (bp.T||0)*20),
					fatigue: Math.ceil( (body.length-bp.M)/bp.M ),
					owner: id,
					score: squad.wish.score,
					at: Game.time+60,
					pos: tap.pos,
					risky: false,
					memory: {role: i} // Doublecheck
				};
			};
		};
	};
	for(i in [] /*squad.creeps*/){
		var role = i;
		var creep = gobi(i);
		var ram = squad.creeps[i];
		routine(creep);
		if(!creep){
			// He has died.
		}else if(ram.role == "miner" || ram.role == "miner2"){
			if(!ram.pos){
				if(ram.role=="miner"){ ram.pos=squad.uniq.spots[0]; }else{ ram.pos=squad.uniq.spots[1]; };
			};
			if(isThreat(creep)){
				if(!Memory.lastSafety){
					// Panic!
					creep.moveTo(Memory.rallyPoint);
				}else{
					creep.moveTo(Memory.lastSafety);
				};
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
};
for(id in Memory.squads.deff){
	var squad = Memory.squads.deff[i];
};
for(id in Memory.squads.patr){
	var squad = Memory.squads.patr[i];
};
for(id in Memory.squads.offn){
	var squad = Memory.squads.offn[i];
};
for(id in Memory.squads.esco){
	var squad = Memory.squads.esco[i];
};
for(id in Memory.squads.scot){
	var squad = Memory.squads.scot[i];
};

//// 6. //// (each) City. Everythin of scope room.
for(name in []/*Memory.cities*/){
	var city = Memory.cities[name];
	var room = Game.rooms[name];
	if(Math.floor(Game.time/3) == Game.time/3){
		for(name in city.spawns){
			var spawn = Game.spawns[name];
			var ram = city.spawns[name];
			if(ram.ready<Math.floor(Game.time)){ ram.ready=Math.floor(Game.time) }; //TODO implement such this is obselete.
			if(ram.next && ram.queue[ram.next] && Memory.supply[ram.queue[ram.next]]){
				if(ram.next <= (Game.time-Game.time%3)/3){
					var order = Memory.supply[ram.queue[ram.next]];
					if(order && order.body){
						if(!order.name){ order.name = "noname"+getId(); };
						var ok = spawn.canCreateCreep(order.body, order.name);
						if(ok == -3){ // ERR_NAME_EXISTS - try to change the name.
							order.name = order.name+"-"+getID();
							ok = spawn.canCreateCreep(order.body, order.name)
						};
						if(ok == 0){
							if(!order.owner){ order.owner = false };
							if(!order.at){ order.at = Game.time };
							if(!order.pos){ order.pos = new RoomPosition(spawn.pos.x, spawn.pos.y, spawn.pos.roomName); };
							if( order.risky===undefined){ order.risky=false; };
							if(!order.memory){ order.memory={}; };
							order.memory.owner = order.owner;
							var mem = {
								id: ram.queue[ram.next],
								owner: spawn.name,
								role: "transit",
								target: order.pos,
								risky: order.risky,
								at: order.at,
								memory: order.memory
							};
							if(spawn.createCreep(order.body, order.name, mem) == 0){ 
								// Success, creep is spawning!
								ram.ready = Math.floor(Game.time/3) + order.body.length;
								Memory.supply[ram.queue[ram.next]].status = "spawning";
								delete ram.queue[ram.next];
							};
						}else if(ok == -1){ // ERR_NOT_OWNER
							delete city.spawns[name];
						}else if(ok == -3 || ok == -4 || ok == -6 ){ // ERR_NAME_EXISTS || ERR_BUSY || ERR_NOT_ENOUGH_ENERGY
							// Do nothing = Postpone.
						}else if(ok == -10){ // ERR_INVALID_ARGS - corrupt order, drop it.
								delete ram.queue[ram.next];
						}else{
							console.log("This is broken API");
						};
					}else{
						var first = Number.MAX_VALUE;
						for(i in ram.queue){ first = Math.min(first,i); };
						ram.next = (first==Number.MAX_VALUE ? false : first);
					};
				}else{
					// Do nothing. Wait for demand.
				};
			}else{
				if(ram.queue[ram.next] && !Memory.supply[ram.queue[ram.next]]){
					delete ram.queue[ram.next];
					delete Memory.supply[ram.queue[ram.next]];
				};
				var first = Number.MAX_VALUE;
				for(i in ram.queue){ first = Math.min(first,i); };
				ram.next = (first==Number.MAX_VALUE ? false : first);
			};
			// Do spawn stuff.
		};
	};
	// Do city stuff.
};

//// 7. //// The Colony. Everything of scope global.
for(id in Game.rooms){ // Make overlay for each unexplored room.
	var room = Game.rooms[id];
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
for(id in []/*Memory.demand*/){ // Distribute spawning demands to spawns.
	var demand = Memory.demand[id];
	var pos = new RoomPosition(demand.pos.x, demand.pos.y, demand.pos.roomName);
	var fat = demand.fat;
	var cost = demand.cost;
	var fatigue = demand.fatigue;
	var at = Math.floor( demand.at/3 );
	console.log(">demand>"," id:",id," pos:",pos," fat:",fat," cost:",cost," fatigue:",fatigue," at:",at);
	var best = {score:false,spawn:false,moment:false};
	var count = 0;
	for(c in Memory.cities){
		for(s in Memory.cities[c].spawns){
			// Try to place demand.
			var spawn = Game.spawns[s];
			var ram = Memory.cities[c].spawns[s];
			var path = spawn.room.findPath( spawn.pos, pos, {ignoreCreeps: true} );
			//var path = spawn.pos.findPathTo(pos, {ignoreCreeps: true});
			var distance = (path ? path.length : false);
			if(!distance){ console.log(">demand>cities>spawns> Bad distance"); continue; };
			console.log(">demand>cities>spawns> "," name:",s," pos:",spawn.pos," distance:",distance," moment:",moment);
			var moment = ram.ready;
			while(moment < at + fat || !best.score.total){
				var occupied = true;
				console.log(">demand>cities>spawns>moment> "," count:",count," time:",Math.floor(Game.time/3)," moment:",moment," at:",at," fat:",fat);
				while(occupied){
					var occupied = false;
					for(q=moment;q<moment+fat;q++){
						console.log(">demand>cities>spawns>moment>occupied>q>if> "," q:",q," occupied:",occupied,ram.queue[q],Memory.supply[ram.queue[q]],(Memory.supply[ram.queue[q]]||{}).body);
						if(ram.queue[q]){
							occupied = q + Memory.supply[ram.queue[q]].fat;
						};
					};
					console.log(">demand>cities>spawns>moment>occupied> "," occupied:",occupied);
					moment = occupied || moment;
				};
				var score = {};
				score.distance = -(fatigue*distance*2)*cost/1800; // Assume plains everywhere.
				score.wait = -Math.max(0, at - (moment+fat))*cost/1800;
				score.delay = -Math.max(0, (moment+fat) - at)*demand.score;
				score.total = score.distance + score.wait + score.delay;
				console.log(">demand>cities>spawns>moment> "," count:",count," moment:",moment," score.distance:",score.distance," score.wait:",score.wait," score.delay:",score.delay," score.total:",score.total," best:",best.score.total);
				if(!best.score || score.total>best.score.total){
					best.score = score;
					best.ram = ram;
					best.moment = moment;
				};
				moment++;
				count++;
				if(count==(Memory.count||10)){ throw error("kuku!"); };
			};
			//no .at-fat-distance līdz tgd
			// Calc offset. Faster=upkeep, Slower=Owner's perf.
		};
	};
	if(best.ram){
		console.log(">demand>best> "," id:",id," demand:",demand," spawn:",s);
		best.ram.queue[moment] = id;
		Memory.supply[id] = demand;
		Memory.supply[id].status = "in queue";
		Memory.demand[id] = undefined;
	};
};
for(name in Game.creeps){ // Take care of transits.
	var creep = Game.creeps[name];
	if(Memory.creeps[name].role=="transit"){
		
	};
	
};
//// 8. //// Deferred tasks. Anything not urgent and CPU intensive goes here.
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
				//Game.rooms[roomName].createFlag(sourcesRaw[s].pos,false,COLOR_RED);
			}else{
				source.lair = false;
				//Game.rooms[roomName].createFlag(sourcesRaw[s].pos);
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
			Memory.rooms[roomName].contr[contr.id] = {};
			Memory.rooms[roomName].contr[contr.id].pos = contr.pos;
			var spots = [];
			// Search all spots next to source.
			for(dx=-1;dx<=1;dx++){
				for(dy=-1;dy<=1;dy++){
					spots.push( new RoomPosition(contr.pos.x+dx,contr.pos.y+dy,contr.pos.roomName) );
					var objs = Game.rooms[contr.pos.roomName].lookAt(spots[spots.length-1]);
					objs.forEach(function(obj){	if(obj.type == 'terrain' && obj.terrain == 'wall'){ spots.pop(); }; });
				};
			};
			Memory.rooms[roomName].contr[contr.id].spots = spots;			
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

//// Random shit to be removed.
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
	if(creep.energy == 0 || (Memory.creeps[creep.name].state == "empty" && creep.energy < creep.energyCapacity) ) {
		Memory.creeps[creep.name].state = "empty";
		var t = false;
		if(!Memory.creeps[creep.name].target){
			var es = creep.room.find(FIND_DROPPED_ENERGY);
			var total = 0;
			for(i in es) {total = total + es[i].energy;};
			var r = Math.random()*total;
			total = 0;
			for(i in es) {
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
				if(!!creep.transferEnergy(Game.getObjectById(t.id))){ Memory.creeps[creep.name].target=false; };
			};
		}else{
			var target = [];
			var countTransAll = 0;
			var countCities = 0;
			for(i in Game.creeps) {
				if(Memory.creeps[Game.creeps[i].name].role == "trans") {countTransAll=countTransAll+1;};
			};
			for(i in Memory.cities){countCities++;};
			var avgTrans = countTransAll / countCities;
			for(i in Game.spawns){
				var spawn = Game.spawns[i];
				var countTrans = 0;
				for(i in Game.creeps) {
					if(Memory.creeps[Game.creeps[i].name].role == "trans" && Game.creeps[i].room.name == spawn.room.name) {countTrans=countTrans+1;};
				};
				target[target.length] = {
					score: (creep.room.name == spawn.room.name ? 1 : Math.max(0, avgTrans / (countTrans+1) - 1)) * (spawn.energy < spawn.energyCapacity ? 3 : 0.1),
					target: spawn
				};
			};
			for(i in Game.creeps) {
				var creep2 = Game.creeps[i];
				var countTrans = 0;
				for(i in Game.creeps) {
					if(Memory.creeps[Game.creeps[i].name].role == "trans" && Game.creeps[i].room.name == creep2.room.name) {countTrans=countTrans+1;};
				};
				if(Memory.creeps[creep2.name].role == "contr" || Memory.creeps[creep2.name].role == "settler"){
					target[target.length] = {
						score: (creep.room.name == creep2.room.name ? 1 : Math.max(0, avgTrans / countTrans - 1)),
						target: creep2
					};
				};
			};
			var sum = 0;
			for(i in target){ sum = sum + target[i].score; };
			var r = Math.random()*sum;
			for(i in target){ 
				sum = sum - target[i].score;
				if( !t && sum < r) { t = target[i].target; continue; }; 
			};
			var string="";
			for(i in target){ string=string+Math.round(target[i].score*100)/100+", "; };
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
		if(creep.energy > creep.energyCapacity * 0.8){
			for(i in Game.creeps){
				if(Memory.creeps[Game.creeps[i].name].role == "contr"){
					if(Game.creeps[i].energy < Game.creeps[i].energyCapacity * 0.8 && !creep.transferEnergy(Game.creeps[i],creep.energy/2)){ continue; };
				};
			};
		};
	};
};

// Delete creeps from Memory
var safe = true;
for(i in Game.spawns){ if(Game.spawns.spawning){ safe=false; }; };
if(safe){ for(i in Memory.creeps){ if(!Game.creeps[i]){ Memory.creeps[i]=undefined;}; }; };

if(!Game.spawns.Spawn1){ console.log("I am dead. Please respawn!"); return 1; };
if (pulse) {pipes.safe = findSources(Game.spawns.Spawn1.room)};
for(i in Game.spawns){
	var spawn = Game.spawns[i];
	if(!spawn.spawning) {
		var contr = Game.spawns[i].room.controller;
		var countContr = 0;
		var countTransAll = 0;
		var countTrans = 0;
		var countMiners = 0;
		for(creep in Game.creeps) {
			if(Memory.creeps[Game.creeps[creep].name].role == "contr" && Game.creeps[creep].room.name == spawn.room.name) {countContr++;};
			if(Memory.creeps[Game.creeps[creep].name].role == "trans") {countTransAll=countTransAll+1;};
			if(Memory.creeps[Game.creeps[creep].name].role == "trans" && Game.creeps[creep].room.name == spawn.room.name) {countTrans=countTrans+1;};
			if(Memory.creeps[Game.creeps[creep].name].role == "miner" && Game.creeps[creep].room.name == spawn.room.name) {countMiners=countMiners+1;};
		};
		for(id in Memory.rooms[spawn.room.name].sources) {
			var source = Memory.rooms[spawn.room.name].sources[id];
			if(source.lair){ continue; };
			var count = 0;
			for(creep in Game.creeps) {if(Memory.creeps[Game.creeps[creep].name].target && Memory.creeps[Game.creeps[creep].name].target == id) {count++;};};
			if(countMiners<1) {console.log("Create miner:",Game.spawns[i].createCreep([MOVE, WORK], "miner"+getID(), {role: "miner", target: id }));};
			if(count<source.spots) {console.log("Create miner:",Game.spawns[i].createCreep([MOVE, WORK, WORK], "miner"+getID(), {role: "miner", target: id }));};
		};
		if(countMiners>1 && countTrans<7 && countTransAll < _.size(Game.spawns)*8) {console.log("Create Trans:",Game.spawns[i].createCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], "trans"+getID(), {role: "trans", target:false}));};
		if(countMiners>1 && countContr<Memory.rooms[spawn.room.name].contr[spawn.room.controller.id].spots.length) {console.log("Create Contr:",Game.spawns[i].createCreep([MOVE, CARRY, WORK, WORK], "contr"+getID(), {role: "contr", target: contr }));};
		if(countTrans==0) {console.log("Create Trans:",Game.spawns[i].createCreep([MOVE, CARRY], "trans"+getID(), {role: "trans", target:false}));};
	};
};
for(i in Game.creeps) {
	var creep = Game.creeps[i];
	if     (Memory.creeps[creep.name].role=="miner"){ roleMiner(creep) }
	else if(Memory.creeps[creep.name].role=="trans"){ roleTrans(creep) }
	else if(Memory.creeps[creep.name].role=="contr"){ roleContr(creep) }
	else if(Memory.creeps[creep.name].role=="settler"){
		if(creep.energy == 0 || (Memory.creeps[i].state == "empty" && creep.energy < creep.energyCapacity) ) {
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

// Testing
if(!Memory.test){
	//Memory.test=true;
	Memory.tmp.pois = Memory.tmp.pois||[];
	Memory.tmp.shortlist = Memory.tmp.shortlist||{};
	tmp = Memory.tmp.shortlist||{};
	if(!Memory.tmp.sc){ // Add sources & controller
		var poi = [];
		console.log("Doing sources & controller...");
		sources = Game.rooms.E5S6.find(FIND_SOURCES);
		for(i in sources){ poi.push(sources[i].pos); };
		poi.push( Game.rooms.E5S6.controller.pos);
		console.log(poi,poi.length);
		for(i in poi){
			Memory.tmp.pois.push(poi[i]);
			Memory.tmp.shortlist[poi[i].x+"-"+poi[i].y] = true;
		};
		Memory.tmp.sc = true;
	}else{
		console.log("Cached source & controller...");
	};
	if(!Memory.tmp.egroups){ // Divide exits into groups
		console.log("Doing egroups...");
		exits = Game.rooms.E5S6.find(FIND_EXIT);
		egroups = [];
		last = Game.rooms.E5S6.getPositionAt(25,25);
		for(i in exits){
			if(exits[i].isNearTo(last)){
				egroups[egroups.length-1].push(exits[i]);
			}else{
				egroups[egroups.length] = [ exits[i] ];
			};
			last = exits[i];
		};
		console.log(egroups.length);
		Memory.tmp.egroups = egroups;
	}else{
		console.log("Cached egroups...");
	};

	Memory.tmp.pe = Memory.tmp.pe||{};
	for(i=0;i<Memory.tmp.pois.length;i++){ // Add important exits. POI->exit & exit->exit
		if(!Memory.tmp.pe[i]){
			console.log("Doing exits from pe["+i+"]...");
			var poiPos = Game.rooms.E5S6.getPositionAt(Memory.tmp.pois[i].x,Memory.tmp.pois[i].y);
			for(j=0;j<Memory.tmp.egroups.length;j++){
				var egroup = Memory.tmp.egroups[j];
				for(k=0;k<egroup.length;k++){ egroup[k] = Game.rooms.E5S6.getPositionAt(egroup[k].x,egroup[k].y); };
				console.log(i,j,poiPos,egroup[0],egroup.length);
				var t = poiPos.findClosest(egroup,{ignoreCreeps:true, ignore:[poiPos]});
				if(!tmp[t.x+"-"+t.y] && !poiPos.isNearTo(t)){
					Memory.tmp.shortlist[t.x+"-"+t.y] = true;
					Memory.tmp.pois.push(t);
					Game.rooms.E5S6.createFlag(t.x, t.y)
				};
			};
			Memory.tmp.pe[i] = true;
		};
	};

	Memory.tmp.paths = Memory.tmp.paths||{};
	Memory.tmp.tiles = Memory.tmp.tiles||{};
	for(i=Memory.tmp.pois.length-1;i>0;i--){ // Put all paths to tiles
		for(j=0;j<i;j++){
			var pos1 = Game.rooms.E5S6.getPositionAt(Memory.tmp.pois[i].x, Memory.tmp.pois[i].y);
			var pos2 = Game.rooms.E5S6.getPositionAt(Memory.tmp.pois[j].x, Memory.tmp.pois[j].y);
			if(!Memory.tmp.paths[pos1.x+"-"+pos1.y+"^"+pos2.x+"-"+pos2.y]){
				console.log("Doing path from "+pos1.x+"-"+pos1.y+" to "+pos2.x+"-"+pos2.y+"...");
				var path = Game.rooms.E5S6.findPath(pos1,pos2,{ignoreCreeps:true, ignore:[pos1,pos2]});
				for(k in path){
					Memory.tmp.tiles[path[k].x+"-"+path[k].y] = {x:path[k].x, y:path[k].y};
					//Game.rooms.E5S6.createFlag(path[k].x, path[k].y);
				};
				Memory.tmp.tiles[pos1.x+"-"+pos1.y] = {x:pos1.x, y:pos1.y}; // Add back starting point of path.
				console.log(i,j,path.length,pos1,pos2);
				Memory.tmp.paths[pos1.x+"-"+pos1.y+"^"+pos2.x+"-"+pos2.y] = true;
			};
		};
	};
	
	// Debug: show tiles
	// for(i in Memory.tmp.tiles){ Game.rooms.E5S6.createFlag(Memory.tmp.tiles[i].x, Memory.tmp.tiles[i].y); };
	// Memory.tmp={}; Memory.test=false;
	// Memory.tmp.condensed=false; Memory.test=false;
	// for(i in Game.flags){ Game.flags[i].remove() };
	
	// Condense adjanced tiles.
	action = 0;
	Memory.tmp.condensed = Memory.tmp.condensed || 0;
	while(Memory.tmp.condensed < 7){ // Repeat 5 times
		var countLast = 0; for(i in Memory.tmp.tiles){ if(Memory.tmp.tiles[i]){ countLast++;}; };
		for(i in Memory.tmp.tiles){
			if(!Memory.tmp.tiles[i]){ continue; };
			if(Memory.tmp.shortlist[i]){ continue; }; // Skip POIs.
			var tile = Memory.tmp.tiles[i];
			var ul = Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y-1)];
			var um = Memory.tmp.tiles[(tile.x  )+"-"+(tile.y-1)];
			var ur = Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y-1)];
			var ml = Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y  )];
			var mr = Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y  )];
			var bl = Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y+1)];
			var bm = Memory.tmp.tiles[(tile.x  )+"-"+(tile.y+1)];
			var br = Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y+1)];
			var room = Game.rooms.E5S6;
			action++;
			if(      !ul && !um && !ur && !(!bl && !bm && !br) && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
				// Move down!
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Moved down "+tile.x+"-"+tile.y);
			}else if(!bl && !bm && !br && !(!ul && !um && !ur) && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall" ){
				// Move up!
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Moved up "+tile.x+"-"+tile.y);
			}else if(!ul && !ml && !bl && !(!ur && !mr && !br) && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" ){
				// Move right!
				Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
				Memory.tmp.tiles[i] = undefined;
				console.log("Moved right "+tile.x+"-"+tile.y);
			}else if(!ur && !mr && !br && !(!ul && !ml && !bl) && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" ){
				// Move left!
				Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
				Memory.tmp.tiles[i] = undefined;
				console.log("Moved left "+tile.x+"-"+tile.y);
			}else if(!ml && !ul && !um && mr && bm){
				// Integrate down-right!
				Memory.tmp.tiles[i] = undefined;
				console.log("Integrated down-right "+tile.x+"-"+tile.y);
			}else if(!mr && !ur && !um && ml && bm){
				// Integrate down-left!
				Memory.tmp.tiles[i] = undefined;
				console.log("Integrated down-left "+tile.x+"-"+tile.y);
			}else if(!ml && !bl && !bm && mr && um){
				// Integrate up-right!
				Memory.tmp.tiles[i] = undefined;
				console.log("Integrated up-right "+tile.x+"-"+tile.y);
			}else if(!mr && !br && !bm && ml && um){
				// Integrate up-left!
				Memory.tmp.tiles[i] = undefined;
				console.log("Integrated up-left "+tile.x+"-"+tile.y);
			}else if(!ml && !ul && !um && ur && br && bl && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
				// expand down-right!
				Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Expanded down-right "+tile.x+"-"+tile.y);
			}else if(!mr && !ur && !um && ul && bl && br && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
				// expand down-left!
				Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Expanded down-left "+tile.x+"-"+tile.y);
			}else if(!ml && !bl && !bm && ur && br && ul && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall"){
				// expand up-right!
				Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Expanded up-right "+tile.x+"-"+tile.y);
			}else if(!mr && !br && !bm && ul && bl && ur && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall"){
				// expand up-left!
				Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
				Memory.tmp.tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
				Memory.tmp.tiles[i] = undefined;
				console.log("Expanded up-left "+tile.x+"-"+tile.y);
			}else if(um && mr && bm && ml){
				// Dissolve!
				Memory.tmp.tiles[i] = undefined;
				console.log("Integrated up-left "+tile.x+"-"+tile.y);
			}else{
				action--;
			};
		};
		var count = 0; for(i in Memory.tmp.tiles){ if(Memory.tmp.tiles[i]){ count++;}; };
		console.log("Tiles: ",action, count, count - Memory.tmp.lastTiles);
		if(count - countLast >= -2){
			Memory.tmp.condensed++;
		}else{
			Memory.tmp.condensed = 0;
		};
	};
	
	// Place mid-taps.
	Memory.tmp.taps = Memory.tmp.taps||{};
	if(!Memory.tmp.midtaps){
		for(i in Memory.tmp.tiles){
			if(!Memory.tmp.tiles[i]){ continue; };
			if(Memory.tmp.shortlist[i]){ continue; }; // Skip POIs.
			var tile = Memory.tmp.tiles[i];
			var count = 0;
			if(Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y-1)]){ count++; };
			if(Memory.tmp.tiles[(tile.x  )+"-"+(tile.y-1)]){ count++; };
			if(Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y-1)]){ count++; };
			if(Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y  )]){ count++; };
			if(Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y  )]){ count++; };
			if(Memory.tmp.tiles[(tile.x-1)+"-"+(tile.y+1)]){ count++; };
			if(Memory.tmp.tiles[(tile.x  )+"-"+(tile.y+1)]){ count++; };
			if(Memory.tmp.tiles[(tile.x+1)+"-"+(tile.y+1)]){ count++; };
			if(count>=3){
				Memory.tmp.taps[i] = tile;
				Memory.tmp.tiles[i] = undefined;
			};			
		};
	};
	Memory.test = true;
};

// Watch for enemies.
var hostilesCount = {};
for(i in Game.spawns){
	Game.spawns[i].room.find(FIND_HOSTILE_CREEPS, { filter: function(i) { 
		if(i.owner.username != 'Source Keeper') {
			hostilesCount[i.owner.username] = hostilesCount[i.owner.username] || 0;
			hostilesCount[i.owner.username]++;
		}
	}});
};
for(var user in hostilesCount) {
    Game.notify(hostilesCount[user] + ' enemies spotted: user ' + user + ' in room ' + creep.room.name);
}

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
