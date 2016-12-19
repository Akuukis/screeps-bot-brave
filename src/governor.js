'use strict';

const Governor = class Governor extends global.Agent {

  constructor(executive){
    super('Governor', executive);
  }

  // Make overlay for each unexplored room.
  overlay(id){
    var room = Game.rooms[id];
    if(room.controller && room.controller.my && !Memory.cities[room.name]){ Memory.cities[room.name]={}; }
    if(!Memory.rooms[room.name]){ Memory.rooms[room.name]={}; }
    if(!Memory.rooms[room.name].threats){ new DTask({fn:'overlayThreats("' +room.name+'")'}); }
    if(!Memory.rooms[room.name].deff   ){ new DTask({fn:'overlayDeff("'    +room.name+'")'}); }
    if(!Memory.rooms[room.name].network){ new DTask({fn:'overlayNetwork("' +room.name+'")'}); } // Including POIs
    if(!Memory.rooms[room.name].city   ){ new DTask({fn:'overlayCity("'    +room.name+'")'}); }
    if(!Memory.rooms[room.name].rating ){ new DTask({fn:'calcRating("'     +room.name+'")'}); }
    if(!Memory.rooms[room.name].finish ){ new DTask({fn:'calcFinish("'     +room.name+'")'}); }
  }

  loop(){
    const self = this;
  }

};

module.exports = Governor;
