var vows = require('vows'),
    assert = require('assert'),
    AABB = require('../').AABB;

vows.describe('AABB').addBatch({
	'Testing 2D AABB': {
		topic: function(){ return new AABB([-5, -2], [5, 3]); },

		'length' : function (aabb) {
			assert.equal (aabb.getLength(1), 5);
			assert.equal (aabb.getLength(2), 0);
		},
		'lengths': function (aabb) {
			assert.deepEqual (aabb.getLengths(), [10, 5]);
		},
		'perimeter': function (aabb) {
			assert.equal (aabb.getSurfaceArea(), 30);
		},
		'surface area': function (aabb) {
			assert.equal (aabb.getVolume(), 50);
		},
		'overlaps' : function(aabb) {
			var t = new AABB([-6, -3], [0, 0])
			assert.isTrue (aabb.overlaps(t));
		},
		'does not overlap' : function(aabb) {
			var t = new AABB([5, 4], [10, 4])
			assert.isFalse (aabb.overlaps(t));
		},
		'contains' : function(aabb) {
			var t = new AABB([-3, -2], [0, 0])
			assert.isTrue (aabb.contains(t));
		},
		'does not contain' : function(aabb) {
			var t = new AABB([0, 0], [10, 4])
			assert.isFalse (aabb.contains(t));
		},
		'contained' : function(aabb) {
			var t = new AABB([-6, -3], [6, 3])
			assert.isTrue (aabb.contained(t));
		},
		'not contained' : function(aabb) {
			var t = new AABB([-6, -3], [6, 2])
			assert.isFalse (aabb.contained(t));
		},
	},
	'Testing 3D AABB': {
		topic: function(){ return new AABB([-5, -2, -5], [5, 3, 5]); },

		'length' : function (aabb) {
			assert.equal (aabb.getLength(1), 5);
			assert.equal (aabb.getLength(2), 10);
		},
		'lengths': function (aabb) {
			assert.deepEqual (aabb.getLengths(), [10, 5, 10]);
		},
		'surface area': function (aabb) {
			assert.equal (aabb.getSurfaceArea(), 400);
		},
		'volume': function (aabb) {
			assert.equal (aabb.getVolume(), 500);
		},
		'overlaps' : function(aabb) {
			var t = new AABB([-6, -3, -6], [0, 0, 0])
			assert.isTrue (aabb.overlaps(t));
		},
		'does not overlap' : function(aabb) {
			var t = new AABB([5, 4, 5], [10, 4, 10])
			assert.isFalse (aabb.overlaps(t));
		},
		'contains' : function(aabb) {
			var t = new AABB([-3, -2, -3], [0, 0, 0])
			assert.isTrue (aabb.contains(t));
		},
		'does not contain' : function(aabb) {
			var t = new AABB([0, 0, 0], [10, 4, 10])
			assert.isFalse (aabb.contains(t));
		},
		'contained' : function(aabb) {
			var t = new AABB([-6, -3, -6], [6, 3, 6])
			assert.isTrue (aabb.contained(t));
		},
		'not contained' : function(aabb) {
			var t = new AABB([-6, -3, -6], [6, 2, 6])
			assert.isFalse (aabb.contained(t));
		},
		'segment intersects' : function(aabb) {
			var s = [
				{a: 0, b: 0},
				{a: -5, b: 10},
				{a: 0, b: 0}
			];
			assert.deepEqual (aabb.intersectWithSegment(s), 
				[
					{a: 0, b: 0},
					{a: -2, b: 3},
					{a: 0, b: 0}
				]);
		},
		'segment does not intersect' : function(aabb) {
			var s = [
				{a: -10, b: -10},
				{a: 0, b: 0},
				{a: 0, b: 0}
			];
			assert.isFalse (aabb.intersectWithSegment(s));
		}
	}
}).export(module);
