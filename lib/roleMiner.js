module.exports = function(creep) {
//////////////////////////////////
if(creep.pos.getRangeTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos) > 1) {
	creep.moveTo(Game.getObjectById(Memory.creeps[creep.name].target.id).pos);
} else {
	creep.harvest(Game.getObjectById(Memory.creeps[creep.name].target.id));
};
//////////////////////////////////
};