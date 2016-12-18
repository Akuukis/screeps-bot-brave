"use strict"

if(!Memory.logs) Memory.logs = {};
if(!Array.isArray(Memory.logs.fatal)) Memory.logs.fatal = [];
if(!Array.isArray(Memory.logs.error)) Memory.logs.error = [];
if(!Array.isArray(Memory.logs.warn )) Memory.logs.warn  = [];
if(!Array.isArray(Memory.logs.info )) Memory.logs.info  = [];
if(!Array.isArray(Memory.logs.debug)) Memory.logs.debug = [];
if(!Array.isArray(Memory.logs.trace)) Memory.logs.trace = [];

var Logger = {

  memoryLevel: 0,  // Minimal level to log to memory
  consoleLevel: 0,  // Minimal level to log to console
  tailLength: 1000,  // Maximal length of each log

  colors: {
    5: '#ff0066',
    4: '#e65c00',
    3: '#809fff',
    2: '#999999',
    1: '#737373',
    0: '#666666',
  },

  levels: {
    5: 'fatal',
    4: 'error',
    3: 'warn',
    2: 'info',
    1: 'debug',
    0: 'trace',
  },

  log: function(msg, severity){

    msg = '['+Game.time+'; '+Game.cpu.getUsed().toFixed(2)+'] '+msg.toString();

    if(severity >= this.memoryLevel){
      let log = Memory.logs[this.levels[severity]];

      if(log.length >= this.tailLength) Memory.logs[this.levels[severity]] = log.slice(Math.floor(this.tailLength/5))
      Memory.logs[this.levels[severity]].push(msg);
    };

    if(severity >= this.consoleLevel){
      console.log('<font color="' + this.colors[severity] + '" severity="' + severity + '">' + msg + "</font>")
    };
  },

  fatal: function(msg){ this.log(msg, 5); },
  error: function(msg){ this.log(msg, 4); },
  warn : function(msg){ this.log(msg, 3); },
  info : function(msg){ this.log(msg, 2); },
  debug: function(msg){ this.log(msg, 1); },
  trace: function(msg){ this.log(msg, 0); },

};

module.exports = Logger;
