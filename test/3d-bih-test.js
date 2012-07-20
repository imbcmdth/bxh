var vows = require('vows'),
    assert = require('assert'),
    BxH = require('../'),
    AABB = BxH.AABB,
    BIH = BxH.BIH,
    Ray = BxH.Ray,
    IntersectInfo = BxH.IntersectInfo,
    mock = require('./3d_objects.js'),
    MJS = require('mjs')(Array),
    V3 = MJS.V3;

vows.describe('AABB').addBatch({
	'3D BIH': {
		topic: function(){
			var bih = new BIH(3);
			bih.buildFromArrayOfElements(mock, false);
			return bih;
		},
		'overlaps empty' : function (bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.overlaps(area1).length, 0);
			assert.equal (bih.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (bih) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bih.overlaps(area1).length, 5);
			assert.equal (bih.overlaps(area2).length, 2);
		},
		'contains empty' : function (bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contains(area1).length, 0);
			assert.equal (bih.contains(area2).length, 0);
		},
		'contains non-empty' : function (bih) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bih.contains(area1).length, 1);
			assert.equal (bih.contains(area2).length, 5);
		},
		'contained empty' : function (bih) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contained(area1).length, 0);
			assert.equal (bih.contained(area2).length, 0);
		},
		'contained non-empty' : function (bih) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bih.contained(area1).length, 1);
			assert.equal (bih.contained(area2).length, 1);
		},
		'ray intersection' : function (bih) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (bih) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	},
	'3D BIH Deferred Build': {
		topic: function(){
			var bih = new BIH(3);
			bih.buildFromArrayOfElements(mock, true);
			return bih;
		},
		'overlaps empty' : function (bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.overlaps(area1).length, 0);
			assert.equal (bih.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (bih) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bih.overlaps(area1).length, 5);
			assert.equal (bih.overlaps(area2).length, 2);
		},
		'contains empty' : function (bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contains(area1).length, 0);
			assert.equal (bih.contains(area2).length, 0);
		},
		'contains non-empty' : function (bih) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bih.contains(area1).length, 1);
			assert.equal (bih.contains(area2).length, 5);
		},
		'contained empty' : function (bih) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contained(area1).length, 0);
			assert.equal (bih.contained(area2).length, 0);
		},
		'contained non-empty' : function (bih) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bih.contained(area1).length, 1);
			assert.equal (bih.contained(area2).length, 1);
		},
		'ray intersection' : function (bih) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (bih) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	},
	'3D BIH Asynchronous Build': {
		topic: function(){
			var bih = new BIH(3);
			bih.buildFromArrayOfElementsAsync(mock, null, this.callback);
		},
		'overlaps empty' : function (err, bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.overlaps(area1).length, 0);
			assert.equal (bih.overlaps(area2).length, 0);
		},
		'overlaps non-empty' : function (err, bih) {
			var area1 = new AABB([-1.6, -1.6, -0.5], [1.6, 1.6, 1]);
			var area2 = new AABB([6.5, 2.5, -2], [7.5, 3.5, -1]);

			assert.equal (bih.overlaps(area1).length, 5);
			assert.equal (bih.overlaps(area2).length, 2);
		},
		'contains empty' : function (bih) {
			var area1 = new AABB([10, 12, 10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contains(area1).length, 0);
			assert.equal (bih.contains(area2).length, 0);
		},
		'contains non-empty' : function (bih) {
			var area1 = new AABB([0, 0, 0], [3, 3, 3]);
			var area2 = new AABB([-2, -2, -2], [2, 2, 2]);

			assert.equal (bih.contains(area1).length, 1);
			assert.equal (bih.contains(area2).length, 5);
		},
		'contained empty' : function (bih) {
			var area1 = new AABB([-10, -12, -10], [20, 22, 20]);
			var area2 = new AABB([-20, -22, -20], [-10, -12, -10]);

			assert.equal (bih.contained(area1).length, 0);
			assert.equal (bih.contained(area2).length, 0);
		},
		'contained non-empty' : function (bih) {
			var area1 = new AABB([1, 1, 0], [2, 2, 1]);
			var area2 = new AABB([-1, -1, -1], [1, 1, 0]);

			assert.equal (bih.contained(area1).length, 1);
			assert.equal (bih.contained(area2).length, 1);
		},
		'ray intersection' : function (err, bih) {
			var ray = new Ray(V3.$(10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.equal (intersectionInfo.shape.ID, "overlapping object 2");
		},
		'ray non-intersection' : function (err, bih) {
			var ray = new Ray(V3.$(-10, 0, 1), V3.$(-1, 0, 0));
			var intersectionInfo = new IntersectInfo();
			bih.intersect(ray, intersectionInfo)
			assert.isFalse (intersectionInfo.isHit);
		}
	}
}).export(module);
