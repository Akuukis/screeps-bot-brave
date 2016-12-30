'use strict';


const Executive = class Executive extends global.Agent {

  constructor(player){
    super('Executive', player);
    this.memory = ()=>Memory.executive;
    if(!this.memory()) Memory.executive = { governors:{} };

    this.escrow = new (require('escrow'))(this);

    this.governors = {};
  }

  irr(){
    return this.parent.irr() * 1.05;
  }

  loop(){

    for(let name in this.memory().governors){
      this.governors[name] = Game.agents[name] || new (require('governor'))(this, name);
    };

    global.utils.pcall( ()=>this.escrow.loop(), 'executive called escrow.loop but got error');
    for(let name in this.governors){
      global.utils.pcall( ()=>this.governors[name].loop(), 'executive called '+name+'.loop but got error');
    }

  }

};

module.exports = Executive;
