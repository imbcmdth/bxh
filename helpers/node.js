"use strict";

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


module.exports = {
	makeArrayOfNodes : function(arrayOfElements){
		var i = arrayOfElements.length,
		    arrayOfNodes = [],
		    element;

		while(i--) {
			element = arrayOfElements[i];
			arrayOfNodes.push(makeNodeFromElement(element));
		}
		return arrayOfNodes;
	},

	makeArrayOfNodesAsync : function(arrayOfElements, progressCallback, finishedCallback){
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
	}
};
