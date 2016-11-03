"use strict";

var DTask = require('./dtask');

module.exports = class Colony {

	constructor(name){
		this.name = name;
	}

	pulse(){
		Memory.pulse = (Memory.pulse||1) - 1;
		if(Memory.pulse<=0){ // Pulse.
			Memory.pulse = 10;
		};
		return Memory.pulse==9;
	}

	// Make overlay for each unexplored room.
	overlay(id){
		var room = Game.rooms[id];
		if(room.controller && room.controller.my && !Memory.cities[room.name]){ Memory.cities[room.name]={}; };
		if(!Memory.rooms[room.name]){ Memory.rooms[room.name]={}; };
		if(!Memory.rooms[room.name].threats){ new DTask({fn:'overlayThreats("' +room.name+'")'}); };
		if(!Memory.rooms[room.name].deff   ){ new DTask({fn:'overlayDeff("'    +room.name+'")'}); };
		if(!Memory.rooms[room.name].network){ new DTask({fn:'overlayNetwork("' +room.name+'")'}); }; // Including POIs
		if(!Memory.rooms[room.name].city   ){ new DTask({fn:'overlayCity("'    +room.name+'")'}); };
		if(!Memory.rooms[room.name].rating ){ new DTask({fn:'calcRating("'     +room.name+'")'}); };
		if(!Memory.rooms[room.name].finish ){ new DTask({fn:'calcFinish("'     +room.name+'")'}); };
	}

	// Distribute spawning demands to spawns.
	distribute(id){
		var demand = Memory.demand[id];
		var pos = new posify(demand.pos);
		var fat = demand.fat;
		var cost = demand.cost;
		var fatigue = demand.fatigue;
		var at = Math.floor( demand.at/3 );
		console.log(">demand>"," id:",id," pos:",pos," fat:",fat," cost:",cost," fatigue:",fatigue," at:",at);
		var best = {score:false,spawn:false,moment:false};
		var count = 0;
		for(var c in Memory.cities){
			for(var s in Memory.cities[c].spawns){
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
						for(var q=moment;q<moment+fat;q++){
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
	}

	// Take care of transits.
	transits(){
		for(var name in Game.creeps){
			var creep = Game.creeps[name];
			if(Memory.creeps[name].role=="transit"){ /* TODO */ };
		};
	}

};
