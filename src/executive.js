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

    global.utils.pcall( ()=>this.escrow.loop(),   'executive called escrow.loop but got error');
    global.utils.pcall( ()=>this.governor.loop(),   'executive called governor.loop but got error');

  }

};

module.exports = Executive;
