'use strict';

const Executive = class Executive extends global.Agent {

  constructor(player){
    super('Executive', player);
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

  escrows(){
    let highscore = 0;
    let bestOffer = null;
    let bestSpawn = null;

    for(let name in Game.spawns){
      let spawn = Game.spawns[name];
      let ram = spawn.memory;

      for(let offer of Game.bazaars.creep.getOffers()){
        // console.log(spawn.canCreateCreep(helper.bodify(offer.details.body)),helper.bodify(offer.details.body))
        if(offer.time > Game.time) continue;
        if(offer.amount > spawn.energy) continue;
        if(spawn.canCreateCreep(helper.bodify(offer.details.body)) != OK) continue;
        let score = offer.credits;
        score -= offer.amount;
        let duration = offer.details.duration;
        let partialDelayCost = helper.annuity(offer.details.costTick, duration);
        if(score-partialDelayCost<highscore) continue;
        let path = PathFinder.search(spawn.pos, offer.details.pos, { plainCost: 2, swampCost: 10 });
        let pathDelay = path.cost * (offer.details.duration/3-offer.details.body.M) / offer.details.body.M;
        let fullDelay = offer.details.duration + pathDelay;
        score -= helper.annuity(offer.details.costTick, fullDelay);
        if(score>highscore){
          highscore = score;
          bestOffer = offer;
          bestSpawn = spawn;
        }
        console.log(score.toFixed(0), partialDelayCost.toFixed(0), offer.credits.toFixed(0), offer.amount, JSON.stringify(offer.details));
      }
    }
    console.log('WINNER', highscore, bestSpawn, JSON.stringify(bestOffer));
    //Game.bazaars.creep.executeOffer(bestOffer.id);
  }

  loop(){

    Object.keys(Game.rooms).forEach(function(id){ Game.player.overlay(id); }); // Make overlay for each unexplored room.
    this.escrows();


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


    //// Temporarly: code to be removed.
    // obselete.loop();


    //// Statistics.
    helper.monitorCPU();
    if(Game.time%8 == 0) helper.printCPU();

  }

};

module.exports = Executive;
