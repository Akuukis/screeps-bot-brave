'use strict';

const NEW_WORLD_NAME = 'Akuland';

const Player = class Player extends global.Agent {

  constructor(){
    super(NEW_WORLD_NAME, null);
  }

  pulse(){
    return 0 == Game.time % 25;
  }

  irr(){
    return 0.25 / 25;
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

  // Distribute spawning demands to spawns.
  distribute(id){
    var demand = Memory.demand[id];
    var pos = new posify(demand.pos);
    var fat = demand.fat;
    var cost = demand.cost;
    var fatigue = demand.fatigue;
    var at = Math.floor( demand.at/3 );
    console.log('>demand>',' id:',id,' pos:',pos,' fat:',fat,' cost:',cost,' fatigue:',fatigue,' at:',at);
    var best = {score:false,spawn:false,moment:false};
    var count = 0;
    for(var c in Memory.cities){
      for(var s in Memory.cities[c].spawns){
        // Try to place demand.
        var spawn = Game.spawns[s];
        var ram = Memory.cities[c].spawns[s];
        var path = spawn.room.findPath( spawn.pos, pos, {ignoreCreeps: true} );
        //var path = spawn.pos.findPathTo(pos, {ignoreCreeps: true});
        var distance = (path ? path.length : false);
        if(!distance){ console.log('>demand>cities>spawns> Bad distance'); continue; }
        console.log('>demand>cities>spawns> ',' name:',s,' pos:',spawn.pos,' distance:',distance,' moment:',moment);
        var moment = ram.ready;
        while(moment < at + fat || !best.score.total){
          var occupied = true;
          console.log('>demand>cities>spawns>moment> ',' count:',count,' time:',Math.floor(Game.time/3),' moment:',moment,' at:',at,' fat:',fat);
          while(occupied){
            var occupied = false;
            for(var q=moment;q<moment+fat;q++){
              console.log('>demand>cities>spawns>moment>occupied>q>if> ',' q:',q,' occupied:',occupied,ram.queue[q],Memory.supply[ram.queue[q]],(Memory.supply[ram.queue[q]]||{}).body);
              if(ram.queue[q]){
                occupied = q + Memory.supply[ram.queue[q]].fat;
              }
            }
            console.log('>demand>cities>spawns>moment>occupied> ',' occupied:',occupied);
            moment = occupied || moment;
          }
          var score = {};
          score.distance = -(fatigue*distance*2)*cost/1800; // Assume plains everywhere.
          score.wait = -Math.max(0, at - (moment+fat))*cost/1800;
          score.delay = -Math.max(0, (moment+fat) - at)*demand.score;
          score.total = score.distance + score.wait + score.delay;
          console.log('>demand>cities>spawns>moment> ',' count:',count,' moment:',moment,' score.distance:',score.distance,' score.wait:',score.wait,' score.delay:',score.delay,' score.total:',score.total,' best:',best.score.total);
          if(!best.score || score.total>best.score.total){
            best.score = score;
            best.ram = ram;
            best.moment = moment;
          }
          moment++;
          count++;
          if(count==(Memory.count||10)){ throw error('kuku!'); }
        }
        //no .at-fat-distance līdz tgd
        // Calc offset. Faster=upkeep, Slower=Owner's perf.
      }
    }
    if(best.ram){
      console.log('>demand>best> ',' id:',id,' demand:',demand,' spawn:',s);
      best.ram.queue[moment] = id;
      Memory.supply[id] = demand;
      Memory.supply[id].status = 'in queue';
      Memory.demand[id] = undefined;
    }
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

    //// Entity acts: Colony.
    Memory.irr = Game.player.irr();
    Memory.pulse = Game.player.pulse();
    Object.keys(Game.rooms).forEach(function(id){ Game.player.overlay(id); }); // Make overlay for each unexplored room.
    // Memory.demand.forEach(function(id){ Game.player.distribute(id); }); // Distribute spawning demands to spawns.
    Game.player.escrows();


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

module.exports = Player;
