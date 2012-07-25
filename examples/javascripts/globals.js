"use strict";

var MJS = require('mjs')(Array),
    V2 = MJS.V2;

var BxH = require('./bxh'),
    BVH = BxH.BVH,
    BIH = BxH.BIH,
    AABB = BxH.AABB,
    Ray = BxH.Ray,
    IntersectInfo = BxH.IntersectInfo;

var canv_w = 1024,
    canv_h = 768,
    canv_off_x = -(canv_w / 2),
    canv_off_y = -(canv_h / 2),
    zoom = 1;