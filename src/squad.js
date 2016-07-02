module.exports = function(creeps) {
	var doUpgr = function(id){ };
	var doMine = function(id){
		var squad = Memory.squads.mine[id];
		if(!squad.name){ squad.name="mine_"+gobi(id).pos.roomName+"-"+gobi(id).pos.x+"-"+gobi(id).pos.y; };
		if(!squad.uniq){ squad.uniq={}; };
		if(typeof squad.uniq.lair === "undefined" || typeof squad.uniq.fort === "undefined"){
			console.log("squads.mine["+id+"].uniq.lair = ...constructing... ");
			console.log("squads.mine["+id+"].uniq.fort = ...constructing... ");
			var lair = gobi(id).pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }})[0];
			if(lair) {
				var path = [ posify(lair.pos) ];
				var energy = gobi(id);
				var pathRaw = lair.pos.findPathTo(energy, {ignoreCreeps: true});
				console.log(pathRaw)
				for(var j in pathRaw){
					var pos = energy.room.getPositionAt(pathRaw[j].x, pathRaw[j].y);
					path.push(pos);
				};
				path.pop(); // Discard tile of Source itself.
				console.log(Math.max(1,path.length-1-1))
				console.log(path.length)
				console.log(gobi(id).room.lookForAt('structure', path[Math.max(1,path.length-1-1)]));
				var structure = gobi(id).room.lookForAt('structure', path[Math.max(1,path.length-1-1)]);
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
				pos: posify(gobi(id).pos),
				spots: [],
			};
			// Search all spots next to source.
			for(var dx=-1;dx<=1;dx++){
				for(var dy=-1;dy<=1;dy++){
					source.spots.push( new RoomPosition(source.pos.x+dx,source.pos.y+dy,source.pos.roomName) );
					var objs = Game.rooms[source.pos.roomName].lookAt(source.spots[source.spots.length-1]);
					objs.forEach(function(obj){	if(obj.type == 'terrain' && obj.terrain == 'wall'){ source.spots.pop(); }; });
				};
			};
			// Test every pos next to every spot.
			var taps = {};
			var best = {score:100, id:""};
			for(var i in source.spots){
				var spot = source.spots[i];
				for(var dx=-1;dx<=1;dx++){
					for(var dy=-1;dy<=1;dy++){
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
								for(var s in source.spots){
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
								for(var j in cut){
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
			//for(var i in taps){ console.log("taps",i,taps[i]) };
			//for(var i in best){ console.log("best",i,best[i]) };
			var bt = taps[best.id];
			//for(var i in bt){ if(typeof bt[i] != "function"){ console.log("bt",i,bt[i]) }; };
			squad.tap = bt.roomName+"X"+bt.x+"Y"+bt.y;
			squad.uniq.spots = best.spots;
			Memory.taps[squad.tap] = {
				pos: posify(bt),
			};
		};
		if(!Memory.taps[squad.tap].distance){
			console.log("Memory.taps["+squad.tap+"].distance = ...constructing... ");
			var distance = Number.MAX_VALUE;
			for(var j in Game.spawns){
				var pos = posify(Memory.taps[squad.tap].pos);
				var path = pos.findPathTo(Game.spawns[j]);
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
			for(var j in Memory.cities){ eMax=Math.max(eMax,Memory.cities[j].ext); };
			for(var j1 in squad.options){
				if(squad.options[j1].e > eMax){ break; };
				//console.log("miner", j1, squad.options[j1]);
				var miner = squad.options[j1].roles.miner;
				for(var j2 in squad.options){
					if(squad.options[j2].e > eMax){ break; };
					var collector = squad.options[j2].roles.collector;
					//console.log("collector", j2, squad.options[j2]);
					for(var j3 in squad.options){
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
						for(var j4 in squad.options){
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
							for(var cr in option){
								for(var bp in option[cr]){
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
			for(var i in squad.wish.creeps){
				//if(!Memory.demand[id+"-"+i] && (!Memory.supply[id+"-"+i] || !Game.creeps(Memory.supply[id+"-"+i].id)) ){
				if(!Memory.demand[id+"-"+i] && !Memory.supply[id+"-"+i]){
					var bp = squad.wish.creeps[i];
					//console.log("\n");
					var string = "";
					//console.log(((bp.C||0)*50+ (bp.M||0)*50+ (bp.W||0)*100+ (bp.A||0)*80+ (bp.R||0)*150+ (bp.H||0)*200+ (bp.T||0)*20));
					//string="bp "; for(var i in bp){ string=string+i+":"+bp[i]+" "; }; console.log(string);
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
					for(var b in bp){
						if(translate[b]){
							for(var j=0;j<bp[b];j++){ body[body.length]=translate[b]; };
						};
					};
					//console.log(((bp.C||0)*50+ (bp.M||0)*50+ (bp.W||0)*100+ (bp.A||0)*80+ (bp.R||0)*150+ (bp.H||0)*200+ (bp.T||0)*20));
					//string="bp "; for(var i in bp){ string=string+i+":"+bp[i]+" "; }; console.log(string);
					//string="body "; for(var i in body){ string=string+i+":"+body[i]+" "; }; console.log(string);
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
		for(var i in [] /*squad.creeps*/){
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
						var all = creep.room.find(FIND_DROPPED_RESOURCES);
						for(var e in all){ if(creep.pos.inRangeTo(all[e].pos)){ ram.energies.push(all[e]); }; };
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
	var doDeff = function(id){ };
	var doPatr = function(id){ };
	var doOffn = function(id){ };
	var doEsco = function(id){ };
	var doScot = function(id){ };

	return {
		'doMine': doMine,
		'doUpgr': doUpgr,
		'doDeff': doDeff,
		'doPatr': doPatr,
		'doOffn': doOffn,
		'doEsco': doEsco,
		'doScot': doScot,
	};
}();