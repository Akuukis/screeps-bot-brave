"use strict";

var helper = require('./helpers');

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

	pulse(){
		var self = this;
		{  // .perf
			this.uniq.perf={
				theory: {},
				partice: {},
				tmp: {},
			};
		};

		{  // Ask
			var orderId = this.common.id+'_creeps';

			// What would I buy instant or later?
			var ticksToLive = this.creeps.reduce( (array,creep)=>array.push(creep.ticksToLive), [0] )
			var countWorkParts = ticksToLive.map(t=>{
					return self.creeps.reduce( (sum,creep)=>{
							return sum + (creep.ticksToLive>t ? creep.body.reduce( (s,part)=>part==WORK?s+1:s, 0) : 0 )
						}, 0);
				})

			// Update orders
			Game.bazaars.creep.rmOfferId(orderId);
			for(let i in ticksToLive){
				for(let j=1; j<=5-countWorkParts[i]; j++){
					let body = {M:1,W:j};
					Game.bazaars.creep.addOffer({
							'id': orderId,
							'owner': this.common.id,
							'time': Game.time+ticksToLive[i],
							'credits': helper.annuity(j*HARVEST_POWER, CREEP_LIFE_TIME),
							'amount': helper.bodyCost(body),
							'details': {
								'costTick': j*HARVEST_POWER,
								'body': body,
								'duration': helper.bodyDuration(body),
								'pos': self.uniq.tap,
							},
						});
				};
			};
		};
	}

	tick(){
		for(let i of this.creeps){
			var creep = gobi(i);
			var ram = this.creeps[i];
			routine(creep);
			if(!creep){
				// He has died.
			}else if(ram.role == "miner" || ram.role == "miner2"){

				if(!ram.pos) ram.pos = ram.role=="miner" ? this.uniq.spots[0] : this.uniq.spots[1];
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
				}else{
					creep.harvest(gobi(id));
				};

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

	pulse(){
	}

	tick(){
	}
};

module.exports = squadTypes;
