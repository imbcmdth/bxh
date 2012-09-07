(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory(
				require('./sah.js'),
				require('./median.js'));
		} else if (typeof define === 'function' && define.amd) {
			define([
				'./sah.js',
				'./median.js'
			],factory);
		} else {
			if(!root.BxH) root.BxH = {};
			root.BxH.SegmentHelpers = factory(
				root.BxH.SAHBuilder,
				root.BxH.MedianBuilder);
		}
	}(this, function (SAH, Median) {
		"use strict";

		return {
			SAH : SAH,
			Median : Median
		};
}));