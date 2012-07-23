"use strict";

var EPSILON = 1e-16;

// An Axis-Aligned Bounding Box
var AABB = function( min, max ) {
	var i,
	    dimensions; 
	if(typeof min !== "undefined" && min.length > 1) {
		if(typeof max !== "undefined"  && min.length !== max.length) {
			throw new Error("AABB: min and max must be arrays with the same length");
		}
		dimensions = min.length;
	}

	this._numDimensions = dimensions || this._numDimensions;

	this.min = min || [];
	this.max = max || [];

	if(!this.min.length) {
		for (i = 0; i < this._numDimensions; i++) {
			this.min.push(0);
		}
	}
	if(!this.max.length) {
		for (i = 0; i < this._numDimensions; i++) {
			this.max.push(this.min[i]);
		}
	}
};

AABB.prototype = {
	_numDimensions : 3, // default

	// returns the length of this in a specific dimension
	getLength : function( axis ){
		if(axis >= this._numDimensions) return 0;
		return this.max[axis] - this.min[axis];
	},

	// returns an array of the same dimensionality as this with
	// each entry having the length of this in that dimension
	getLengths : function(){
		var l = [],
			i;
		for(i = 0; i < this._numDimensions; i++) {
			l.push(this.getLength( i ));
		}
		return l;
	},

	// expand this to contain otherAABB
	expandByAABB : function( otherAABB ) {
		var i;
		for (i = 0; i < this._numDimensions; i++) {
			this.min[i] = Math.min( this.min[i], otherAABB.min[i] - EPSILON );
			this.max[i] = Math.max( this.max[i], otherAABB.max[i] + EPSILON );
		}
	},

	// expand this to contain a set of elements
	// (each elements must implement an aabb() function)
	expandToContainElements : function( elements, startAt ) {
		var i = elements.length;

		if(typeof startAt === "undefined") startAt = 0;

		if (i < 1) return;

		while(i-->startAt) {
			this.expandByAABB( elements[i].aabb() );
		}
	},

	// helper function to make a minimal bounding volume from an array
	// of elements (each elements must implement an aabb() function)
	makeToContainElements : function( elements ) {
		var aabb;

		if(elements.length > 0)
			aabb = elements[0].aabb().clone();
		else
			return new AABB();

		aabb.expandToContainElements( elements, 1 );
		return aabb;
	},

	// returns true if this overlaps or touches otherAABB
	overlaps : function( otherAABB ) {
		var i,
		    D = 0;

		for(i = 0; i < this._numDimensions; i++) {
			if(this.min[i] <= otherAABB.max[i] && this.max[i] >= otherAABB.min[i]) D++;
		}
		if(D  === this._numDimensions) return true;
		return false;
	},

	// returns true if this completely contains otherAABB
	contains : function( otherAABB ) {
		var i,
		    D = 0;

		for(i = 0; i < this._numDimensions; i++) {
			if(this.min[i] <=  otherAABB.min[i] && this.max[i] >= otherAABB.max[i]) D++;
		}
		if(D  === this._numDimensions) return true;
		return false;
	},

	// returns true if this is completely contained by otherAABB
	contained : function( otherAABB ) {
		var i,
		    D = 0;

		for(i = 0; i < this._numDimensions; i++) {
			if(otherAABB.min[i] <=  this.min[i] && otherAABB.max[i] >= this.max[i]) D++;
		}
		if(D  === this._numDimensions) return true;
		return false;
	},

	// Dimension agnogstic surface area (ie. perimeter for a 2D AABB)
	getSurfaceArea : function() {
		var area = 0,
			facearea = 1,
			j = this._numDimensions - 1,
			k = 0,
			lengths = this.getLengths(),
			i;

		for(i = 0; i < this._numDimensions; i++) {
			for(k = i; k < i + j; k++) {
				facearea *= lengths[k % this._numDimensions];
			}
			area += facearea;
			facearea = 1;
		}
		return 2 * area;
	},

	// Dimension agnogstic volume (ie. area for a 2D AABB)
	getVolume : function() {
		var volume = 1,
			lengths = this.getLengths(),
			i;

		for(i = 0; i < this._numDimensions; i++) {
			volume *= lengths[i];
		}
		return volume;
	},

	clone : function() {
		return new AABB(
			this.min.slice(),
			this.max.slice());
	},

	// returns the line segment within this defined by a ray or false if
	// the ray lies completely outside of this
	intersectWithRay : function( ray ) {
		var i,
		    j,
		    parameters = [
		    	[],
		    	[]
		    ],
		    inv_direction = [],
		    sign = [],
		    omin,
		    omax,
		    tmin,
		    tmax,
		    new_rs = [];

		// Initialize values
		for (i = 0; i < this._numDimensions; i++) {
			parameters[0][i] = this.min[i];
			parameters[1][i] = this.max[i];
			j = 1 / ray[i].b;
			inv_direction[i] = j;
			sign[i] = (j <= 0) ? 1 : 0;
		}

		omin = (parameters[sign[0]][0] - ray[0].a) * inv_direction[0];
		omax = (parameters[1 - sign[0]][0] - ray[0].a) * inv_direction[0];

		for (i = 1; i < this._numDimensions; i++) {
			tmin = (parameters[sign[i]][i] - ray[i].a) * inv_direction[i];
			tmax = (parameters[1 - sign[i]][i] - ray[i].a) * inv_direction[i];

			if ((omin > tmax) || (tmin > omax)) return false;

			if (tmin > omin) omin = tmin;

			if (tmax < omax) omax = tmax;
		}

		if (omin >= Infinity || omax <= -Infinity) return false;

		if (omin < 0 && omax < 0) return false;

		if (omin < 0) omin = 0;
		if (omax > 1) omax = 1;

		for (i = 0; i < this._numDimensions; i++) {
			new_rs[i] = {
				a : ray[i].a + ray[i].b * omin,
				b : ray[i].a + ray[i].b * omax
			};
		}

		return new_rs;
	},

	// returns the portion of a line segment that lies within this or false if
	// the line segment lies completely outside of this
	intersectWithSegment : function( rs ) {
		var i,
		    j,
		    parameters = [
		    	[],
		    	[]
		    ],
		    inv_direction = [],
		    sign = [],
		    omin,
		    omax,
		    tmin,
		    tmax,
		    new_rs = [];

		// Initialize values
		for (i = 0; i < this._numDimensions; i++) {
			parameters[0][i] = this.min[i];
			parameters[1][i] = this.max[i];
			j = 1 / (rs[i].b - rs[i].a);
			inv_direction[i] = j;
			sign[i] = (j <= 0) ? 1 : 0;
		}


		omin = (parameters[sign[0]][0] - rs[0].a) * inv_direction[0];
		omax = (parameters[1 - sign[0]][0] - rs[0].a) * inv_direction[0];

		for (i = 1; i < this._numDimensions; i++) {
			tmin = (parameters[sign[i]][i] - rs[i].a) * inv_direction[i];
			tmax = (parameters[1 - sign[i]][i] - rs[i].a) * inv_direction[i];

			if ((omin > tmax) || (tmin > omax)) return false;

			if (tmin > omin) omin = tmin;

			if (tmax < omax) omax = tmax;
		}

		if (omin >= Infinity || omax <= -Infinity) return false;

		if (omin < 0 && omax < 0) return false;

		if (omin < 0) omin = 0;
		if (omax > 1) omax = 1;

		for (i = 0; i < this._numDimensions; i++) {
			new_rs[i] = {
				a : rs[i].a + (rs[i].b - rs[i].a) * omin,
				b : rs[i].a + (rs[i].b - rs[i].a) * omax
			};
		}

		return new_rs;
	}
};

module.exports = AABB;