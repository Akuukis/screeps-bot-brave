"use strict"

// Rely on ScreepsAutocomplete to provide global classes and constants.
var globals = {};
{
  // Classes.
  let fs = require('fs');
  let vm = require('vm');
  []
    .concat(fs.readdirSync('./lib/ScreepsAutocomplete'))
    .concat(fs.readdirSync('./lib/ScreepsAutocomplete/Structures'))
    .forEach(file=>{
      if(file.slice(-3) == '.js') globals[file.slice(0, -3)] = true;
    });
  // Constants.
  let code = fs.readFileSync('./lib/ScreepsAutocomplete/Global/Constants.js', 'utf-8');
  let script = new vm.Script( code.toString().replace(/const /g, '') );
  script.runInNewContext(globals);
  // Custom.
  script.Agent = true;
}

module.exports = {
  "globals": globals,
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "arrow-parens": ["error", "as-needed"],
    "eol-last": [ "error", "always" ],
    "func-call-spacing": ["error", "never"],
    "indent": [ "error", 2, { "VariableDeclarator": { "var": 2, "let": 2, "const": 3 }, "MemberExpression": 1 } ],
    "linebreak-style": [ "error", "unix" ],
    "no-console": 1,
    "no-unreachable": 1,
    "no-unused-vars": 1,
    "quotes": [ "error", "single" ],
    "semi": [ "error", "always" ],
    "strict": [ "error" ],
  }
};
