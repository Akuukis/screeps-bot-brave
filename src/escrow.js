'use strict';

const Escrow = class Escrow extends global.Agent {

  constructor(executive){
    super('Escrow', executive);
  }

  do(){
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

    // while(this.memory().length > 0 && Game.cpu.getUsed() < this.cpuLimit) this.do();

  }

};

module.exports = Escrow;
