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

1. The Colony priority tasks
2. (each) Spawn priority tasks
3. (each) Squad tasks in type order AND their creeps tasks
4. (each) Spawn normal tasks
5. The Colony normal tasks
6. (if any) deffered tasks given by any entity

#### Entities

* The Colony (army)
* Spawns (logistics)
* Squads (local tasks)
* creeps (within any of three above)

## The Colony

Colony has mapped nearby room for their tactical usefulness and best locations for deff squads. According to their placement territory is divided into zones, and each zone has either state

* safe zone - it is behind walls
* dang(erous) zone - it is between walls and enemy
* hostile zone - it is in reach of enemy

Also Colony maps rooms for their income potential and best spawn placement, thus prioritizing which room to conquer next.

## Spawns

Spawn is coordinating all logistics within a room and in nearby neutral rooms, as well construction, links, road management and creep spawning.

#### Signup spawning

Every squad knows when creeps within them have to be replaced, thus signup at spawn to spawn it in some time in future. Spawns are not allowed to cancel signups but according to priorities it can move them around if two signed at the same time.

#### Logistics (Transportation) - pipe system

Logistics are done by CCMM creeps that act as pipes. From positive pipes they such energy until full, and if next pipe come, it takes energy from the first element in pipe, and moves away before it. Thus first pipe acts as a buffer in the same time. And if there are a lot of pipes, then they will naturally form a pipe.

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

* id - number, ID number
* tap - location, place where logistics are supposed to place or take energy
* creeps - array, a list of creep IDs.
* perf - object, performance ratios
* uniq - object, unique to each type