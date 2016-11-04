"use strict";

var obselete = require('./obselete');

module.exports.loop = function() {
	// return;

	obselete.init();

	global.pulse = 0 == Game.time % 10;
	obselete.loop();

	obselete.reportCPU();
};
// END. Leave empty line below.
