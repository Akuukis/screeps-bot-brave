"use strict";


var MEM = 'squads';


module.exports = class Squad {

	constructor(opts){
		if(opts.name && Player.squads.has(opts.name)){
			return Player.squads.get(opts.name);
		}else{
			if(!opts.type in ['mine', 'upgr']) throw Error('Unknown type: '+opts.type);
			this.id = opts.id;
			this.type = opts.type;
			this.name = opts.name;
			this.state = opts.state || 'Idle';
			this.creeps = opts.creeps || [];
			this.uniq = opts.uniq;

			this.init = this[this.type+'_init'];
			this.pulse = this[this.type+'_pulse'];
			this.tick = this[this.type+'_tick'];

			this.init();

			if(!Memory[MEM][this.name]) Memory[MEM][this.name] = {};
			this.mem = Memory[MEM][this.name];

			[
				'id', 'type', 'name', 'state', 'creeps', 'uniq'
			].forEach( key=>Memory[MEM][this.name][key]=this[key] );

			Player.squads.set(this.id, this);
		};
	}

	static recache(){
		Object.keys(Memory[MEM]).forEach( name=>Player.squads.set(name, new this(Memory[MEM][name])) );
	}

	// Mine

		mine_init(){
			var id = this.id;
			if(!this.name){
				this.name = "mine_"+gobi(id).pos.roomName+"-"+gobi(id).pos.x+"-"+gobi(id).pos.y;
			};
			if(!this.uniq){
				let uniq = {};
				let source = {
					pos: posify(gobi(id).pos),
				};
				{  // .lair & .fort
					var lair = gobi(id).pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }})[0];
					if(lair) {
						var path = [ posify(lair.pos) ];
						var energy = gobi(id);
						var pathRaw = lair.pos.findPathTo(energy, {ignoreCreeps: true});
						// console.log(pathRaw)
						for(var j in pathRaw){
							var pos = energy.room.getPositionAt(pathRaw[j].x, pathRaw[j].y);
							path.push(pos);
						};
						path.pop(); // Discard tile of Source itself.
						// console.log(Math.max(1,path.length-1-1))
						// console.log(path.length)
						// console.log(gobi(id).room.lookForAt('structure', path[Math.max(1,path.length-1-1)]));
						var structure = gobi(id).room.lookForAt('structure', path[Math.max(1,path.length-1-1)]);
						if(structure && structure.structureType==STRUCTURE_RAMPART){ structure=structure.id };
						uniq.fort = {
							id: structure||false,
							pos: path[path.length-1-1]
						};
						uniq.lair = lair;
						//uniq.fortified = false;
					}else{
						uniq.lair = false;
						uniq.fort = false;
					};
				};
				{  // .spotsPos
					let spots = [];
					// Search all spots next to source.
					for(let dx=-1;dx<=1;dx++){
						for(let dy=-1;dy<=1;dy++){
							spots.push( new RoomPosition(source.pos.x+dx,source.pos.y+dy,source.pos.roomName) );
							let objs = Game.rooms[source.pos.roomName].lookAt(spots[spots.length-1]);
							objs.forEach( obj=>{ if(obj.type == 'terrain' && obj.terrain == 'wall'){spots.pop()}; });
						};
					};
					uniq.spotsPos = spots;
				};
				{  // .tapPos
					let taps = [];
					let highscore = 0;
					uniq.spotsPos.forEach( spotPos=>{
						let tap = {pos: spotPos, score: 0};
						for(let k in uniq.spotsPos){
							let dist = tap.pos.findPathTo(uniq.spotsPos[k]).length;
							if(dist == 1) tap.score++;
						};
						taps.push(tap);
						if(tap.score > highscore) highscore = tap.score;
					});
					taps.filter( tap=>tap.score==highscore );
					// TODO choose closest tap, not random first tap.
					uniq.tapPos = taps[0].pos;

					// if(!Memory.taps[uniq.tap]) Memory.taps[uniq.tap] = { pos: posify(bt) };
					// if(!Memory.taps[squad.tap].distance){
					// 	console.log("Memory.taps["+squad.tap+"].distance = ...constructing... ");
					// 	let distance = Number.MAX_VALUE;
					// 	for(let j in Game.spawns){
					// 		let pos = posify(Memory.taps[squad.tap].pos);
					// 		let path = pos.findPathTo(Game.spawns[j]);
					// 		//console.log(Memory.taps[squad.tap].pos,path,path.length,path[path.length-1]);
					// 		if(path[path.length-1].x==0  ||
					// 			 path[path.length-1].x==50 ||
					// 			 path[path.length-1].y==0  ||
					// 			 path[path.length-1].y==50
					// 		){
					// 			// Do something about multi-rooms.
					// 		};
					// 		// Assume plains only. TODO detect swamps & roads.
					// 		if(distance>path.length){ distance=path.length; };
					// 	};
					// 	Memory.taps[squad.tap].distance = distance;
					// };
				};
				{  // .options
					uniq.options = [
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
				this.uniq = uniq;
			};
		}
		mine_pulse(){
			{  // .perf
				this.uniq.perf={
					theory: {},
					partice: {},
					tmp: {},
				};
			};
			{  // .wish
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
		}
		mine_tick(){
			for(let i in [] /*squad.creeps*/){
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
		}

	// Upgr

		upgr_init(){
			var id = this.id;
			if(!this.name){
				this.name = "upgr_"+gobi(id).pos.roomName+"-"+gobi(id).pos.x+"-"+gobi(id).pos.y;
			};
		}
		upgr_pulse(){
		}
		upgr_tick(){
		}

};
