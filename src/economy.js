'use strict';

if(!Memory.bazaars) Memory.bazaars={};


/* Entities

  $ is value measurement
  $ value is fixed to 1 energy at required Drop-off-Point
  $ sums to zero

  Market is manual bid and ask market in currency $
  Types of market: energy, creep, cpu, memory, rcl, security, <list of resources>
  Logistics is special agent that executes trades and determines bought, sold and cut values
  All other agents place future offers on markets


  Internal Rate of Return (IRR) is used to transport value in time
  IRR is used in discounted value flows

  */

  /* Future Offers & Orders

  Aksioms:
  - concept: 1 credit <= 1 energy here and now
  - concept: future offers only
  - concept: offer has Drop-of-Point
  - concept: offers may change
  - concept: 5 prices - bid, ask and bought, sold, cut
  - concept: continous market
  - concept: agent reserves current and next order
  - concept: agent's next order can be swapped with others
  - concept: bid is set as max buying price
  - concept: ask is set as min selling price
  - concept: credit never is negative - you can always borrow from player

  Properties:
  - concept: seller today -> buyer in future
  - optimization: inter-tap paths should be cached

  Problems:
  - concept: prices should be very informative
  - concept: prices may be set by historical averages - which ones?

  Rivalrous good markets -> bid/ask market
  - energy: agent is transport
  - creep: agent is player level virtual matcher called 'escrow'
  - <minerals>: agent is transport
  - cpu (ignore this for now)
  - memory (ignore this for now)

  Non-rivalrous goods -> crowdfunding market
  - rcl
  - security

  order -> set of exclusive offers

  Example #1:
  - Miner squad has just been created. Based on current IRR and assumption, that 1 energy == 1 credit, it evaluates various miner creeps by discounting it future energy yields and puts up creep bid offers at that price with time bounds [today; infinity].
  - Spawn has been just placed. As it has 300 energy, it places wildcard creep ask offer at [0; 300] energy with time bounds [today; infinity] at assumed starting price 1 credit per 1 energy.
  - Escrow recognizes that these offers can be matched and reserves both of them, spawn offer instantly and miner offer later. At the point of reservation, both miner and spawn places next offers. Then escrow in the same tick executes spawn offer and pays to it credits (while borrowing itself from player). When creep is ready, it is delivered to miner squad tap. Soon later miner offer is executed, when ownership of creep is transferred, miner borrows from player to pay escrow and escrow repays player amount borrowed plus aggregated interest.
  - In the end, spawn is positive, escrow is neutral and miner is negative on credit balance.
            Spawn Escrow  Miner Player
    credits +   0   0   -
    value +   0   --    +

  Example #1:
  - Miner squad has just been created. Based on current IRR and assumption, that 1 energy == 1 credit, it evaluates various miner creeps by discounting it future energy yields and puts up creep bid offers at that price with time bounds [today; infinity].
  - Spawn has been just placed. Spawns therefore has 300 energy available, it places ask creep offer at [0; 300] energy with time bounds [Game.tick + 6*3; infinity] at assumed bootstrap price 1 credit per 1 energy.
  - Escrow recognizes that these offers can be matched and reserves both of them
    - At the point of reservation
      - miner places next future bid offers for unmet miners
      - spawn places next future ask offers for unspent amount
    - spawn starts to fulfill offer
      - spawn creates creep (few ticks)
      - spawn places bid offer for spent energy
    - then spawn offer is executed
      - escrow borrows from player and pays to spawn for creep
      - escrow takes over creep
    - then escrow delivers creep
    - then miner offer is executed
      - Miner borrows from player and pays to escrow for creep
      - miner takes over creep
      - escrow repays player principal + interest
  - In the end
            Player  Spawn Escrow  Miner
    credits -   +   0   0
    balance +   +   0   --
    AV    0   +   +   +

  Example #2 (20 ticks later, when [MOVE,WORK,WORK] miner has been delivered):
  - Miner squad has started operating
    - miner places next ask offer and after next ask offer for energy
  - Spawn still is low on energy (70 energy) and still has energy bid offer up. The offer of [MOVE,WORK,WORK] is still promising, but as energy ask offers stacks up, Trans squad [MOVE,CARRY] offer gains in value. It also can be executed sooner. Escrow recognizes that and reserves it in 30 tick future.
  - 30 ticks later, spawns starts to fulfill offer (creates creep, bid for spent energy)
  - 36 ticks later escrow borrows from player and takes over creep.
  - 39 ticks later escrow delivers trans creep, Trans borrows to pay escrow and takes over creep, escrow repays
  - Trans starts to match energy bid and ask offers taking a cut.
*/

if(!Memory.agents) Memory.agents = {};
var Agent = class Agent {

  constructor(name){
    if(!name) throw Error('No name.');
    this.name = name;
    Game.agents[this.name] = this;
    if(!Memory.agents[this.name]){
      Memory.agents[this.name] = {
        credits: 0,
        orders: [],
        obligations: [],
      };
    }
  }

  // getters & setters
  credits(diff){
    if(diff) Memory.agents[this.name].credits += diff;
    return Memory.agents[this.name].credits;
  }

  orders(newOffer){
    if(newOffer) Memory.agents[this.name].orders.push(newOffer);
    return Memory.agents[this.name].orders;
  }

  obligations(newOffer){
    if(newOffer) Memory.agents[this.name].obligations.push(newOffer);
    return Memory.agents[this.name].obligations;
  }

};

var Bazaar = class Bazaar {

  constructor(name){
    this.name = name;
    if(!Memory.bazaars[this.name]){
      Memory.bazaars[this.name] = {
        offers: [],
      };
    }
  }

  rmOfferId(id){
    Memory.bazaars[this.name].offers = Memory.bazaars[this.name].offers.filter(offer=>offer.id!=id);
  }

  addOffer(offer){
    global.utils.assert(typeof offer == 'object', 'Offer is not an object, but '+typeof offer);
    global.utils.assert(offer.id,      'Offer does not have id.');
    global.utils.assert(offer.owner,   'Offer does not have owner.');
    global.utils.assert(offer.time,    'Offer does not have time.');
    global.utils.assert(offer.credits, 'Offer does not have credits, it is '+offer.credits);
    global.utils.assert(offer.amount,  'Offer does not have amount.');
    global.utils.assert(offer.details, 'Offer does not have details.');
    global.logger.debug(JSON.stringify(offer));
    Memory.bazaars[this.name].offers.push(offer);
  }

  getOffers(){
    return Memory.bazaars[this.name].offers;
  }

};

if(!Memory.energyBazaar) Memory.energyBazaar = {};
var energyBazaar = new Bazaar('energy');

if(!Memory.creepBazaar) Memory.creepBazaar = {};
var creepBazaar = new Bazaar('creep');




module.exports.energyBazaar = energyBazaar;
module.exports.creepBazaar = creepBazaar;
module.exports.Agent = Agent;
