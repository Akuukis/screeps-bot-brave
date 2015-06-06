## Global concepts

#### Goal

Maximize GCL upgrade rate under _GCL_, _CPU_ and _memory_ constraints by means of

1. Increasing total energy extraction rate
2. Defending infrastructure and "safe territory"
3. Escorting unsafe sources
4. Optimizing defense costs
5. Optimizing maintaince costs
6. Optimizing logistics costs
7. Scouting new sources
8. Harrasing nearby enemies
9. Expanding to profitable rooms

#### Policy

1. No hardcoded places, rates, targets, etc.
2. Same code for small, big and emergency situations.
3. Behavior is error, memory corruption and exception case safe.
4. Swarm intelegence.
5. Prioritized / flexible CPU load.
6. Global parameters
	1. `pulse` is for cyclic recalculations to lower CPU load
  2. `t` is length of timespan (1=emergency,1000=longterm) the colony is in, for decision making
	3. `threat` is the global militarization level
7. Code max 120 width, tabbed, camelCase, prefer aligned, optional spacing.

#### Main loop

Main loops doesn't cycle through creeps. Here's the order:

1. Global defines
2. (if error) Sanity checks
3. The Colony priority tasks
4. (each) Spawn priority tasks
5. (each) Squad tasks in type order AND their creeps tasks
6. (each) Spawn normal tasks
7. The Colony normal tasks
8. (if any) deffered tasks given by any entity

#### Entities

* The Colony (army)
* Cities (logistics)
* Squads (local tasks)
* creeps (within any of three above)

## The Colony

Colony has mapped nearby room for their tactical usefulness and best locations for deff squads. According to their placement territory is divided into zones, and each zone has either state

* safe zone - it is behind walls
* dang(erous) zone - it is between walls and enemy
* hostile zone - it is in reach of enemy

Also Colony maps rooms for their income potential and best spawn placement, thus prioritizing which room to conquer next.

## Cities

Every room has a city. City includes all spawns within it and coordinates all logistics within a room and in nearby neutral rooms, as well construction, links, road management and creep spawning. Cities trade and/or supply other cities.

#### Signup spawning

Every squad knows when creeps within them have to be replaced, thus signup at city to spawn it in some time in future. Spawns are not allowed to cancel signups but according to priorities it can move them around if two signed at the same time.

#### Logistics (Transportation) - pipe system

Logistics are done by CCMM creeps that act as pipes. From positive pipes they such energy until full, and if next pipe come, it takes energy from the first element in pipe, and moves away before it. Thus first pipe acts as a buffer in the same time. And if there are a lot of pipes, then they will naturally form a pipe.

Taps

````js
Memory.taps[uid] = {
	pos: pos, // place where logistics are supposed to place or take energy.
	away: 0, // Distance from tap to the nearest owned room. away=0 if it is in owned room.
};
````

## Squads

Squads is a single entity with a given goal. Squad may temporarly have no creeps, but eventually will have at least one. Squad is responsible for creep lifecycle management and request replacement from Spawns. Squad performance is measured. Squad is scalable and flexible and the only difference of predefined squads is their aim. Main loop does not cycle through

#### Types

* upgr - Controller upgrader squad (may be single creep)
* mine - Miner squad (including anti-keeper fighters)
* deff - defenders blocking a narror place between walls, including ramparts, repairers and contructed walls
* patr - patrol for fast reaction to enemies within safe territory
* offn - attacking unit meant for serious engagement and mostly room conquest
* esco - escort logistic chain to/from unsafe mine
* scot - scouting unit that also harass defenseless enemies

#### Properties

````js
Memory.squads[id] = { // id is string, uid of target source.
	tap: "", // uid of owned tap.
	state: "", // name of squad scope state. Every type has at least "idle" and "normal" states.
	options: [ // list of possible sets of creeps with their performance ratios.
		{
			e:0, // Required number of extensions for the option.
			c:[], // Set of creeps.
			mass:[], // Set of sum of all body parts.
			cost:0, // Total cost of all body parts.
			uniq: {}, // unique to each type.
		},
	],
	wish: {}, // Current best option that squad will signup for.
	creeps: [], // a list of creep IDs.
	perf: {}, // performance ratios.
	uniq: {}, // unique to each type.
}
````

#### Creep-level decisionmaking

The only thing creeps think on their own is safety. Safe means when there is no threat that can be checked by iterating through functions by

````js
// creep is the object of himself
var threat = true;
for(t in Memory.threats){
	var safe = threatsFunction[Memory.threats[t].id](creep.pos,Memory.threats[t].data);
	if( safe && safe < threat ){ threat = safe; };
};
if( threat===true ){
	console.log("I am safe until walls break down.");
}else if( threat ){
	console.log("I am safe at minimum " + threat + " more ticks.");
};
````

#### Squad: *mine*

````js
Memory.squads[id].uniq = {
	lair: boolean, // True if source is guarded/blocked by Source Keeper.
	spots: [], // List of filtered max 3 pos next to source.
}
````

## Notes on performance

````js
// Every line starts with "var t=Game.getUsedCpu(); for(i=0;i<100;i++){ ", ends with "}; console.log(Game.getUsedCpu()-t);" and is entered into console.
Game.rooms.W4N5.lookAt(25,41); // 100-120 CPU
Game.rooms.W4N5.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_SPAWN }}); // 2.0-6.5 CPU
Game.rooms.W4N5.find(FIND_DROPPED_ENERGY); // 1.5-5.5 CPU
Game.spawns["Spawn1"]; // 0.2-0.35 CPU
Game.getObjectById("557293f459189a99084ffa68"); // 0.2-0.35 CPU
````
