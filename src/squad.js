"use strict";

var MEM = 'squads';

var cache = new Map();
var squadTypes = {};

var Squad = class Squad {
	constructor(opts){
		if(opts.common.type == undefined) throw Error('Undefined type, like real undefined');
		if(opts.common.type == 'undefined') throw Error('Undefined type, like string "undefined"');
		if(!opts.common.type in squadTypes) throw Error('Unknown type: '+opts.common.type);

		this.common = {
			type: opts.common.type,
			id: opts.common.id,
			name: opts.common.name || opts.id,
			state: opts.common.state || 'Idle',
		};

		this.creeps = opts.creeps || [];

		this.uniq = opts.uniq || {};

		Memory[MEM][this.common.name] = {
			common: this.common,
			creeps: this.creeps,
			uniq: this.uniq,
		};

		for(let key in this.common) this[key] = this.common[key];

		cache.set(this.common.name, this);
	};
};

squadTypes.recache = function recache(){
	cache = new Map();
	Object.keys(Memory[MEM]).forEach( name=>cache.set(name, this.recreate(Memory[MEM][name])) );
	return cache;
};

squadTypes.recreate = function recreate(opts){
	return new this[opts.common.type](opts);
};

squadTypes.mine = class Mine extends Squad {
	constructor(opts){
		opts = opts || {common:{},screeps:[],uniq:{}};
		if(opts.name && cache.has(opts.name)) return cache.get(opts.name);

		// TODO: validation

		opts.common.type = 'mine';
		var id = opts.common.id;
		opts.common.name = "mine_"+gobi(id).pos.roomName+"-"+gobi(id).pos.x+"-"+gobi(id).pos.y;
		super(opts);

		this.uniq.source       = this._initSource(opts);
		this.uniq.lair         = this._initLair(opts);
		this.uniq.fort         = this._initFort(opts);
		this.uniq.spots        = this._initSpots(opts);
		this.uniq.tap          = this._initTap(opts);
		this.uniq.buildOptions = this._initBuildOptions(opts);

	}

	_initSource(){
		return { pos: posify(gobi(this.id).pos) };
	}

	_initLair(){
		let lair = gobi(this.id).pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }})[0];
		if(lair){
			return lair;
		}else{
			return null;
		};
	}

	_initFort(){
		if(!this.lair) return null;

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
		return {
			id: structure||null,
			pos: path[path.length-1-1]
		};
	}

	_initSpots(){
		let spots = [];
		// Search all spots next to source.
		for(let dx=-1;dx<=1;dx++){
			for(let dy=-1;dy<=1;dy++){
				let source = this.uniq.source;
				spots.push( new RoomPosition(source.pos.x+dx,source.pos.y+dy,source.pos.roomName) );
				let objs = Game.rooms[source.pos.roomName].lookAt(spots[spots.length-1]);
				objs.forEach( obj=>{ if(obj.type == 'terrain' && obj.terrain == 'wall'){spots.pop()}; });
			};
		};
		return spots;
	}

	_initTap(){
		let taps = [];
		let highscore = 0;
		this.uniq.spots.forEach( spotPos=>{
			let tap = {pos: spotPos, score: 0};
			for(let k in this.uniq.spots){
				let dist = tap.pos.findPathTo(this.uniq.spots[k]).length;
				if(dist == 1) tap.score++;
			};
			taps.push(tap);
			if(tap.score > highscore) highscore = tap.score;
		});
		taps.filter( tap=>tap.score==highscore );
		// TODO choose closest tap, not random first tap.
		return taps[0].pos;

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
	}

	_initBuildOptions(){
		return [
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
	}

	pulse(){
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

	tick(){
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
};

squadTypes.upgr = class Upgr extends Squad {
	constructor(opts){
		opts = opts || {common:{},screeps:[],uniq:{}};
		if(opts.name && cache.has(opts.name)) return cache.get(opts.name);

		// TODO: validation

		opts.common.type = 'upgr';
		opts.common.name = 'upgr_'+gobi(opts.common.id).pos.roomName;
		super(opts);

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

module.exports = squadTypes;
