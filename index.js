(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory(
				require('./bvh'),
				require('./bih'),
				require('./aabb'),
				require('./ray'),
				require('./intersectinfo'));
		} else if (typeof define === 'function' && define.amd) {
			define([
			require('./bvh'),
				'./bih',
				'./aabb',
				'./ray',
				'./intersectinfo',
			], factory);
		} else {
/* Not sure this makes much sense...
			if(!root.BxH) root.BxH = {};
			root.BxH = factory(
				root.BxH.AABB,
				root.BxH.SegmentHelpers,
				root.BxH.TreeBuilders,
				root.BxH.NodeHelpers);*/
		}
	}(this, function (BVH, BIH, AABB, Ray, IntersectInfo) {
		return {
			BVH : require('./bvh'),
			BIH : require('./bih'),
			AABB: require('./aabb'),
			Ray: require('./ray'),
			IntersectInfo: require('./intersectinfo')
		};
}));