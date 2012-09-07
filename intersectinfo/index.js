(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory();
		} else if (typeof define === 'function' && define.amd) {
			define(factory);
		} else {
			if(!root.BxH) root.BxH = {};
			root.BxH.IntersectInfo = factory();
		}
	}(this, function () {
		"use strict";

		// Most minimal InterSectInfo structure possible
		function IntersectInfo() {
		}

		IntersectInfo.prototype = {
			isHit : false,
			position : null
		};

		return IntersectInfo;
}));