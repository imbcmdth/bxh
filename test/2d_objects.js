// Mock 2d objects for testing

var BxH = require('../'),
    AABB = BxH.AABB,
    MJS = require('mjs')(Array),
    V2 = MJS.V2;

// Minimal "object" to test the bxh's with
function MockObject(AABB, ID) {
	this.AABB = AABB;
	this.ID = ID;
}

MockObject.prototype = {
	intersect : function(ray, intersectInfo) {
		var rs = this.AABB.intersectWithRay(ray.toIntervals());
		if(rs) {
			var rv = V2.$(rs[0].a, rs[1].a);
			var t = V2.length(V2.sub(rv, ray.position));
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

var testElements = [
	new MockObject(
		new AABB(
			V2.$(1, 1),
			V2.$(2, 2)), "unit square 1"),
	new MockObject(
		new AABB(
			V2.$(-2, 1),
			V2.$(-1, 2)), "unit square 2"),
	new MockObject(
		new AABB(
			V2.$(1, -2),
			V2.$(2, -1)), "unit square 3"),
	new MockObject(
		new AABB(
			V2.$(-2, -2),
			V2.$(-1, -1)), "unit square 4"),
	new MockObject(
		new AABB(
			V2.$(-10, 3),
			V2.$(10, 4)), "long object 1"),
	new MockObject(
		new AABB(
			V2.$(-10, -4),
			V2.$(10, -3)), "long object 2"),
	new MockObject(
		new AABB(
			V2.$(-1.5, -1.5),
			V2.$(1.5, 1.5)), "overlapping object 1"),
	new MockObject(
		new AABB(
			V2.$(6, -5),
			V2.$(7, 5)), "overlapping object 2")
];

testElements.Object = MockObject;

module.exports = testElements;