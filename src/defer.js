'use strict';

if(!Memory.defer) Memory.defer = {};
if(!Game.deferredFn) Game.deferredFn = {};

let Defer = class Defer {

  constructor(name, cpuLimit){
    this.name = name;
    this.cpuLimit = cpuLimit;
    let self = this;
    this.memory = ()=>Memory.defer[self.name];
    if(!this.memory()) Memory.defer[this.name] = [];
  }

  static registerFn(fn){
    Game.defer.functions[fn.name] = fn;
  }

  add(fn, owner){
    this.memory().push({
      registeredFn: fn,
      owner: owner,
      args: Array.prototype.slice.call(arguments, 2)
    });
  }

  do(){
    let d = this.memory().shift();
    let fn = Game.defer.functions[d.registeredFn].bind(Game.agents[d.owner]);
    global.utils.pcall( ()=>fn(), 'defer.'+this.name+' got error in '+d.owner+'.'+d.registeredFn.name);
  }

  loop(){
    while(this.memory().length > 0 && Game.cpu.getUsed() < this.cpuLimit) this.do();
  }

};

module.exports = Defer;
