"use strict";

// The most minimal ray possible
function Ray(position, direction, dimensions) {
	this.position = position;   // Point
	this.direction = direction; // Vector
	this._numDimensions = dimensions || (position ? position.length : 3);
}

Ray.prototype = {
	// The ray's minimum T (T = time)
	minT : 0,

	// The ray's maximum T
	maxT : Math.pow(2, 53), // Largest enumerable integer

	// returns the axis of Ray.direction that has the largest component
	getMajorAxis : function() {
		var lAxisI = 0,
		    lAxisL = Math.abs(this.direction[0]),
		    i = this._numDimensions;

		while(i-->1) {
			if(Math.abs(this.direction[i]) > lAxisL) lAxisI = i;
		}

		return lAxisI;
	},

	// returns the ray in "interval" format 
	// an interval is the line segment along the ray from minT to maxT
	// this format is used by the BxH.intersect routines
	toIntervals : function() {
		var rs = [],
		    i = 0,
		    l = this._numDimensions;

		for(;i < l; i++) {
			rs.push({
				a: this.position[i] + this.direction[i] * this.minT,
				b: this.position[i] + this.direction[i] * this.maxT});
		}

		return rs;
	}
};

module.exports = Ray;