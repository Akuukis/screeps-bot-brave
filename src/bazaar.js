"use strict";

var helper = require('./helpers');
var assert = helper.assert;

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

Rivalrous goods -> bid/ask market
- energy, creep, cpu, memory, <minerals>

Non-rivalrous goods -> crowdfunding market
- rcl, security,

order -> set of exclusive asks or bids


*/

module.exports = class Bazaar {

	constructor(name){
		this.name = name;
		if(!Memory.bazaars) Memory.bazaars = {};
		if(!Memory.bazaars[this.name]){
			Memory.bazaars[this.name] = {
				asks: [],
				bids: [],
				offers: {},
			};
		}else{
			let bazaar = Memory.bazaars[this.name];
			for(let key in bazaar) this[key] = bazaar[key];
		};
	};

	addOffer(offer){
		assert(typeof offer == 'object', 'Offer is not an object, but '+typeof offer);
		assert(offer.id,      'Offer does not have id.');
		assert(offer.owner,   'Offer does not have owner.');
		assert(offer.time,    'Offer does not have time.');
		assert(offer.credits, 'Offer does not have credits, it is '+offer.credits);
		assert(offer.amount,  'Offer does not have amount.');
		assert(offer.details, 'Offer does not have details.');
		console.log(JSON.stringify(offer))
	};

};
