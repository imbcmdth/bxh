"use strict";

module.exports = generateSAHHelpers;

var EPSILON = 1e-16,
    cachedHelpers = {};

function generateSAHHelpers(dimensions, kT, kI, kO, kB) {
	var key = dimensions + "-"
		    + kT + "-"
		    + kI + "-"
		    + kO + "-"
		    + kB;

	// Cache helpers for each dimension since we only need to make 1
	if(key in cachedHelpers)
		return cachedHelpers[key];

	return (cachedHelpers[key] = {
		_Dimensions: dimensions,
		_kT: kT,
		_kI: kI, 
		_kO: kO,
		_kB: kB,

		makeWeight : function(nodes) {
			var w = 0,
			    i = nodes.length;
			while(i--) {
				w += nodes[i].w;
			}
			return (w);
		},

		makeMBV : function(nodes) {
			var i = nodes.length,
			    intervals;

			if (i < 1) return new AABB();

			intervals = nodes[0].i.clone();

			while (i-->1) {
				intervals.expandByAABB(nodes[i].i);
			}

			return (intervals);
		},

		makeSortedArrays : function(arrayOfNodes) {
			var destinationArrays = [],
			    numberOfElements = arrayOfNodes.length,
			    numberOfAxis = this._Dimensions, // Length of bounding box array
			    sortedArray = [],
			    sortFunction = function(a, b) {
			    	return (b.i.min[numberOfAxis] - a.i.min[numberOfAxis]);
			    }

			while(numberOfAxis-->0) {
				sortedArray = arrayOfNodes.slice(0);
				sortedArray.sort(sortFunction);
				destinationArrays[numberOfAxis] = sortedArray;
				sortedArray = [];
			}

			return destinationArrays;
		},

		// Based on SAH
		// TODO: Make _excluded_ region count towards cost (as a bonus).
		calculateSplitCost : function(numberOfAxis, leftPlane, rightPlane, leftCount, rightCount, leftAABB, rightAABB, parentSurfaceArea) {
			var t = this._Dimensions,
			    s,
			    leftSurfaceArea = 0,
			    rightSurfaceArea = 0,
			    overlapSurfaceArea = 0,
			    overlapWidth = leftPlane - rightPlane,
			    doesOverlap = (overlapWidth > 0 ? true : false),
			    SAH,
			    b;

			overlapWidth = Math.abs(overlapWidth);

			while(t-->0) {
				s = t - 1;
				if(s < 0) s = this._Dimensions - 1;
				if(doesOverlap) {
					leftSurfaceArea  += 2 * (t == numberOfAxis ? leftAABB.getLength(t) - overlapWidth : leftAABB.getLength(t))
											* (s == numberOfAxis ? leftAABB.getLength(s) - overlapWidth : leftAABB.getLength(s));
					rightSurfaceArea += 2 * (t == numberOfAxis ? rightAABB.getLength(t) - overlapWidth: rightAABB.getLength(t))
											* (s == numberOfAxis ? rightAABB.getLength(s) - overlapWidth: rightAABB.getLength(s));
				} else {
					leftSurfaceArea  += 2 * leftAABB.getLength(t)
											* leftAABB.getLength(s);
					rightSurfaceArea += 2 * rightAABB.getLength(t)
											* rightAABB.getLength(s);
				}
				overlapSurfaceArea   += 2 * (t == numberOfAxis ? overlapWidth : leftAABB.getLength(t)) 
										    * (s == numberOfAxis ? overlapWidth : rightAABB.getLength(s));
			}

			if(doesOverlap)
				SAH = this._kT + this._kI * ( (leftSurfaceArea/parentSurfaceArea)*leftCount 
						  + (rightSurfaceArea/parentSurfaceArea)*rightCount 
						  + (overlapSurfaceArea/parentSurfaceArea)*(rightCount+leftCount) );
			else
				SAH = this._kT + this._kI * ( (leftSurfaceArea/parentSurfaceArea)*leftCount 
						  + (rightSurfaceArea/parentSurfaceArea)*rightCount)
						  - this._kO * (overlapSurfaceArea/parentSurfaceArea)*(rightCount+leftCount);

			b = leftCount - rightCount;
			if(b <= 1 && b >= 0 ) SAH *= this._kB;

			return SAH;
		},

		// returns best axis and planes to split sortedArraysOfNodes into left and right regions
		getLowestCostSplit : function(sortedArraysOfNodes, AABB, totalWeight) { 
			var parentSurfaceArea = AABB.getSurfaceArea(),
			    cheapestAxis = -1,
			    cheapestIndex = -1,
			    cheapestCost = -1,
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
			costOfTotalIntersection = this._kI * totalCount;

			while(numberOfAxis-->0){
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

					if(cheapestCost + cheapestIndex + cheapestAxis < 0 || currentCost < cheapestCost) {
						cheapestAxis = numberOfAxis;
						cheapestIndex = numberOfElements;
						cheapestCost = currentCost;
						cheapestLeftPlane = currentLeftPlane;
						cheapestRightPlane = currentRightPlane;
						cheapestLeftWeight = currentLeftWeight;
						cheapestRightWeight = currentRightWeight;
					}

					element = nextElement;
				}
			}

			if(totalCount <= this._MaxLeaf && cheapestCost > costOfTotalIntersection) return false;
			return({
				axis: cheapestAxis,
				index: cheapestIndex,
				left: cheapestLeftPlane,
				right: cheapestRightPlane,
				cost: cheapestCost,
				leftWeight: cheapestLeftWeight,
				rightWeight: cheapestRightWeight
			});
		},

		splitSortedNodeArrays : function(sortedArraysOfNodes, bestAxis, bestIndex, leftPlane, rightPlane) {
			var numberOfAxis = sortedArraysOfNodes.length, // Length of bounding box array
			    numberOfElements = 0,
			    //we make 2 * # of axis lists (so 2 lists of length 3)
			    destinationArrays = [[], []],
			    leftArray,
			    rightArray,
			    elementArray,
			    element,
			    totalnumberOfElements;

			// First, split the best-fit axis
			rightArray = sortedArraysOfNodes[bestAxis].splice(0, bestIndex);
			leftArray = sortedArraysOfNodes[bestAxis];//.slice(bestIndex);

			destinationArrays[0][bestAxis] = leftArray;
			destinationArrays[1][bestAxis] = rightArray;

			while(numberOfAxis-->0){
				if(numberOfAxis == bestAxis) continue;

				leftArray = [];
				rightArray = [];

				elementArray = sortedArraysOfNodes[numberOfAxis];
				numberOfElements = elementArray.length;
				totalnumberOfElements = numberOfElements - 1;

				while(numberOfElements-->0){
					element = elementArray[totalnumberOfElements - numberOfElements];

					// We sort elements based on being outside of the left or right planes first
					// Only if they are in the overlapped region do we perform the more expensive
					// search for them to decide which array they should go into.
					if(element.i.min[bestAxis] < rightPlane) {
						leftArray.push(element);
					} else if(element.i.max[bestAxis] > leftPlane) {
						rightArray.push(element);
					} else if( destinationArrays[0][bestAxis].indexOf(element) >= 0) {
						leftArray.push(element);
					} else {
						rightArray.push(element);
					}
				}
				destinationArrays[0][numberOfAxis] = leftArray;
				destinationArrays[1][numberOfAxis] = rightArray;
			}
			return destinationArrays;
		}
	});
}
