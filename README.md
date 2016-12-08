## Intro

At this moment all ideas ar work in progress and master contains quickfix-style scripts for creeps to be able to work for GCL.

> Check out `legacy` branch for simple code that runs a room on 3.50 CPU/tick.

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

	```bash
	alias gitfix='git commit --all --amend --no-edit; git push -f'
	```

6. Pull request to any of `feature-*` branches, to `develop`, or to next `release-*` branch
	- Use tab for indents, LF line endings, 120char line length
	- To make a new branch repeat steps 2.-4
	- Please use 50/72 commit messages http://stackoverflow.com/questions/2290016/git-commit-messages-50-72-formatting
	- For big picture here's branching model http://nvie.com/posts/a-successful-git-branching-model/
	- Also good in general http://www.kmoser.com/articles/Good_Programming_Practices.php

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


#### Debug snippets

Armagaddeon: `var t = Memory.creeps; for(i in Memory){ Memory[i] = undefined; }; Memory.creeps=t;`

#### Notes on performance

API calls:

```js
// Every line starts with "var t=Game.getUsedCpu(); for(i=0;i<100;i++){ ", ends with "}; console.log(Game.getUsedCpu()-t);" and is entered into console.
Game.rooms.W4N5.lookAt(25,41); // 100-120 CPU
Game.rooms.W4N5.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_SPAWN }}); // 2.0-6.5 CPU
Game.rooms.W4N5.find(FIND_DROPPED_ENERGY); // 1.5-5.5 CPU
Game.spawns["Spawn1"]; // 0.2-0.35 CPU
Game.getObjectById("557293f459189a99084ffa68"); // 0.2-0.35 CPU
test = new RoomPosition(1,1,'W8N4'); // 0.37-0.40
```

Javascript itself:

```js
var t=Game.getUsedCpu(); var test="kuku"; for(i=0;i<1000;i++){ test=test||"blah" }; console.log(Game.getUsedCpu()-t); // 2.5-3.0, all types
var t=Game.getUsedCpu(); var test="kuku"; for(i=0;i<1000;i++){ if(!test){test="blah"}; }; console.log(Game.getUsedCpu()-t); // 1.5-2.0, all types
```


##                                  Concepts

Code consists of multiple tighly integrated modules. For module specific documentation see `doc/<module>.md`. Beware that `main.js` is automatically built using gulp to incoporate list of modules and bypass `require` of them.

### Modularity

Code consists of multiple modules that communicate to each other directly via object methods (according to globally defined API) and indirectly via Memory (according to global data model). Internal logic of module can be interchanged without global problems, thus multiple alternative modules are supported and encouraged. When modules are hierarchical, the parent also tracks and measures performance of childs. If child behaves badly then parent may decide to change its logic to alternative module. Every module with "Squad" in it actually may control a creep, others don't. First and second level or hierarchy are "virtual" in a sense that they directly interact only with other modules and memory. The list of modules are as follows:
- Launcher
- Economy
- Utilities
- ADIS
- Player
	- Diplomat
		- Ambassador (per player)
			- Squad:Consul (per task)
	- Marshal
		- Major (per war)
			- Squad:Captain (per task)
	- Executive
		- Squad:Escrow
		- Governor (per Room)
			- Squad:Miner (per source)
			- Squad:Militia (per gate)
			- Squad:Extractor
			- Squad:Police
			- Squad:Builder
			- Squad:Logistics
			- Spawner
			- Storage

Naming convention (everyone ending with `.js`): `*_launcher`, `*_economy`, `*_utilities`, `*_adis`, `*_player`, `*_diplomat`, `*_ambassador`, `*_marshal`, `*_major`, `*_executive`, `*_governor`, `*_spawner`, `*_storage`, `*_squadConsul`, `*_squadCaptain`, `*_squadMiner`, `*_squadMilita`, `*_squadExtractor`, `*_squadPolice`, `*_squadBuilder`, `*_squadLogistics`.

#### Launcher

Scans folder for modules and requires them, caches objects or rebuids from memory, and executes modules.

#### Economy

Provides `Agent` class and `bazaar*` objects. `Agent` is class from which every economic player inherits that handles all transactions, accounting and metrics. `bazaar*` are objects that represent various internal markets for energy, creeps, etc. Everyone that inherits from `Agent` interacts with each other through one or more `bazaar*`.

#### Utilities

Miscellaneous stuff used globally, for example logger.

#### ADIS

The *Automatic Debugging & Isolation System* is used globally. It contains various routines that's main goal is to prevent coma as gracefully as possible.

#### Player

It is you! It also is an `Agent`.
- owns: *GCL*, *Memory*
- produces: *CPU*
- rents: nothing
- wants: *control points*

#### Diplomat & Ambassadors

They deal with allies, manual trade, communication and other diplomatic stuff. To be developed a lot later.

#### Marshal & Majors

They deal with war, mostly offence and perhaps also strategic defense. To be developed later.

#### Executive & Governors

They deal with production and defense. Developing now.


Executive has mapped nearby room for their tactical usefulness and best locations for deff squads. According to their placement territory is divided into zones, and each zone has either state

- safe zone - it is behind walls
- dang(erous) zone - it is between walls and enemy
- hostile zone - it is in reach of enemy

Also Executive polls governor opinions about other rooms for their income potential and best spawn placement, thus prioritizing which room to take next.

Every room has a Governor. Governors plan structure layout, caches "paths", trade, supply other governors.


###                                 API & Memory Data Model

There is API and Memory data Model for each pair up & down the hierarchy, e.g. Executive to Governor. Also, globally API is present from each Agent to modules `economy`, `utilities` and `adis`.
