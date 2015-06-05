module.exports = function(creep) {
//////////////////////////////////
if(creep.pos.getRangeTo(Game.getObjectById(Memory.creeps[creep.name].target.id)) > 1) {
	creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
} else {
	creep.upgradeController(Game.getObjectById(Memory.creeps[creep.name].target.id));
};
//////////////////////////////////
};
