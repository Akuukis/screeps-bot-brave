module.exports = function(creeps) {
	var checkMemory = function() {
		Memory.routine = {creeps:{}};
		if(!Memory.t){ Memory.t={}; };
		if(!Memory.threats){ Memory.threats={}; };
		if(!Memory.squads){ Memory.squads={}; };
		if(!Memory.squads.upgr){ Memory.squads.upgr={}; };
		if(!Memory.squads.mine){ Memory.squads.mine={}; };
		if(!Memory.squads.deff){ Memory.squads.deff={}; };
		if(!Memory.squads.patr){ Memory.squads.patr={}; };
		if(!Memory.squads.offn){ Memory.squads.offn={}; };
		if(!Memory.squads.esco){ Memory.squads.esco={}; };
		if(!Memory.squads.scot){ Memory.squads.scot={}; };
		if(!Memory.demand){ Memory.demand={}; };
		if(!Memory.supply){ Memory.supply={}; };
		if(!Memory.cities){ Memory.cities={}; };
		if(!Memory.zones){ Memory.zones={}; };
		if(!Memory.rooms){ Memory.rooms={}; };
		if(!Memory.overlay){ Memory.overlay={}; };
		if(!Memory.taps){ Memory.taps={}; };
		if(!Memory.tmp){ Memory.tmp={}; };
		if(!Memory.network){ Memory.network={}; };
		if(!Memory.deffered){ Memory.deffered={}; };
		if(!Memory.deffered.fn){ Memory.deffered.fn=[]; };
		if(!Memory.deffered.wait){ Memory.deffered.wait=[]; };
		if(!Memory.deffered.tmp){ Memory.deffered.tmp=[]; };
	};
	var threatsFunctions = {
		lair: function(pos, data){
			if(pos.roomName != data.steps[0].roomName){ return false; }; // Not in the same room.
			if(pos.findInRange(data.steps,3).length>0){
				return gobi(data.lairId).ticksToSpawn || true; // Returns number (risky) to wait or true (run!).
			}else{
				return false; // Not in range.
			};
			var pos = creep.pos;
		}
	};
	function posify(pos){
		return new RoomPosition(pos.x, pos.y, pos.roomName);
	};
	function routine(creep){
		if(!Memory.creeps[creep.name]){ Memory.creeps[creep.name] = {}; };
		var threat = isThreat(creep);
		if((!Memory.creeps[creep.name].lastSafety || !creep.pos.isEqualTo(Memory.creeps[creep.name].lastSafety)) && !threat){
			Memory.creeps[creep.name].lastSafety = posify(creep.pos);
		};
		Memory.creeps[creep.name].threat = threat;
		if(!Memory.routine.creeps[creep.name].touched){
			Memory.routine.creeps[creep.name].touched = true;
		}else{
			console.log("Multitouch creep "+creep.name);
		};
	};
	function getID(){
		var id = Game.time;
		if( id>Memory.lastId ){
			Memory.lastId = id;
			return id % 1800;
		}else{
			Memory.lastId++;
			return Memory.lastId % 1800;
		};
	};
	function isThreat(creep){
		var threats = false;
		for(var t in Memory.threats){
			var t = threatsFunction[Memory.threats[t].id](creep.pos,Memory.threats[t].data);
			if( t && t < threats ){
				threats = t;
				if(threats==1){ return true; }; // True means RUN!
			};
		};
		return threats; // Either false (safe) or a number > 1.
	};
	function dAdd(fn, name, extra){
		var found = false;
		var fullName = ""+fn+"('"+name+"')"+(extra||"");
		for(var i in Memory.deffered.wait){ if(Memory.deffered.wait[i]==fullName){ found=true; }; };
		if(!found){
			Memory.deffered.fn.push(""+fn+"('"+name+"')");
			Memory.deffered.wait.push(fullName);
		};
	};
	function bodify(bps){
		var body = [];
		var translate = {
			A: ATTACK,
			C: CARRY,
			H: HEAL,
			M: MOVE,
			R: RANGED_ATTACK,
			T: TOUGH,
			W: WORK
		};
		for(var bp in bps){
			if(translate[bp]){
				for(var i=0;i<bps[bp];i++){ body[body.length]=translate[bp]; };
			};
		};
		return body;
	};
	function monitorCPU(){
		var tail = 16;
		Memory.CPU = Memory.CPU || [];
		Memory.CPU[Game.time%tail] = Game.cpu.getUsed(),"of",Game.cpuLimit;
		if(pulse){
			var avgCPU = 0;
			for(var k in Memory.CPU) {avgCPU=avgCPU+Memory.CPU[k]; };
			avgCPU = Math.round(avgCPU/Memory.CPU.length*100)/100;
			var stdevCPU = 0;
			for(var k in Memory.CPU) {stdevCPU=stdevCPU+(Memory.CPU[k]-avgCPU)*(Memory.CPU[k]-avgCPU); };
			stdevCPU=Math.round(Math.sqrt(stdevCPU)/tail*100)/100;
			console.log("CPU:",avgCPU,"+/-",stdevCPU);
		};
	};

	return {
		'checkMemory': checkMemory,
		'gobi': Game.getObjectById,
		'threatsFunctions': threatsFunctions,
		'posify': posify,
		'routine': routine,
		'getID': getID,
		'isThreat': isThreat,
		'dAdd': dAdd,
		'bodify': bodify,
		'monitorCPU': monitorCPU,
	};
}();