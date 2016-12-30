'use strict';

const Marshal = class Marshal extends global.Agent {

  constructor(player){
    super('Marshal', player);
  }

  loop(){
  }

};

module.exports = Marshal;
