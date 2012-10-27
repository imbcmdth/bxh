"use strict";

var MJS = require('mjs')(Array),
    V2 = MJS.V2;

var BxH = require('../'),
    BVH = BxH.BVH,
    BIH = BxH.BIH,
    AABB = require('aabb'),
    Ray = require('ray'),
    IntersectInfo = BxH.IntersectInfo;

var canv_w = 1024,
    canv_h = 768,
    canv_off_x = -(canv_w / 2),
    canv_off_y = -(canv_h / 2),
    zoom = 1;

var minNodeSize = 1;
var maxNodeSize = 20;

function marsagliaMethod(x, s) {
	return x * Math.sqrt(-2 * Math.log(s) / s);
}

function getNormalDistribution() {
	var u, v, s;

	do {
		u = Math.random() * 2 - 1;
		v = Math.random() * 2 - 1;
		s = u * u + v * v;
	} while( s >= 1);

	return [marsagliaMethod(u, s), marsagliaMethod(v, s)];
}
