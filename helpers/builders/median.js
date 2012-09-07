(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory();
		} else if (typeof define === 'function' && define.amd) {
			define(factory);
		} else {
			if(!root.BxH) root.BxH = {};
			root.BxH.MedianBuilder = factory();
		}
	}(this, function () {
		"use strict";

		var EPSILON = 1e-16;

		function generateMedianBuilder(tree) {
			return {
				_name : "Median",
				_tree : tree,

				// Based on SAH
				// TODO: Make _excluded_ region count towards cost (as a bonus).
				calculateSplitCost : function(numberOfAxis, leftPlane, rightPlane, leftCount, rightCount, leftAABB, rightAABB, parentSurfaceArea) {
					var t = this._tree._dimensions,
					    s,
					    leftSurfaceArea = 0,
					    rightSurfaceArea = 0,
					    overlapSurfaceArea = 0,
					    overlapWidth = leftPlane - rightPlane,
					    doesOverlap = (overlapWidth > 0 ? true : false),
					    SAH,
					    b;

					overlapWidth = Math.abs(overlapWidth);

					leftSurfaceArea = leftAABB.getSurfaceArea();
					rightSurfaceArea = rightAABB.getSurfaceArea();

					// Probably not right for BVH's:
					while(t-->0) {
						s = t - 1;
						if(s < 0) s = this._tree._dimensions - 1;
						if(t == numberOfAxis || s == numberOfAxis) {
							overlapSurfaceArea   += 2 * (t == numberOfAxis ? overlapWidth : leftAABB.getLength(t)) 
												      * (s == numberOfAxis ? overlapWidth : rightAABB.getLength(s));
						}
					}

					if(doesOverlap)
						SAH = this._tree._kT + this._tree._kI * ( (leftSurfaceArea/parentSurfaceArea)*leftCount 
								  + (rightSurfaceArea/parentSurfaceArea)*rightCount );
					else
						SAH = this._tree._kT + this._tree._kI * ( (leftSurfaceArea/parentSurfaceArea)*leftCount 
								  + (rightSurfaceArea/parentSurfaceArea)*rightCount)
								  - this._tree._kO * (overlapSurfaceArea/parentSurfaceArea)*(rightCount+leftCount);

					b = leftCount - rightCount;
					if(b <= 1 && b >= 0 ) SAH *= this._tree._kB;

					return SAH;
				},

				// returns best axis and planes to split sortedArraysOfNodes into left and right regions
				getBestSplit : function(sortedArraysOfNodes, AABB, totalWeight) { 
					var parentSurfaceArea = AABB.getSurfaceArea(),
					    cheapestAxis = -1,
					    cheapestIndex = -1,
					    cheapestCost = Infinity, // Just some large value
					    cheapestLeftPlane = -1,
					    cheapestRightPlane = -1,
					    numberOfAxis = sortedArraysOfNodes.length, // Length of bounding box array
					    costOfTotalIntersection = 0,
					    totalCount = 0,
					    numberOfElements = 0,
					    currentLeftPlane = Math.NaN,
					    currentRightPlane = 0,
					    currentLeftCount = 0,
					    currentRightCount = 0,
					    currentCost = 0,
					    currentStart = 0,
					    currentEnd = 0,
					    leftAABB,
					    rightAABB,
					    elementArray,
					    element,
					    nextElement,
					    currentLeftWeight = 0,
					    currentRightWeight = 0,
					    cheapestLeftWeight = 0,
					    cheapestRightWeight = 0;

					totalCount = sortedArraysOfNodes[0].length;
					costOfTotalIntersection = this._tree._kI * totalCount;

					while(numberOfAxis-->0) {
						leftAABB = AABB.clone();
						rightAABB = AABB.clone();

						elementArray = sortedArraysOfNodes[numberOfAxis];

						currentLeftWeight = 0;
						currentLeftCount = 0;
						currentRightWeight = totalWeight;
						currentRightCount = numberOfElements = elementArray.length;
						//currentRightPlane = currentLeftPlane = elementArray[numberOfElements-1].a;
						currentLeftPlane = Math.NaN;

						element = elementArray[numberOfElements - 1];
						while(numberOfElements-->1){
							//move one element at a time to the left and find the score
							nextElement = elementArray[numberOfElements - 1];
							currentLeftCount++;
							currentLeftWeight += element.w;
							currentRightCount--;
							currentRightWeight -= element.w;

							currentEnd = element.i.max[numberOfAxis];
							currentStart = nextElement.i.min[numberOfAxis];

							currentLeftPlane = currentLeftPlane == Math.NaN ? currentEnd + EPSILON : Math.max(currentLeftPlane, currentEnd + EPSILON);
							currentRightPlane = currentStart - EPSILON;
							leftAABB.max[numberOfAxis] = currentLeftPlane;
							rightAABB.min[numberOfAxis] = currentRightPlane;

							if(currentLeftCount >= currentRightCount) break;

							element = nextElement;
						}
						if(currentLeftCount < this._tree._minLeaf || currentRightCount < this._tree._minLeaf) {
							currentCost = Math.NaN;
						} else {
							currentCost = this.calculateSplitCost(
								numberOfAxis,
								currentLeftPlane,
								currentRightPlane,
								currentLeftWeight,
								currentRightWeight,
								leftAABB,
								rightAABB,
								parentSurfaceArea
							);
						}

						if(currentCost && (cheapestIndex + cheapestAxis < 0 || currentCost < cheapestCost)) {
							cheapestAxis = numberOfAxis;
							cheapestIndex = numberOfElements;
							cheapestCost = currentCost;
							cheapestLeftPlane = currentLeftPlane;
							cheapestRightPlane = currentRightPlane;
							cheapestLeftWeight = currentLeftWeight;
							cheapestRightWeight = currentRightWeight;
						}

					}

					if(cheapestIndex < 0 || (totalCount <= this._tree._MaxLeaf && cheapestCost > costOfTotalIntersection)) return false;
					return({
						axis: cheapestAxis,
						index: cheapestIndex,
						left: cheapestLeftPlane,
						right: cheapestRightPlane,
						cost: cheapestCost,
						leftWeight: cheapestLeftWeight,
						rightWeight: cheapestRightWeight
					});
				}
			};
		}

		return generateMedianBuilder;
}));