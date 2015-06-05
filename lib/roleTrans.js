module.exports = function(creep) {
//////////////////////////////////
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
		if(Game.spawns.SpawnVXRBP.energy<Game.spawns.SpawnVXRBP.energyCapacity) {
			Memory.creeps[creep.name].target = Game.spawns.SpawnVXRBP;
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
//////////////////////////////////
};
