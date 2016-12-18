'use strict';

global.logger = require('./logger');

//// Helpers.
// var _ = require('lodash');
const helper = require('./helpers');
helper.checkMemory();
global.getID = helper.getID;
global.gobi = helper.gobi;
global.posify = helper.posify;

{  //// Extend existing classes.
  let extend = function extend(screepsClass, newMethods){
    for(let key in newMethods) screepsClass.prototype[key] = newMethods[key];
  };
  extend(global.Room, require('extendRoom'));
}

{ //// New classes.
  global.Agent = require('./economy').Agent;
}

{ //// Global entities: Build from Memory to RAM.
  helper.checkMemory();
  let Player = require('./player');
  let Defer = require('./dtask');
  global.player = new Player();
  global.bazaar = require('./economy').bazaar;
  global.defer = {
    high: new Defer('high'),
    medium: new Defer('medium'),
    low: new Defer('low'),
  };
}

logger.info('Reinitiated.');

module.exports.loop = function() {
  // return;
  global.player.loop();  //  priority
  global.defer.high.loop();  // High priority
  global.defer.medium.loop();  // Medium priority
  global.defer.low.loop();  // Low priority
};

// END. Leave empty line below.
