## Intro

At this moment all ideas ar work in progress and master contains quickfix-style scripts for creeps to be able to work for GCL.

##                                 Vision

- **Is fun to own and watch.** It reports what it does so user can be aware of otherwise invisible decisions and actions. Users can modify few memory variables to turn on/off whatever he want to focus on.
- **Is conceptually effective.** It runs on ideas like decentralization, self-reflection, demand-supply market and more to come.
- **Is social.** It allies with other colonies that has the same script, cooperates with them economically and make joint military campaigns.
- **Is error-prone.** Nothing in world should surprise AI except API patches. And if user messed up with Memory it may detect and solve it, or go crazy, give funny warnings and eventually deal with it. AI shall never throw the same error twice.
- **Is CPU and RAM efficient.** It does things as caching, heuristics, function prioritizing and deferred tasks across ticks. The technical stuff under-the-hood has to be good also.
- **Is scalable.** It has the same code and works as well as just spawned or managing 10 rooms.
- **Is understandable.** Has good documentation, clear code, meaningful variable names, to-the-point comments and etc. Devs and to-be-devs are here not onlyu to have fun, but also to learn something. So let's make it easy and fun, too.

##                                 Roadmap

Currently I am only putting down to text and testing all ideas. Code mismatch with documentation in most parts, and there are several obsolete and broken parts. Also code contains unrelated basic logic to survive and make testing easier. I expect to move to organized developing somewhat soon, feel free to jump in to discuss concepts through issues or email.

1. Put down concepts into notes and probably test them (focus on *conceptual effectiveness*)
2. Make-it-work not to die off on its own (focus on *scalability*)
3. Make-it-work using infrastructure (focus on *scalability*)
4. Make-it-work defending (focus on *scalability*)
5. Make-it-work scouting & expanding (focus on *scalability*)
6. Make-it-work aggression & conquering (focus on *scalability*)
7. Make-it-work diplomacy (focus on *scalability*)
8. Rewrite notes into documentation and inline comments (focus on *understandable*)
9. Review & improve concepts (focus on *conceptual effectiveness*)
10. Make-it-work anything new (focus on *scalability*)
11. Improvements & make-it-work Adis - Automatic Debugging & Isolation System (focus on *error-prone*)
12. Improvements & make-it-work MUI - Memory based User Interface (focus on *fun*)
13. Improvements and finish 100% expected functionality (focus on *CPU and RAM efficiency*)
14. Together build wonder worth 161.8mil energy in public server (focus on *fun*)

##                                 How to participate

#### To use or test

1. Fork
2. Make sure default branch is `master`. That's in Github settings just under repository name
3. It should work out-of-box (content of **master** branch). If not, report an issue

#### To participate

