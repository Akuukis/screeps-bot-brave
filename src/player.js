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

    try{ this.marshal.loop()   }catch(e){ global.logger.error('Player called Marshal.loop but got error.\n'+e.stack) };
    try{ this.diplomat.loop()  }catch(e){ global.logger.error('Player called Diplomat.loop but got error.\n'+e.stack) };
    try{ this.executive.loop() }catch(e){ global.logger.error('Player called Executive.loop but got error.\n'+e.stack) };

  }

};

module.exports = Player;
