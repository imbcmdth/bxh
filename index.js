(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory(
				require('./bvh'),
				require('./bih'),
				require('./intersectinfo'));
		} else if (typeof define === 'function' && define.amd) {
			define([
				'./bvh/index',
				'./bih/index',
				'./intersectinfo/index',
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
	}(this, function (BVH, BIH, IntersectInfo) {
		return {
			BVH : BVH,
			BIH : BIH,
			IntersectInfo: IntersectInfo
		};
}));