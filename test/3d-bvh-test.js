var vows = require('vows'),
    assert = require('assert'),
    BxH = require('../'),
    AABB = require('aabb'),
    BVH = BxH.BVH,
    Ray = require('ray'),
    IntersectInfo = BxH.IntersectInfo,
    mock = require('./3d_objects.js'),
    MJS = require('mjs')(Array),
    V3 = MJS.V3;

vows.describe('AABB').addBatch({
	'3D BVH': {
		topic: function(){
			var bvh = new BVH(3);
			bvh.buildFromArrayOfElements(mock, false);
			return bvh;
		},
		'overlaps empty' : function (bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.overlaps(area1).length, 0);
			assert.equal (bvh.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (bvh) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bvh.overlaps(area1).length, 5);
			assert.equal (bvh.overlaps(area2).length, 2);
		},
		'contains empty' : function (bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contains(area1).length, 0);
			assert.equal (bvh.contains(area2).length, 0);
		},
		'contains non-empty' : function (bvh) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bvh.contains(area1).length, 1);
			assert.equal (bvh.contains(area2).length, 5);
		},
		'contained empty' : function (bvh) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contained(area1).length, 0);
			assert.equal (bvh.contained(area2).length, 0);
		},
		'contained non-empty' : function (bvh) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bvh.contained(area1).length, 1);
			assert.equal (bvh.contained(area2).length, 1);
		},
		'ray intersection' : function (bvh) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (bvh) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	},
	'3D BVH Deferred Build': {
		topic: function(){
			var bvh = new BVH(3);
			bvh.buildFromArrayOfElements(mock, true);
			return bvh;
		},
		'overlaps empty' : function (bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.overlaps(area1).length, 0);
			assert.equal (bvh.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (bvh) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bvh.overlaps(area1).length, 5);
			assert.equal (bvh.overlaps(area2).length, 2);
		},
		'contains empty' : function (bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contains(area1).length, 0);
			assert.equal (bvh.contains(area2).length, 0);
		},
		'contains non-empty' : function (bvh) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bvh.contains(area1).length, 1);
			assert.equal (bvh.contains(area2).length, 5);
		},
		'contained empty' : function (bvh) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contained(area1).length, 0);
			assert.equal (bvh.contained(area2).length, 0);
		},
		'contained non-empty' : function (bvh) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bvh.contained(area1).length, 1);
			assert.equal (bvh.contained(area2).length, 1);
		},
		'ray intersection' : function (bvh) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (bvh) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	},
	'3D BVH Asynchronous Build': {
		topic: function(){
			var bvh = new BVH(3);
			bvh.buildFromArrayOfElementsAsync(mock, null, this.callback);
		},
		'overlaps empty' : function (err, bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.overlaps(area1).length, 0);
			assert.equal (bvh.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (err, bvh) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bvh.overlaps(area1).length, 5);
			assert.equal (bvh.overlaps(area2).length, 2);
		},
		'contains empty' : function (bvh) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contains(area1).length, 0);
			assert.equal (bvh.contains(area2).length, 0);
		},
		'contains non-empty' : function (bvh) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bvh.contains(area1).length, 1);
			assert.equal (bvh.contains(area2).length, 5);
		},
		'contained empty' : function (bvh) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bvh.contained(area1).length, 0);
			assert.equal (bvh.contained(area2).length, 0);
		},
		'contained non-empty' : function (bvh) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bvh.contained(area1).length, 1);
			assert.equal (bvh.contained(area2).length, 1);
		},
		'ray intersection' : function (err, bvh) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (err, bvh) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bvh.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	}
}).export(module);
