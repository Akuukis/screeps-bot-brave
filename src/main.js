'use strict';


//// Add new functions.
// var _ = require('lodash');
global.logger = require('./logger');
global.utils = require('./utils');

global.getID = global.utils.getID;
global.gobi = global.utils.gobi;
global.posify = global.utils.posify;


//// Extend existing classes.
let extend = function extend(screepsClass, newMethods){
  for(let key in newMethods) screepsClass.prototype[key] = newMethods[key];
};
extend(global.Room, require('extendRoom'));


//// Add new classes.
global.Agent = require('./economy').Agent;


//// Add new entities.
global.utils.checkMemory();
const player = new (require('./player'))();
const bazaar = require('./economy').bazaar;
let Defer = require('./defer');
const defer = {
  high: new Defer('high', 50),
  medium: new Defer('medium', 20),
  low: new Defer('low', 10),
};


global.logger.info('Reinitiated.');


module.exports.loop = function(){

  Game.player = player;
  Game.bazaar = bazaar;
  Game.defer = defer;

  // return;

  Game.player.loop();  //  priority

  Game.defer.high.loop();  // High priority
  Game.defer.medium.loop();  // Medium priority
  Game.defer.low.loop();  // Low priority

  helper.monitorCPU();
  if(Game.time%8 == 0) helper.printCPU();

};
