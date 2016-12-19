'use strict';

const Executive = class Executive extends global.Agent {

  constructor(player){
    super('Executive', player);
    this.escrow = new (require('escrow'))(this);
    this.governor = new (require('governor'))(this);
  }

  irr(){
    return this.parent.irr() * 1.05;
  }

  loop(){
    const self = this;

    global.utils.pcall( ()=>self.escrow.loop(),   'executive called escrow.loop but got error');
    global.utils.pcall( ()=>self.governor.loop(),   'executive called governor.loop but got error');

    global.utils.pcall( ()=>{

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
