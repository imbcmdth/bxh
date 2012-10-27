// Mock 3d objects for testing

var BxH = require('../'),
    AABB = require('aabb'),
    MJS = require('mjs')(Array)
    V3 = MJS.V3;

// Minimal "object" to test the bxh's with
function MockObject(AABB, ID) {
	this.AABB = AABB;
	this.ID = ID;
}

MockObject.prototype = {
	intersect : function(ray, intersectInfo) {
		var rs = this.AABB.intersectWithRay(ray.toRaySegment());
		if(rs) {
			var rv = V3.$(rs[0].a, rs[1].a, rs[2].a);
			var t = V3.length(V3.sub(rv, ray.position));
			if(t < ray.maxT) { 
				ray.maxT = t;
				intersectInfo.shape = this;
				intersectInfo.isHit = true;
				intersectInfo.position = rv;
			}
		}
	},

	overlaps : function(aabb, returnArray) {
		if(aabb.overlaps(this.AABB)) returnArray.push(this);
	},

	contains : function(aabb, returnArray) {
		if(this.AABB.contains(aabb)) returnArray.push(this);
	},

	contained : function(aabb, returnArray) {
		if(this.AABB.contained(aabb)) returnArray.push(this);
	},

	getAABB : function() {
		return this.AABB;
	},

	getWeight : function() {
		return 1;
	}
}

// Export some test objects

var testObjects = [
	new MockObject(
		new AABB(
			V3.$(1, 1, 0),
			V3.$(2, 2, 1)), "unit cube 1"),
	new MockObject(
		new AABB(
			V3.$(-2, 1, 0),
			V3.$(-1, 2, 1)), "unit cube 2"),
	new MockObject(
		new AABB(
			V3.$(1, -2, 0),
			V3.$(2, -1, 1)), "unit cube 3"),
	new MockObject(
		new AABB(
			V3.$(-2, -2, 0),
			V3.$(-1, -1, 1)), "unit cube 4"),
	new MockObject(
		new AABB(
			V3.$(-10, 1.5, -2),
			V3.$(10, 2.5, -1)), "long object 1"),
	new MockObject(
		new AABB(
			V3.$(-10, -2.5, -2),
			V3.$(10, -1.5, -1)), "long object 2"),
	new MockObject(
		new AABB(
			V3.$(-1.5, -1.5, -1.5),
			V3.$(1.5, 1.5, 0.5)), "overlapping object 1"),
	new MockObject(
		new AABB(
			V3.$(6, -3, -1.5),
			V3.$(7, 3, 1.5)), "overlapping object 2")
];

testObjects.Object = MockObject;

module.exports = testObjects;