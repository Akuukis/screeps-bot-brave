"use strict";

/* Entities

$ is value measurement
$ value is fixed to 1 energy at required Drop-off-Point
$ sums to zero

Agent is Colony, City or Squad
Every agent has $


Market is manual bid and ask market in currency $
Types of market: energy, creep, cpu, memory, rcl, security, <list of resources>
Logistics is special agent that executes trades and determines bought, sold and cut values
All other agents place future offers on markets


Internal Rate of Return (IRR) is used to transport value in time
IRR is used in discounted value flows

*/

/* Future Offers & Orders

Aksioms:
- concept: future offers only
- concept: offer has Drop-of-Point
- concept: offers may change
- concept: 5 prices - bid, ask and bought, sold, cut
- concept: continous market
- concept: agent is transport that reserves current and next order
- concept: agent's next order can be swapped with others

Properties:
- concept: seller today -> buyer in future
- optimization: inter-tap paths should be cached

Problems:
- concept: prices should be very informative

- concept: how to set bid & ask
- concept: prices may be set by historical averages - which ones?

*/
var Bazaar = class Bazaar {

	constructor(opts){
		this.name = opts.name;
		if(!Memory.markets[this.name]) Memory.markets[this.name] = {};
	}

};

module.exports = {
	energy: new Bazaar({name: 'energy'}),
	creep: new Bazaar({name: 'creep'}),
	cpu: new Bazaar({name: 'cpu'}),
	memory: new Bazaar({name: 'memory'}),
};
