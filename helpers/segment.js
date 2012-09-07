(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory();
		} else if (typeof define === 'function' && define.amd) {
			define(factory);
		} else {
			if(!root.BxH) root.BxH = {};
			root.BxH.SegmentHelpers = factory();
		}
	}(this, function () {
		"use strict";

		var cachedHelpers = {};

		function generateSegmentHelpers(dimensions) {
			// Cache helpers for each dimension since we only need to make 1
			if(dimensions in cachedHelpers)
				return cachedHelpers[dimensions];

			return (cachedHelpers[dimensions] = {
				_Dimensions: dimensions,

				cloneSegment : function(rs) {
					// if(tdist < 0 ) throw "What!";
					var retRS = new Array(this._Dimensions),
					    i = 0;
					for (; i < this._Dimensions; i++) {
						retRS[i] = {
							a: rs[i].a,
							b: rs[i].b
						};
					}
					return retRS;
				},

				clipSegmentStart : function(rs, axis, splitPlane) {
					var tdist = (splitPlane - rs[axis].a) / (rs[axis].b - rs[axis].a),
					    retRS = new Array(this._Dimensions),
					    i = 0;

					for (; i < this._Dimensions; i++) {
						if (i !== axis) {
							retRS[i] = {
								a: rs[i].a + (rs[i].b - rs[i].a) * tdist,
								b: rs[i].b
							};
						} else {
							retRS[i] = {
								a: splitPlane,
								b: rs[i].b
							};
						}
					}
					return retRS;
				},

				clipSegmentStartInPlace : function(rs, axis, splitPlane) {
					var tdist = (splitPlane - rs[axis].a) / (rs[axis].b - rs[axis].a),
					    i = 0;
					for (; i < this._Dimensions; i++) {
						if (i !== axis) {
							rs[i].a = rs[i].a + (rs[i].b - rs[i].a) * tdist;
						} else {
							rs[i].a = splitPlane;
						}
					}
				},

				clipSegmentEnd : function(rs, axis, splitPlane) {
					var tdist = (splitPlane - rs[axis].a) / (rs[axis].b - rs[axis].a),
					    retRS = new Array(this._Dimensions),
					    i = 0;
					for (; i < this._Dimensions; i++) {
						if (i !== axis) {
							retRS[i] = {
								a: rs[i].a,
								b: rs[i].a + (rs[i].b - rs[i].a) * tdist
							};
						} else {
							retRS[i] = {
								a: rs[i].a,
								b: splitPlane
							};
						}
					}
					return retRS;
				},

				clipSegmentEndInPlace : function(rs, axis, splitPlane) {
					var tdist = (splitPlane - rs[axis].a) / (rs[axis].b - rs[axis].a),
					    i = 0;
					for (; i < this._Dimensions; i++) {
						if (i !== axis) {
							rs[i].b = rs[i].a + (rs[i].b - rs[i].a) * tdist;
						} else {
							rs[i].b = splitPlane;
						}
					}
				},
				
				copySegmentStartFromSegmentStart : function(destination, source) {
					for(var i = 0; i < this._Dimensions; i++)
						destination[i].a = source[i].a;
				},

				copySegmentStartFromSegmentEnd : function(destination, source) {
					for(var i = 0; i < this._Dimensions; i++)
						destination[i].a = source[i].b;
				},

				copySegmentEndFromSegmentStart : function(destination, source) {
					for(var i = 0; i < this._Dimensions; i++)
						destination[i].b = source[i].a;
				},

				copySegmentEndFromSegmentEnd : function(destination, source) {
					for(var i = 0; i < this._Dimensions; i++)
						destination[i].b = source[i].b;
				},

				trimSegmentInPlace : function(bestSegment, raySegment, axis) {
					var bestDir = 1,
					    rayDir = 1,
					    bestA = Math.min(bestSegment[axis].a, bestSegment[axis].b),
					    bestB = Math.max(bestSegment[axis].a, bestSegment[axis].b),
					    rayA = Math.min(raySegment[axis].a, raySegment[axis].b),
					    rayB = Math.max(raySegment[axis].a, raySegment[axis].b);
					if(bestA !== bestSegment[axis].a)
						bestDir = -1;
					if(rayA !== raySegment[axis].a)
						rayDir = -1;

					if(bestA > rayB || bestB < rayA) {
						// bestSegment and raySegment DO NOT overlap
						return false;
					} else if(rayA >= bestA && rayB <= bestB) {
						// raySegment is contained completely in bestSegment
						return true;
					} else if(bestA >= rayA && bestB <= rayB) {
						// bestSegment is contained completely in raySegment
						this.copySegmentStartFromSegmentStart(raySegment, bestSegment);
						this.copySegmentEndFromSegmentEnd(raySegment, bestSegment);
						return true;
					} else if(rayA >= bestA && rayA <= bestB) {
						// raySegment starts inside bestSegment (and must exit outside it!)
						if(rayDir == 1) { 
							if(bestDir == 1) {
								this.copySegmentEndFromSegmentEnd(raySegment, bestSegment);
							} else {
								this.copySegmentEndFromSegmentStart(raySegment, bestSegment);
							}
						} else {
							if(bestDir == 1) {
								this.copySegmentStartFromSegmentEnd(raySegment, raySegment);
								this.copySegmentEndFromSegmentEnd(raySegment, bestSegment);
							} else {
								this.copySegmentStartFromSegmentEnd(raySegment, raySegment);
								this.copySegmentEndFromSegmentStart(raySegment, bestSegment);
							}
						}
						return true;
					} else {
						// bestSegment starts inside raySegment (and must exit outside it!)
						if(bestDir == 1) {
							if(rayDir == 1) {
								this.copySegmentStartFromSegmentStart(raySegment, bestSegment);
							} else {
								this.copySegmentEndFromSegmentStart(raySegment, raySegment);
								this.copySegmentStartFromSegmentStart(raySegment, bestSegment);
							}
						} else {
							if(rayDir == 1) {
								this.copySegmentStartFromSegmentEnd(raySegment, bestSegment);
							} else {
								this.copySegmentEndFromSegmentStart(raySegment, raySegment);
								this.copySegmentStartFromSegmentEnd(raySegment, bestSegment);
							}
						}
						return true;
					}
				},

				setBestSegment : function(bestSegment, newEndpoint) {
					for(var i = 0; i< this._Dimensions; i++)
						bestSegment[i].b = newEndpoint[i];
				}
			});
		}

		return generateSegmentHelpers;
}));
