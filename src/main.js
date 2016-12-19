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

const bazaar = require('./economy').bazaar;
Game.bazaar = bazaar;
const agents = {};
Game.agents = agents;

const Defer = require('./defer');
const defer = {
  registerFn: Defer.registerFn,
  functions: {},
  high: new Defer('high', 50),
  medium: new Defer('medium', 20),
  low: new Defer('low', 10),
};
Game.defer = defer;

const player = new (require('./player'))();
Game.player = player;


global.logger.info('Reinitiated.');


module.exports.loop = function(){

  Game.player = player;
  Game.bazaar = bazaar;
  Game.defer = defer;
  Game.agents = agents;

  // return;

  global.utils.pcall( ()=>Game.player.loop(),       'main.js called player.loop but got error');
  global.utils.pcall( ()=>Game.defer.high.loop(),   'main.js called defer.high.loop but got error');
  global.utils.pcall( ()=>Game.defer.medium.loop(), 'main.js called defer.medium.loop but got error');
  global.utils.pcall( ()=>Game.defer.low.loop(),    'main.js called defer.low.loop but got error');

  global.utils.monitorCPU();
  if(Game.time%8 == 0) global.utils.printCPU();

};
