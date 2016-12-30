'use strict';

module.exports = function() {
  var checkMemory = function() {
    Memory.routine = {creeps:{}};
    if(!Memory.t){ Memory.t={}; }
    if(!Memory.threats){ Memory.threats={}; }
    if(!Memory.squads){ Memory.squads={}; }
    if(!Memory.markets) Memory.markets={};
    if(!Memory.cities){ Memory.cities={}; }
    if(!Memory.zones){ Memory.zones={}; }
    if(!Memory.rooms){ Memory.rooms={}; }
    if(!Memory.overlay){ Memory.overlay={}; }
    if(!Memory.taps){ Memory.taps={}; }
    if(!Memory.tmp){ Memory.tmp={}; }
    if(!Memory.network){ Memory.network={}; }
    if(!Memory.deferred){ Memory.deferred={}; }
  };
  var threatsFunctions = {
    lair: function(pos, data){
      if(pos.roomName != data.steps[0].roomName){ return false; } // Not in the same room.
      if(pos.findInRange(data.steps,3).length>0){
        return gobi(data.lairId).ticksToSpawn || true; // Returns number (risky) to wait or true (run!).
      }else{
        return false; // Not in range.
      }
      var pos = creep.pos;
    }
  };
  function posify(pos){
    return new RoomPosition(pos.x, pos.y, pos.roomName);
  }
  function routine(creep){
    if(!Memory.creeps[creep.name]){ Memory.creeps[creep.name] = {}; }
    var threat = isThreat(creep);
    if((!Memory.creeps[creep.name].lastSafety || !creep.pos.isEqualTo(Memory.creeps[creep.name].lastSafety)) && !threat){
      Memory.creeps[creep.name].lastSafety = posify(creep.pos);
    }
    Memory.creeps[creep.name].threat = threat;
    if(!Memory.routine.creeps[creep.name].touched){
      Memory.routine.creeps[creep.name].touched = true;
    }else{
      console.log('Multitouch creep '+creep.name);
    }
  }
  function getID(){
    var id = Game.time;
    if( id>Memory.lastId ){
      Memory.lastId = id;
      return id % 1800;
    }else{
      Memory.lastId++;
      return Memory.lastId % 1800;
    }
  }
  function isThreat(creep){
    var threats = false;
    for(var t in Memory.threats){
      var t = threatsFunction[Memory.threats[t].id](creep.pos,Memory.threats[t].data);
      if( t && t < threats ){
        threats = t;
        if(threats==1){ return true; } // True means RUN!
      }
    }
    return threats; // Either false (safe) or a number > 1.
  }
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
        for(var i=0;i<bps[bp];i++){ body[body.length]=translate[bp]; }
      }
    }
    return body;
  }
  function monitorCPU(){
    var tail = 16;
    Memory.CPU = Memory.CPU || [];
    Memory.CPU[Game.time%tail] = Game.cpu.getUsed(),'of',Game.cpuLimit;
  }
  function printCPU(){
    var sum = 0;
    for(var k in Memory.CPU) sum = sum + Memory.CPU[k];
    var avg = sum/Memory.CPU.length;
    sum = 0;
    for(var k in Memory.CPU) sum = sum + (Memory.CPU[k]-avg)*(Memory.CPU[k]-avg);
    var stdev = Math.sqrt(sum) / Memory.CPU.length;
    global.logger.info('CPU: '+avg.toFixed(2)+' +/- '+stdev.toFixed(2));
  }

  function annuity(rent,n,i){
    i = i || Memory.irr;
    return rent * ( 1 - Math.pow(1+i,-n) ) / i;
  }

  function perpetuity(rent,i){
    i = i || Memory.irr;
    return rent/i;
  }

  function assert(assertion, msg){
    if(!assertion) throw Error(msg);
  }

  function bodyCost(body){
    var sum = 0;
    for(let key in body){
      if(key=='move' || key=='M'){
        sum += body[key] * BODYPART_COST.move;
      }else if(key=='work' || key=='W'){
        sum += body[key] * BODYPART_COST.work;
      }else if(key=='attack' || key=='A'){
        sum += body[key] * BODYPART_COST.attack;
      }else if(key=='carry' || key=='C'){
        sum += body[key] * BODYPART_COST.carry;
      }else if(key=='heal' || key=='H'){
        sum += body[key] * BODYPART_COST.heal;
      }else if(key=='ranged' || key=='R'){
        sum += body[key] * BODYPART_COST.ranged_attack;
      }else if(key=='tough' || key=='T'){
        sum += body[key] * BODYPART_COST.tough;
      }else if(key=='claim' || key=='L'){
        sum += body[key] * BODYPART_COST.claim;
      }else{
        throw Error('Unknown body part: '+key);
      }
    }
    return sum;
  }

  function bodyDuration(body){
    var sum = 0;
    for(let key in body) sum += body[key] * CREEP_SPAWN_TIME;
    return sum;
  }

  function pcall(fn, msg){
    try{
      fn();
    }catch(e){
      var stack = (e.stack.match(/[\s\S]*\(main.*/m) || [''])[0];  // hide stack outside of VM.
      stack = stack.replace(/^.*pcall.*$\n/gm, '');  // hide spam of pcalls in stack.
      global.logger.error(msg+'\n'+stack);
    }
  }

  return {
    'checkMemory': checkMemory,
    'gobi': Game.getObjectById,
    'threatsFunctions': threatsFunctions,
    'posify': posify,
    'routine': routine,
    'getID': getID,
    'isThreat': isThreat,
    'bodify': bodify,
    'monitorCPU': monitorCPU,
    'pcall': pcall,
    'printCPU': printCPU,
    'annuity': annuity,
    'perpetuity': perpetuity,
    'assert': assert,
    'bodyCost': bodyCost,
    'bodyDuration': bodyDuration,
  };
}();
