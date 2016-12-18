'use strict';

// var _ = require('lodash');
global.logger = require('./logger');
global.utils = require('./utils');

global.getID = global.utils.getID;
global.gobi = global.utils.gobi;
global.posify = global.utils.posify;

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
  global.utils.checkMemory();
  let Defer = require('./defer');
  Game.player = require('./player');
  Game.bazaar = require('./economy').bazaar;
  Game.defer = {
    high: new Defer('high'),
    medium: new Defer('medium'),
    low: new Defer('low'),
  };
}

global.logger.info('Reinitiated.');

module.exports.loop = function() {
  // return;
  Game.player.loop();  //  priority
  Game.defer.high.loop();  // High priority
  Game.defer.medium.loop();  // Medium priority
  Game.defer.low.loop();  // Low priority
};

// END. Leave empty line below.
