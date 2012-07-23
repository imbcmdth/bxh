"use strict";

module.exports = generateNodeHelpers;

var cachedHelpers = {};

function makeNodeFromElement(element) {
	var aabb,
	    weight,
	    intersect,
	    overlaps,
	    contains,
	    contained;

	if("getAABB" in element) aabb = element.getAABB();
	else aabb = element.aabb;

	if("getWeight" in element) weight = element.getWeight();
	else weight = element.weight;

	if("getIntersectName" in element) intersect = element.getIntersectFunction();
	else intersect =  element.intersect;

	if("getOverlapsName" in element) overlaps = element.getOverlapsFunction();
	else overlaps =  element.overlaps;

	if("getContainsName" in element) contains = element.getContainsFunction();
	else contains =  element.contains;

	if("getContainedName" in element) contained = element.getContainedFunction();
	else contained =  element.contained;

	return {
		i: aabb,
		w: weight,
		o: element,
		iFn: intersect,
		oFn: overlaps,
		csFn: contains,
		cdFn: contained
	};
};

function generateNodeHelpers(dimensions) {
	// Cache helpers for each dimension since we only need to make 1
	if(dimensions in cachedHelpers)
		return cachedHelpers[dimensions];

	return (cachedHelpers[dimensions] = {
		_Dimensions: dimensions,

		makeArrayOfNodes : function(arrayOfElements) {
			var i = arrayOfElements.length,
			    arrayOfNodes = [],
			    element;

			while(i--) {
				element = arrayOfElements[i];
				arrayOfNodes.push(makeNodeFromElement(element));
			}
			return arrayOfNodes;
		},

		makeArrayOfNodesAsync : function(arrayOfElements, progressCallback, finishedCallback) {
			var totalElementsCount = arrayOfElements.length,
			    i = arrayOfElements.length,
			    arrayOfNodes = [];

			if(progressCallback) progressCallback({phase:"Generating nodes from primitives...", percent: 0});
			process.nextTick(makeNodes);

			function makeNodes(){
				var startTime = Date.now(),
				    element,
				    aabb,
				    weight;
				while(i--) {
					element = arrayOfElements[i];

					arrayOfNodes.push(makeNodeFromElement(element));

					if(Date.now() - startTime > 1000) {
						if(progressCallback)
							progressCallback({percent: (totalElementsCount - i) / totalElementsCount * 100});
						return process.nextTick(makeNodes);
					}
				}
				if(progressCallback) progressCallback({percent: 100});
				return finishedCallback(arrayOfNodes);
			}
		},

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

			while(numberOfAxis-->0) {
				if(numberOfAxis == bestAxis) continue;

				leftArray = [];
				rightArray = [];

				elementArray = sortedArraysOfNodes[numberOfAxis];
				numberOfElements = elementArray.length;
				totalnumberOfElements = numberOfElements - 1;

				while(numberOfElements-->0) {
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