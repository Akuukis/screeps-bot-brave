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

	_addAsk(offerId, asks){
		if(!offerId) throw Error('No offerId');
		if(!asks) throw Error('No asks');
		if(this.offers[offerId]) this.rmAsk[offerId];

		if(!Array.is(asks)) asks = [asks];
		asks.forEach(ask=>this.asks.push({
				offerId: offerId,
				amount: ask.amount,
				tick: ask.tick,
				credits: ask.credits,
				pos: ask.pos,  // Pick up position
			}) );

		this.asks.sort((a,b)=>a.amount-b.amount);

		this.offers[offerId] = asks;
		return offerId;
	};

	_addBid(offerId, bids){
		if(!offerId) throw Error('No offerId');
		if(!bids) throw Error('No bids');
		if(this.offers[offerId]) this.rmAsk[offerId];

		if(!Array.is(bids)) bids = [bids];
		bids.forEach(bid=>this.bids.push({
				offerId: offerId,
				amount: bid.amount,
				tick: bid.tick,
				credits: bid.credits,
				pos: bid.pos,  // Drop off position
			}) );

		this.bids.sort((a,b)=>a.amount-b.amount);

		this.offers[offerId] = bids;
		return offerId;
	};

	addOffer(offer){
		assert(typeof offer == 'object', 'Offer is not an object, but '+typeof offer);
		assert(offer.id,      'Offer does not have id.');
		assert(offer.time,    'Offer does not have time.');
		assert(offer.credits, 'Offer does not have credits, it is '+offer.credits);
		assert(offer.amount,  'Offer does not have amount.');
		assert(offer.details, 'Offer does not have details.');
		assert(offer.pos,     'Offer does not have pos.');
		console.log(JSON.stringify(offer))
	};

};
