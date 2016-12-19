'use strict';

const Executive = class Executive extends global.Agent {

  constructor(player){
    super('Executive', player);
    this.escrow = new (require('escrow'))(this);
  }

  irr(){
    return this.parent.irr() * 1.05;
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

    global.utils.pcall( ()=>self.escrow.loop(),   'executive called escrow.loop but got error');

    global.utils.pcall( ()=>{
        Object.keys(Game.rooms).forEach(function(id){ Game.player.overlay(id); });

        //// Entities act: Rooms.
        for(let name in Game.rooms){
          Game.rooms[name].init();
        }


        //// Entities acts: Squads.
        if(Game.cpu.tickLimit < Game.cpu.bucket){
          // Just execute all squads.

          for(let squad of Game.squads.values()) squad.tick();
          if(Memory.pulse) for(let squad of Game.squads.values()) squad.pulse();

        }else{
          // Execute all squads in prioritized order.

          let order = new Set('mine','upgr','deff','patr','offn','esco','scot');
          let subArrays = {};
          let orderedArray = new Array();
          for(let type of order.values()) subArrays[type] = new Array();
          for(let squad of Game.squads.values()) if(typeof subArrays[squad.type] == 'array') subArrays[squad.type].push(squad);
          for(let type of order.values()) orderedArray.push.apply(subArrays[type]);
          orderedArray.forEach( squad=>squad.tick() );
          if(pulse) orderedArray.forEach( squad=>squad.pulse() );

        }


        //// Deferred tasks: anything not urgent and CPU intensive goes here.
        for(let dTask of Game.dtasks.values()){
          if(Game.cpu.getUsed()/Game.cpu.tickLimit>0.5) break;
          dTask.do();
        }
      },
      'executive called obselete functions but got error');

  }

};

module.exports = Executive;
