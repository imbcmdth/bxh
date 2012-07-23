"use strict";

module.exports = generateMedianBuilder;

var EPSILON = 1e-16,
    cachedHelpers = {};

function generateMedianBuilder(dimensions, kT, kI, kO, kB) {
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
		getBestSplit : function(sortedArraysOfNodes, AABB, totalWeight) { 
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
		}
	});
}
