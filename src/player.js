'use strict';

const NEW_WORLD_NAME = 'Akuland';

const Player = class Player extends global.Agent {

  constructor(){
    super(NEW_WORLD_NAME, null);
    this.marshal = new (require('marshal'))(this);
    this.diplomat = new (require('diplomat'))(this);
    this.executive = new (require('executive'))(this);
  }

  pulse(){
    return 0 == Game.time % 25;
  }

  irr(){
    return 0.25 / 25;
  }

  loop(){
    const self = this;

    global.utils.pcall( ()=>self.marshal.loop(),   'player called marshal.loop but got error');
    global.utils.pcall( ()=>self.diplomat.loop(),  'player called diplomat.loop but got error');
    global.utils.pcall( ()=>self.executive.loop(), 'player called executive.loop but got error');

  }

};

module.exports = Player;
