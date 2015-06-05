module.exports = function(room) {
/////////////////////////////////
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
/////////////////////////////////
};