1. Fork
2. Change default branch to `develop`. That's in Github settings just under repository name
3. It should work and not throw basic errors but use with caution
4. To trigger screeps.com to repull your code from default branch commit on any branch
5. Test & play around
	- To try out new code in 3 seconds, you can add alias in `~/.bash_profile` file

	````bash
	alias gitfix='git commit --all --amend --no-edit; git push -f'`.
	````

6. Pull request to any of `feature-*` branches, to `develop`, or to next `release-*` branch
	- Use tab for indents, LF line endings, 120char line length
	- To make a new branch repeat steps 2.-4
	- Please use 50/72 commit messages http://stackoverflow.com/questions/2290016/git-commit-messages-50-72-formatting
	- For big picture here's branching model http://nvie.com/posts/a-successful-git-branching-model/
	- Also good in general http://www.kmoser.com/articles/Good_Programming_Practices.php

##                                  Concepts

#### Entities

1. Real entities are provied by API but only if visible.
	- `Game.rooms[name]` is iterated to detect unscouted rooms and to update cached rooms
	- `Game.spawns[name]` is not iterated but called directly by `Game.getObjectById()`
	- `Game.screeps[name]` is not iterated but called directly by `Game.getObjectById()`
2. Virtual entities are constructed and memorized by AI and their performance are measured
	- `Memory.spawns[name]` are constructed from `Game.spawns[name]`.
		- Goal: Minimize creep replacement costs per overhead
		- Processes order queue
		- Dispatches spawned creeps
	- `Memory.squads[id]` are sets of creeps for a specific goal.
		-	Goal: [specific to squad type]
		- Decides for creep actions
		- Decides for demand of replacing creeps
	- `Memory.cities[name]` are captured rooms + its surrounding uncaptured "farm" rooms
		- Goal: maximize ROI (return per investment over specific period of time)
		- Contains extra overlays that builds upon `Memory.rooms[name]`
		- Stores energy (central storage is fat tail to central spawn)
		- Decides for logistics
		- Decides for energy allocation
			- invest in infrastructure
			- upgrade controller
			- loan to other city
	- `Memory.colony` is the global entity
		- Goal: maximize expected GCL after epoch
		- Contains supra-room overlays
		- Decides for demand and supply matching
		- Decides to evaluate enemy threat level
		- Decides for global economical parameters as required ROI, militariness, length of epoch, etc.
		- Decides for conquest investments
3. Cache
	- `Memory.taps[id/name]` are logistical nodes with pos and statistics. Every other entity has exatly 1 taps and their id/name matches. Not iterated
	- `Memory.threats[id]` are different types of possible worst-case threats. Iterated to detect if pos is safe
	- `Memory.rooms[name]` are cached versions of `Game.rooms[name]` and overlays
	- `Memory.demand[array]` are cached orders from squads & etc to spawn a creep. Iterated to process them
	- `Memory.supply[array]` are processed orders in any of of states: "in queue", "spawning", "dispatching", "ready"
	- `Memory.paths[id-id]` are cached paths between taps that are used for navigation and logistics. Uses concept of rightside 2 directional roads
	- `Memory.zones[id]` are cached logical subsets of room that are used for defence planning
	- `Memory.deferred[array]` is array that holds all deferred tasks. Iterated to process them

#### Controllers, Sources and Lairs breakdown

````javascript
Memory.controllers = {
	<controllerId>: {
		pos: RoomPosition,
		spots: 8, // walkable spots next to source.
	},
	<controllerId>: ... ,
}
````

````javascript
Memory.sources = {
	<sourceId>: {
		pos: RoomPosition,
		spots: 8, // walkable spots next to source.
	},
	<sourceId>: ... ,
}
````

````javascript
Memory.lairs = {
	<lairId>: {
		pos: RoomPosition,
		spots: 8, // walkable spots next to source.
	},
	<lair2Id>: ... ,
}
````

#### Rooms breakdown

````javascript
{
	decorated: true || false, // whenever room is decorated or clean of flags for recalculation.
	controller: [ <controllerId> ],
	sources: [ <sourceId>, ... ],
	lairs: [ <lairId>, ... ],
	egroups: [ // Array of isolated exits
		[ RoomPosition, ... ], // Array of all positions of the exit
		...,
	],
	taps: [ <tapName>, ... ], // All nodes within room
}

````

#### Decentralized decision-making

If any on entities die, disappear or have corrupted memory it doesn't impact other entity.

#### Goal

Maximize GCL upgrade rate under *GCL*, *CPU* and *memory* constraints by means of

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
7. The Colony normal tasks (signup distribution)
6. (each) Spawn normal tasks
8. (if any) deffered tasks given by any entity

#### Entities

- The Colony (army)
- Cities (logistics)
- Squads (local tasks)
- creeps (within any of three above)

##                                  The Colony

Colony has mapped nearby room for their tactical usefulness and best locations for deff squads. According to their placement territory is divided into zones, and each zone has either state

- safe zone - it is behind walls
- dang(erous) zone - it is between walls and enemy
- hostile zone - it is in reach of enemy

Also Colony maps rooms for their income potential and best spawn placement, thus prioritizing which room to conquer next.

##                                  Cities

Every room has a city. City includes all spawns within it and coordinates all logistics within a room and in nearby neutral rooms, as well construction, links, road management and creep spawning. Cities trade and/or supply other cities.

#### Signup spawning

Every squad knows when creeps within them have to be replaced, thus signup at city to spawn it in some time in future. Spawns are not allowed to cancel signups but according to priorities it can move them around if two signed at the same time.

##                                  Logistics (Transportation) - pipe system

**Logistics** are done by CCMM creeps that act as pipes. From positive pipes they pull energy until full, and if next pipe come, it takes energy from the first element in pipe, and moves away before it. Thus first pipe acts as a buffer storage in the same time. And if there are a lot of pipes, then they will naturally form a static pipe.

**Saturation** is the key element in tap system. All pipe transport system sole goal is to distribute saturation evenly thus picking up energy from oversaturated taps and bringing energy to udersaturated taps starting with the most extreme ones. Saturation is calculated relative to connection that includes all taps and pipes connected through it. If there is a cycle (or any other complex form) then only the connection on shortest path to the tap or pipe will include them. Inside room taps and pipes is used, outside of room only subnetworks is used. Formula is as follows: `saturation = (energy + rate*distance) / (energyCapacity + 1)`.

#### Paths

Every path between taps (see below) is precalculated and cached, as well all non-standard paths longer than 3 steps.

````javascript
Memory.paths = {
	<pathName:roomName-x-y_roomName-x-y>:
		bump: 123456789, // Last Game.time() when used. TODO: If low memory, old paths will be purged.
		path: [ // positions are in alphabetical order
			{ x:<x>, y: <y>, dir: <direction> }, // steps goes from first to second including both ends
			... ,
		],
	... ,
}
````

#### Network & Subnetworks & Taps

Network is collection of all valid taps. For better performance taps are organized in subnetworks that has summed up values and outgoing connections of all taps and pipes within that room.

````javascript
Memory.taps = {
	<tapName:roomName-x-y>: { // or roomName only for roomTaps
		pos: RoomPosition, // or roomName for roomTaps
		inherit: {
			target: <creepId> || false, // false if need to pickup/drop energy.
			rate: +1, // expected rate of energy production/consumption per tick.
			storage: 50,
		},
		connections: [
			{
				path: <pathName>, // from connected tap to this tap.
				tap: <tapName>,
				saturation: 0.89, // see above
				updated: Game.time(), // timestamp of when saturation was calculated.
			},
			... ,
		],
````

````javascript
Memory.subnetworks = {
	<subnetworks:roomName>: {
	roomName: RoomPosition.roomName,
	inherit: /* the same as Memory.taps.inherit */,
	connections: /* the same as Memory.taps.connections but with other subnetworks */,
}
````

````javascript
Memory.network = {
	/* TODO: overall properties */
}
````

##                                  Squads

Squads is a single entity with a given goal. Squad may temporarly have no creeps, but eventually will have at least one. Squad is responsible for creep lifecycle management and request replacement from Spawns. Squad performance is measured. Squad is scalable and flexible and the only difference of predefined squads is their aim. Main loop does not cycle through

#### Types

1. Descriptions
	- mine: Miner squad (including anti-keeper fighters)
	- upgr: Controller upgrader squad (may be single creep)
	- zoos: "Zoo for keeper" by maintaining keeper blocked, occupied or killed
	- deff: defenders blocking a narror place between walls, including ramparts, repairers and contructed walls
	- scot: scouting unit that also harass defenseless enemies
	- guer: targets undefended or underdefended enemy creeps and structures
	- offn: attacking unit meant for serious engagement and sure room conquest
2. Goals (to be measured per cost-rate)
	- mine: maximize energy gather rate from given source
	- upgr: maximize upgrade rate
	- zoos: remove source keeper threat
	- deff: remove player threat for given zone(s)
	- scot: minimize costs for deff squad + grant vision
	- guer: maximize (real and potential) enemy costs
	- offn: conquer room

#### Properties

````javascript
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

````javascript
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

````javascript
Memory.squads[id].uniq = {
	lair: boolean, // True if source is guarded/blocked by Source Keeper.
	spots: [], // List of filtered max 3 pos next to source.
}
````

##                                  Debug snippets

Armagaddeon: `var t = Memory.creeps; for(i in Memory){ Memory[i] = undefined; }; Memory.creeps=t;`

##                                  Notes on performance

API calls:

````javascript
// Every line starts with "var t=Game.getUsedCpu(); for(i=0;i<100;i++){ ", ends with "}; console.log(Game.getUsedCpu()-t);" and is entered into console.
Game.rooms.W4N5.lookAt(25,41); // 100-120 CPU
Game.rooms.W4N5.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_SPAWN }}); // 2.0-6.5 CPU
Game.rooms.W4N5.find(FIND_DROPPED_ENERGY); // 1.5-5.5 CPU
Game.spawns["Spawn1"]; // 0.2-0.35 CPU
Game.getObjectById("557293f459189a99084ffa68"); // 0.2-0.35 CPU
test = new RoomPosition(1,1,'W8N4'); // 0.37-0.40
````

Javascript itself:

````javascript
var t=Game.getUsedCpu(); var test="kuku"; for(i=0;i<1000;i++){ test=test||"blah" }; console.log(Game.getUsedCpu()-t); // 2.5-3.0, all types
var t=Game.getUsedCpu(); var test="kuku"; for(i=0;i<1000;i++){ if(!test){test="blah"}; }; console.log(Game.getUsedCpu()-t); // 1.5-2.0, all types
````

##                                  Notes on objects

http://davidwalsh.name/javascript-objects-deconstruction
