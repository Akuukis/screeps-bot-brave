module.exports = function(creeps) {
	var checkMemory = function(){
		if(Memory.deffered.fn.length!=Memory.deffered.wait.length){ // Check queue.
			Memory.deffered.fn = [];
			Memory.deffered.wait = [];
		};
	};
	var doNext = function(){
		//console.debug(Memory.deffered.fn[0]);
		var ok = eval(Memory.deffered.fn[0]);
		if(ok){
			Memory.deffered.fn.shift();
			Memory.deffered.wait.shift();
		};
	};
	var overlayThreats = function(roomName){
		console.log(roomName,": overlayThreats");
		var lairs = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_KEEPER_LAIR }});
		var threats = {};
		for(var i in lairs){
			var lair = lairs[i];
			var sources = [ posify(lair.pos) ];
			var energy = lair.pos.findClosestByRange(FIND_SOURCES, {ignoreCreeps: true});
			var path = lair.pos.findPathTo(energy, {ignoreCreeps: true});
			for(var j in path){
				var pos = {x: path[j].x, y:path[j].y, roomName:lair.pos.roomName};
				sources.push(pos);
			};
			sources.pop(); // Discard tile of Source itself.
			threats[lairs[i].id] = {
				id: "lair",
				data: {
					lairId: lairs[i].id,
					steps: sources,
				}
			};
		};
		Memory.threats = threats;
		Memory.rooms[roomName].threats = threats;
		return true;
	};
	var overlayDeff = function(roomName){
		Memory.rooms[roomName].deff = true;
		return true;
	};
	var overlayNetwork = function(roomName){
		console.log(roomName,": overlayNetwork");
		var room = Game.rooms[roomName];
		var ram = Memory.rooms[roomName];
		if(!Memory.rooms[roomName].clean){
			for(var i in Game.flags){ if(Game.flags[i].room.name==roomName){ Game.flags[i].remove(); }; };
			Memory.rooms[roomName].clean = true;
		};
		if(!room){ return false; }; // Room not anymore in vision.
		// Add sources.
		if(!Memory.rooms[roomName].sources){
			var sourcesRaw = Game.rooms[roomName].find(FIND_SOURCES);
			var sources = {};
			for(var s in sourcesRaw){
				var source = {};
				if(sourcesRaw[s].pos.findInRange(FIND_STRUCTURES, 5, {filter: { structureType: STRUCTURE_KEEPER_LAIR }}).length > 0) {
					source.lair = true;
				}else{
					source.lair = false;
				};
				source.pos = sourcesRaw[s].pos;
				source.spots = 0;
				for(var dx=-1;dx<=1;dx++){
					for(var dy=-1;dy<=1;dy++){
						var look = Game.rooms[roomName].lookAt(source.pos.x+dx,source.pos.y+dy,source.pos.roomName);
						var string = "";
						source.spots++;
						look.forEach(function(lookObject){
							string = string + lookObject.type + (lookObject.terrain||"") + " ";
							if(lookObject.type == 'terrain' && lookObject.terrain == 'wall'){ source.spots--;	};
						});
						//if(s==0){ console.log(source.pos.x+dx,source.pos.y+dy," - ",look.length, string); };
					};
				};
				sources[sourcesRaw[s].id] = source;
			};
			Memory.rooms[roomName].sources = sources;
		};
		for(var i in ram.sources){ if(!Memory.squads.mine[i]){ Memory.squads.mine[i]={}; }; };
		// Add controller.
		if(!Memory.rooms[roomName].contr){
			var contr = Game.rooms[roomName].controller;
			if(contr){
				var contrRam = {};
				contrRam[contr.id] = {};
				contrRam[contr.id].pos = contr.pos;
				var spots = [];
				// Search all spots next to source.
				for(var dx=-1;dx<=1;dx++){
					for(var dy=-1;dy<=1;dy++){
						spots.push( new RoomPosition(contr.pos.x+dx,contr.pos.y+dy,contr.pos.roomName) );
						var objs = Game.rooms[contr.pos.roomName].lookAt(spots[spots.length-1]);
						objs.forEach(function(obj){	if(obj.type == 'terrain' && obj.terrain == 'wall'){ spots.pop(); }; });
					};
				};
				contrRam[contr.id].spots = spots;
				Memory.rooms[roomName].contr = contrRam;
			};
		};
		for(var i in Memory.rooms[roomName].contr){ if(!Memory.squads.upgr[i]){ Memory.squads.upgr[i]={}; }; };
		// Add sources + contr to POIs.
		if(!Memory.rooms[roomName].pois){
			Memory.rooms[roomName].pois = [];
			for(var i in Memory.rooms[roomName].sources){ Memory.rooms[roomName].pois.push(Memory.rooms[roomName].sources[i].pos); };
			for(var i in Memory.rooms[roomName].contr){ Memory.rooms[roomName].pois.push(Memory.rooms[roomName].contr[i].pos); };
		};
		// Divide exits into groups.
		if(!Memory.rooms[roomName].egroups){
			console.log("Doing egroups...");
			var exits = room.find(FIND_EXIT);
			var egroups = [];
			var last = room.getPositionAt(25,25);
			for(var i in exits){
				if(exits[i].isNearTo(last)){
					egroups[egroups.length-1].push(exits[i]);
				}else{
					egroups[egroups.length] = [ exits[i] ];
				};
				last = exits[i];
			};
			console.log(egroups.length);
			Memory.rooms[roomName].egroups = egroups;
		};
		// Add important exits. POI->exit & exit->exit
		if(!Memory.rooms[roomName].pe){ Memory.rooms[roomName].pe={}; };
		if(!Memory.rooms[roomName].shortlist){ Memory.rooms[roomName].shortlist={}; };
		for(var i=0;i<Memory.rooms[roomName].pois.length;i++){
			if(!Memory.rooms[roomName].pe[i]){
				console.log("Doing exits from pe["+i+"]...");
				var poiPos = room.getPositionAt(Memory.rooms[roomName].pois[i].x,Memory.rooms[roomName].pois[i].y);
				for(var j=0;j<Memory.rooms[roomName].egroups.length;j++){
					var egroup = Memory.rooms[roomName].egroups[j];
					for(var k=0;k<egroup.length;k++){ egroup[k] = new posify(egroup[k]); };
					console.log(i,j,poiPos,egroup[0],egroup.length);
					var t = poiPos.findClosestByRange(egroup,{ignoreCreeps:true, ignore:[poiPos]});
					if(!Memory.rooms[roomName].shortlist[t.x+"-"+t.y] && !poiPos.isNearTo(t)){
						Memory.rooms[roomName].shortlist[t.x+"-"+t.y] = true;
						Memory.rooms[roomName].pois.push(t);
						room.createFlag(t.x, t.y)
					};
				};
				Memory.rooms[roomName].pe[i] = true;
			};
			if(Game.cpu.getUsed()/Game.cpuLimit>0.8){ return false; };
		};
		// Add paths and convert to tiles.
		if(!Memory.rooms[roomName].paths){ Memory.rooms[roomName].paths={}; };
		if(!Memory.rooms[roomName].tiles){ Memory.rooms[roomName].tiles={}; };
		for(var i=Memory.rooms[roomName].pois.length-1;i>0;i--){
			for(var j=0;j<i;j++){
				var pos1 = posify(Memory.rooms[roomName].pois[i]);
				var pos2 = posify(Memory.rooms[roomName].pois[j]);
				if(!Memory.rooms[roomName].paths[pos1.x+"-"+pos1.y+"^"+pos2.x+"-"+pos2.y]){
					console.log("Doing path from "+pos1.x+"-"+pos1.y+" to "+pos2.x+"-"+pos2.y+"...");
					var path = room.findPath(pos1,pos2,{ignoreCreeps:true, ignore:[pos1,pos2]});
					for(var k in path){
						Memory.rooms[roomName].tiles[path[k].x+"-"+path[k].y] = {x:path[k].x, y:path[k].y};
					};
					Memory.rooms[roomName].tiles[pos1.x+"-"+pos1.y] = {x:pos1.x, y:pos1.y}; // Add back starting point of path.
					console.log(i,j,path.length,pos1,pos2);
					Memory.rooms[roomName].paths[pos1.x+"-"+pos1.y+"^"+pos2.x+"-"+pos2.y] = true;
				};
				if(Game.cpu.getUsed()/Game.cpuLimit>0.8){ return false; };
			};
		};
		// Condense adjanced tiles.
		if(!Memory.rooms[roomName].condensed){ Memory.rooms[roomName].condensed=0; };
		while(Memory.rooms[roomName].condensed < 7){ // Repeat 7 times
			var countLast = 0; for(i in Memory.rooms[roomName].tiles){ if(Memory.rooms[roomName].tiles[i]){ countLast++;}; };
			var action = 0;
			for(var i in Memory.rooms[roomName].tiles){
				if(!Memory.rooms[roomName].tiles[i]){ continue; };
				if(Memory.rooms[roomName].shortlist[i]){ continue; }; // Skip POIs.
				var tile = Memory.rooms[roomName].tiles[i];
				var ul = Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y-1)];
				var um = Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y-1)];
				var ur = Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y-1)];
				var ml = Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y  )];
				var mr = Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y  )];
				var bl = Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y+1)];
				var bm = Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y+1)];
				var br = Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y+1)];
				action++;
				if(      !ul && !um && !ur && !(!bl && !bm && !br) && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
					// Move down!
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Moved down "+tile.x+"-"+tile.y);
				}else if(!bl && !bm && !br && !(!ul && !um && !ur) && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall" ){
					// Move up!
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Moved up "+tile.x+"-"+tile.y);
				}else if(!ul && !ml && !bl && !(!ur && !mr && !br) && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" ){
					// Move right!
					Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Moved right "+tile.x+"-"+tile.y);
				}else if(!ur && !mr && !br && !(!ul && !ml && !bl) && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" ){
					// Move left!
					Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Moved left "+tile.x+"-"+tile.y);
				}else if(!ml && !ul && !um && mr && bm){
					// Integrate down-right!
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Integrated down-right "+tile.x+"-"+tile.y);
				}else if(!mr && !ur && !um && ml && bm){
					// Integrate down-left!
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Integrated down-left "+tile.x+"-"+tile.y);
				}else if(!ml && !bl && !bm && mr && um){
					// Integrate up-right!
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Integrated up-right "+tile.x+"-"+tile.y);
				}else if(!mr && !br && !bm && ml && um){
					// Integrate up-left!
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Integrated up-left "+tile.x+"-"+tile.y);
				}else if(!ml && !ul && !um && ur && br && bl && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
					// expand down-right!
					Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Expanded down-right "+tile.x+"-"+tile.y);
				}else if(!mr && !ur && !um && ul && bl && br && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y+1)!="wall"){
					// expand down-left!
					Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y+1)] = {x:tile.x  , y:tile.y+1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Expanded down-left "+tile.x+"-"+tile.y);
				}else if(!ml && !bl && !bm && ur && br && ul && room.lookForAt("terrain",tile.x+1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall"){
					// expand up-right!
					Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y  )] = {x:tile.x+1, y:tile.y  }
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Expanded up-right "+tile.x+"-"+tile.y);
				}else if(!mr && !br && !bm && ul && bl && ur && room.lookForAt("terrain",tile.x-1,tile.y  )!="wall" && room.lookForAt("terrain",tile.x  ,tile.y-1)!="wall"){
					// expand up-left!
					Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y  )] = {x:tile.x-1, y:tile.y  }
					Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y-1)] = {x:tile.x  , y:tile.y-1}
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Expanded up-left "+tile.x+"-"+tile.y);
				}else if(um && mr && bm && ml){
					// Dissolve!
					Memory.rooms[roomName].tiles[i] = undefined;
					console.log("Integrated up-left "+tile.x+"-"+tile.y);
				}else{
					action--;
				};
			};
			var count = 0; for(var i in Memory.rooms[roomName].tiles){ if(Memory.rooms[roomName].tiles[i]){ count++;}; };
			console.log("Tiles: ",action, count, count - Memory.rooms[roomName].lastTiles);
			if(count - countLast >= -2){
				Memory.rooms[roomName].condensed++;
			}else{
				Memory.rooms[roomName].condensed = 0;
			};
			if(Game.cpu.getUsed()/Game.cpuLimit>0.8){ return false; };
		};
		// Place mid-taps.
		if(!Memory.rooms[roomName].taps){
			Memory.rooms[roomName].taps = {};
			for(var i in Memory.rooms[roomName].tiles){
				if(!Memory.rooms[roomName].tiles[i]){ continue; };
				if(Memory.rooms[roomName].shortlist[i]){ continue; }; // Skip POIs.
				var tile = Memory.rooms[roomName].tiles[i];
				var count = 0;
				if(Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y-1)]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y-1)]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y-1)]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y  )]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y  )]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x-1)+"-"+(tile.y+1)]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x  )+"-"+(tile.y+1)]){ count++; };
				if(Memory.rooms[roomName].tiles[(tile.x+1)+"-"+(tile.y+1)]){ count++; };
				if(count>=3){
					Memory.rooms[roomName].taps[i] = tile;
					Memory.rooms[roomName].tiles[i] = undefined;
				};
			};
		};

		// Debug: show tiles
		for(var i in Memory.rooms[roomName].tiles){
			if(Memory.rooms[roomName].tiles[i]){
				room.createFlag(Memory.rooms[roomName].tiles[i].x, Memory.rooms[roomName].tiles[i].y, room.name+"_"+i, COLOR_WHITE);
			};
		};
		for(var i in Memory.rooms[roomName].taps){ room.createFlag(Memory.rooms[roomName].taps[i].x, Memory.rooms[roomName].taps[i].y, room.name+"_"+i, COLOR_BLUE); };
		// Memory.rooms[roomName]={}; Memory.test=false;
		// Memory.rooms[roomName].condensed=false; Memory.test=false;
		// for(var i in Game.flags){ Game.flags[i].remove() };
		Memory.rooms[roomName].network = true;
		return true;
	};
	var overlayCity = function(roomName){
		Memory.rooms[roomName].city = true;
		return true;
	};
	var calcRating = function(roomName){
		Memory.rooms[roomName].rating = true;
		return true;
	};
	var calcFinish = function(roomName){
		Memory.rooms[roomName].finish = true;
		return true;
	};

	return {
		'checkMemory': checkMemory,
		'doNext': doNext,
		'overlayThreats': overlayThreats,
		'overlayDeff': overlayDeff,
		'overlayNetwork': overlayNetwork,
		'overlayCity': overlayCity,
	};
}();