# Agents

Player just is. Permanent.
- aim: Maximize **Expected Future CP** under *GCL*, *CPU* and *memory* constraints
- scope: Game
- properties: *personality* set by user
- owns: *GCL*, *Memory*
- produces: *CPU*
- rents: nothing
- wants: *control points*
- manages: *strategy* (Marshal), *diplomacy* (Diplomat), *metrics* (Bureaucrat)

Room is every Room that Player has inspected. Semi-Permanent, until Player flushes memory of it.
- aim: Maximize **Expected Future Excess Resources** under strategical constraints
- scope: Room
- properties: *terrain*
- owns: *controller*, *energy source*, (*mineral source*)
- produces: any of [*capital*, *creeps*, *security*, *logistics*, *mineral YZ*, *threat*]
- rents: *Memory*, any of (*GCL*)
- wants: *CPU*, *security*, any of [*logistics*, *mineral XYZ*]
- manages: *intrastructure*, *macroManagement*

Squad is a collection of screep for a specialized task. Transient together with task.
- aim: Maximize **probability** and **cost-efficiency** of task under *task details* constraints
- scope: Task
- properties: *details*, *drop-of-point*
- owns: nothing
- produces: any of [*energy*, *logistics*, *security*, *threat*, *mineral X*]
- rents: *Memory*, *capital*, any of [*controller*, *energy source*, *mineral source*]
- wants: *CPU*, *creeps*, any of [*energy*, *security*]
- manages: *microManagement*

Bazaar is an abstract place to conduct national trade. Permanent. (for foreign trade is Market)
- aim: Maximize **added value** for available offers
- scope: Resource
- owns: nothing
- produces: nothing, but takes fees
- rents: *Memory*
- wants: *CPU*, *logistics*
- manages: offers, orders

Player just is.
Bazaar just is per each resource.
Room is when Player gets visibility to a new Room. And ceases when Player flushes it.
Squad can be created or deleted by anyone.



## Room = City

### **type** is determined by room controller (RC)

- *unexplored*: haven't been in Room yet.
- *wild*: no RC
- *farm*: level 0
- *hamlet*: level 1 (spawn)
- *village*: level 2-3 (ramparts & walls)
- *town*: level 4-5 (storage)
- *city*: level 6-7 (extractor & terminal)
- *metropolis*: level 8 (power, observer & nuke)


## Strategy

### decisions
- value of GCL subsidy
- value of long term variable
- value of risk tolerance variable
- room inhabitation or occupation
- diplomacy

### operations
- city placement
- power hunting
- foreign mining
- rob and plunder
- raid and siege
- diplomacy

## Tactics

### decisions
- infrastructure placement
- RCL subsidy
- reserves level
- security level

### operations
- spawning
- logistics
- labs
- trade

## Concepts

### Free market (supply and demand)

PV of perpetuity

> *Bootstrap example*: we have 1 spawn in a room with controller, 2 sources, 3 exits and 1 mineral. That creates bunch of squads: miner, logistics, builder, deff, scout, upgr. Upgr wont spawn as noone is requesting upgrade. Scout and deff wont spawn as IRR is too high to consider anyone beyond room. Builder won't spawn as noone is requesting buildings. Miner wont spawn as it first requests existing logistics. Transport will spawn because logistics requests it, and the cheapest transport will be spawned as there are nothing to transport and thus cheapest is as good as the most expensive. Next will spawn miner taking the most expensive creep it can with existing energy as there is a difference.

Credits are zero-sum.
1 credit = 1 energy now and here.
Exclusive lender is Player.



## Sprint

make first miner&trans&upgr up and running
- miner
- trans
	- city.logistics
- upgr
- free market



colony
- offensive


city


squad

