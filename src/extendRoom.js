'use strict';

module.exports = {

  init: function init(){

    // Memory check.
    if(!this.memory.spawns){
      this.memory.spawns = {};
      let spawnsRaw = this.find(FIND_MY_SPAWNS);
      for(let spawnRaw of spawnsRaw){
        this.memory.spawns[spawnRaw.name] = {
          queue: {}, // Production, key is time module of 3.
          stats: {},
          ready: Math.floor(Game.time/3),
          next: Math.floor((Game.time-1800)/3)
        };
      }
    }
    if(!this.memory.ext && this.memory.ext!=0){
      let ext = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}});
      this.memory.ext = ext ? ext.length : 0;
    }
  },

  reconstruct: function reconstruct(){
    this.name = name;

    var room = Game.rooms[this.name];
    if(room){ // If visible.
      // Memory check.
      if(!room.memory.spawns){
        var spawnsRaw = room.find(FIND_MY_SPAWNS);
        room.memory.spawns = {};
        for(var i in spawnsRaw){
          room.memory.spawns[spawnsRaw[i].name] = {
            queue: {}, // Production, key is time module of 3.
            stats: {},
            ready: Math.floor(Game.time/3),
            next: Math.floor((Game.time-1800)/3)
          };
        }
      }
      if(!room.memory.ext && room.memory.ext!=0){
        var ext = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}});
        room.memory.ext = ext ? ext.length : 0;
      }
    }
  },

  spawnQueue: function spawnQueue(){
    var room = Game.rooms[this.name];
    if(Math.floor(Game.time/3) == Game.time/3){
      for(var name in room.memory.spawns){
        var spawn = Game.spawns[name];
        var ram = room.memory.spawns[name];
        if(ram.ready<Math.floor(Game.time)){ ram.ready=Math.floor(Game.time); } //TODO implement such this is obselete.
        if(ram.next && ram.queue[ram.next] && Memory.supply[ram.queue[ram.next]]){
          if(ram.next <= (Game.time-Game.time%3)/3){
            var order = Memory.supply[ram.queue[ram.next]];
            if(order && order.body){
              if(!order.name){ order.name = 'noname'+getId(); }
              var ok = spawn.canCreateCreep(order.body, order.name);
              if(ok == -3){ // ERR_NAME_EXISTS - try to change the name.
                order.name = order.name+'-'+getID();
                ok = spawn.canCreateCreep(order.body, order.name);
              }
              if(ok == 0){
                if(!order.owner){ order.owner = false; }
                if(!order.at){ order.at = Game.time; }
                if(!order.pos){ order.pos = posify(spawn.pos); }
                if( order.risky===undefined){ order.risky=false; }
                if(!order.memory){ order.memory={}; }
                order.memory.owner = order.owner;
                var mem = {
                  id: ram.queue[ram.next],
                  owner: spawn.name,
                  role: 'transit',
                  target: order.pos,
                  risky: order.risky,
                  at: order.at,
                  memory: order.memory
                };
                if(spawn.createCreep(order.body, order.name, mem) == 0){
                  // Success, creep is spawning!
                  ram.ready = Math.floor(Game.time/3) + order.body.length;
                  Memory.supply[ram.queue[ram.next]].status = 'spawning';
                  delete ram.queue[ram.next];
                }
              }else if(ok == -1){ // ERR_NOT_OWNER
                delete room.memory.spawns[name];
              }else if(ok == -3 || ok == -4 || ok == -6 ){ // ERR_NAME_EXISTS || ERR_BUSY || ERR_NOT_ENOUGH_ENERGY
                // Do nothing = Postpone.
              }else if(ok == -10){ // ERR_INVALID_ARGS - corrupt order, drop it.
                delete ram.queue[ram.next];
              }else{
                console.log('This is broken API');
              }
            }else{
              var first = Number.MAX_VALUE;
              for(var i in ram.queue){ first = Math.min(first,i); }
              ram.next = (first==Number.MAX_VALUE ? false : first);
            }
          }else{
            // Do nothing. Wait for demand.
          }
        }else{
          if(ram.queue[ram.next] && !Memory.supply[ram.queue[ram.next]]){
            delete ram.queue[ram.next];
            delete Memory.supply[ram.queue[ram.next]];
          }
          var first = Number.MAX_VALUE;
          for(var i in ram.queue){ first = Math.min(first,i); }
          ram.next = (first==Number.MAX_VALUE ? false : first);
        }
        // Do spawn stuff.
      }
    }
  },

};
