"use strict";

var AABB = require('../aabb'),
    SegmentHelpers = require('../helpers/segment.js'),
    SAHHelpers = require('../helpers/sah.js'),
    NodeHelpers = require('../helpers/node.js');

function BVH(dimensions, leafSizeMin, leafSizeMax){
	this._Dimensions = dimensions || this._Dimensions; 
	this._minLeaf = leafSizeMin || this._minLeaf; // Minimum leaf size
	this._maxLeaf = leafSizeMax || this._maxLeaf; // Maximum leaf size

	this._T = null;  // The tree's root
	this.i = null;  // The tree's "envelope" or AABB

	this.segmentHelpers = SegmentHelpers(this._Dimensions);
	this.SAHHelpers = SAHHelpers(
		this._Dimensions,
		10,  /* = _kT - Cost per node-traversal */
		5,   /* = _kI - Cost per intersection test */
		1000, /* = _kO - Cost savings for *empty* overlapped area (higher = better) */
		1);  /* = _kB - Cost savings for balanced splits (lower = better) */
	this.nodeHelpers = NodeHelpers;
};

BVH.prototype = {
	_Dimensions: 3,
	_minLeaf: 2,
	_maxLeaf: 4,
	use8WayNodes: false,

	_makeUnfinishedNode : function(boundingBox, sortedArraysOfNodes, totalWeight){
		return {
			i: boundingBox,
			s: sortedArraysOfNodes,
			w: totalWeight
		};
	},

	_makeBoxNode : function(boundingBox, children){
		return {
			i: boundingBox,
			n: children
		};
	},

	_makeLeafNode : function(boundingBox, elements){
		return {
			i: boundingBox,
			o: elements // is essentially an array of nodes!
		};
	},


	_recursiveBuild : function(sortedArraysOfNodes, AABB, localWeight){
		var numberOfElements = sortedArraysOfNodes[0].length,
		    makeMBV = this.SAHHelpers.makeMBV.bind(this.SAHHelpers);

		if(numberOfElements <= this._maxLeaf) return this._makeLeafNode(makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		var finalNodes = [],
		    subPartA = this._buildSubpart(sortedArraysOfNodes, AABB, localWeight),
		    subPartAA,
		    subPartAB,
		    subPartAAA,
		    subPartAAB,
		    subPartABA,
		    subPartABB;

		numberOfElements = subPartA.nodes[0][0].length;
		if(numberOfElements <= this._maxLeaf) {
				finalNodes.push(
					this._makeLeafNode(makeMBV(subPartA.nodes[0][0]), subPartA.nodes[0][0])
				);
		} else {
			subPartAA = this._buildSubpart(subPartA.nodes[0], makeMBV(subPartA.nodes[0][0]), subPartA.leftWeight);
			if(!this.use8WayNodes){
				finalNodes.push(
					this._recursiveBuild(subPartAA.nodes[0], makeMBV(subPartAA.nodes[0][0]), subPartAA.leftWeight)
				);
				finalNodes.push(
					this._recursiveBuild(subPartAA.nodes[1], makeMBV(subPartAA.nodes[1][0]), subPartAA.rightWeight)
				);
			} else {
				numberOfElements = subPartAA.nodes[0][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAA.nodes[0][0]), subPartAA.nodes[0][0])
						);
				} else {
					subPartAAA = this._buildSubpart(subPartAA.nodes[0], makeMBV(subPartAA.nodes[0][0]), subPartAA.leftWeight);
					finalNodes.push(
						this._recursiveBuild(subPartAAA.nodes[0], makeMBV(subPartAAA.nodes[0][0]), subPartAAA.leftWeight)
					);
					finalNodes.push(
						this._recursiveBuild(subPartAAA.nodes[1], makeMBV(subPartAAA.nodes[1][0]), subPartAAA.rightWeight)
					);
				}
				numberOfElements = subPartAA.nodes[1][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAA.nodes[1][0]), subPartAA.nodes[1][0])
						);
				} else {
					subPartAAB = this._buildSubpart(subPartAA.nodes[1],  makeMBV(subPartAA.nodes[1][0]), subPartAA.rightWeight);
					finalNodes.push(
						this._recursiveBuild(subPartAAB.nodes[0], makeMBV(subPartAAB.nodes[0][0]), subPartAAB.leftWeight)
					);
					finalNodes.push(
						this._recursiveBuild(subPartAAB.nodes[1], makeMBV(subPartAAB.nodes[1][0]), subPartAAB.rightWeight)
					);
				}
			}
		}
		numberOfElements = subPartA.nodes[1][0].length;
		if(numberOfElements <= this._maxLeaf) {
				finalNodes.push(
					this._makeLeafNode(makeMBV(subPartA.nodes[1][0]), subPartA.nodes[1][0])
				);
		} else {
			subPartAB = this._buildSubpart(subPartA.nodes[1], makeMBV(subPartA.nodes[1][0]), subPartA.rightWeight);
			if(!this.use8WayNodes){
				finalNodes.push(
					this._recursiveBuild(subPartAB.nodes[0], makeMBV(subPartAB.nodes[0][0]), subPartAB.leftWeight)
				);
				finalNodes.push(
					this._recursiveBuild(subPartAB.nodes[1], makeMBV(subPartAB.nodes[1][0]), subPartAB.rightWeight)
				);
			} else {
				numberOfElements = subPartAB.nodes[0][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAB.nodes[0][0]), subPartAB.nodes[0][0])
						);
				} else {
						subPartABA = this._buildSubpart(subPartAB.nodes[0],  makeMBV(subPartAB.nodes[0][0]), subPartAB.leftWeight);
						finalNodes.push(
							this._recursiveBuild(subPartABA.nodes[0], makeMBV(subPartABA.nodes[0][0]), subPartABA.leftWeight)
							);
						finalNodes.push(
							this._recursiveBuild(subPartABA.nodes[1], makeMBV(subPartABA.nodes[1][0]), subPartABA.rightWeight)
						);
				}

				numberOfElements = subPartAB.nodes[1][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAB.nodes[1][0]), subPartAB.nodes[1][0])
						);
				} else {
						subPartABB = this._buildSubpart(subPartAB.nodes[1],  makeMBV(subPartAB.nodes[1][0]), subPartAB.rightWeight);
						finalNodes.push(
							this._recursiveBuild(subPartABB.nodes[0], makeMBV(subPartABB.nodes[0][0]), subPartABB.leftWeight)
						);
						finalNodes.push(
							this._recursiveBuild(subPartABB.nodes[1], makeMBV(subPartABB.nodes[1][0]), subPartABB.rightWeight)
						);
				}
			}
		}
		return this._makeBoxNode(makeMBV(finalNodes), finalNodes);
	},

	_incrementalBuild : function(unfinishedNode){
		var sortedArraysOfNodes = unfinishedNode.s,
		    AABB = unfinishedNode.i,
		    numberOfElements = sortedArraysOfNodes[0].length,
		    makeMBV = this.SAHHelpers.makeMBV.bind(this.SAHHelpers),
		    localWeight = unfinishedNode.w;

		if(numberOfElements <= this._maxLeaf) return this._makeLeafNode(makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		var finalNodes = [],
		    subPartA = this._buildSubpart(sortedArraysOfNodes, AABB, localWeight),
		    subPartAA,
		    subPartAB,
		    subPartAAA,
		    subPartAAB,
		    subPartABA,
		    subPartABB;

		numberOfElements = subPartA.nodes[0][0].length;
		if(numberOfElements <= this._maxLeaf) {
				finalNodes.push(this._makeLeafNode(
					makeMBV (subPartA.nodes[0][0]), subPartA.nodes[0][0]));
		} else {
			subPartAA =
				this._buildSubpart(
					subPartA.nodes[0],
					makeMBV(subPartA.nodes[0][0]),
					subPartA.leftWeight);
			if(!this.use8WayNodes){
				finalNodes.push(
					this._makeUnfinishedNode(makeMBV(subPartAA.nodes[0][0]), subPartAA.nodes[0], subPartAA.leftWeight)
				);
				finalNodes.push(
					this._makeUnfinishedNode(makeMBV(subPartAA.nodes[1][0]), subPartAA.nodes[1], subPartAA.rightWeight)
				);
			} else {
				numberOfElements = subPartAA.nodes[0][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAA.nodes[0][0]), subPartAA.nodes[0][0])
						);
				} else {
					subPartAAA = this._buildSubpart(subPartAA.nodes[0], makeMBV(subPartAA.nodes[0][0]), subPartAA.leftWeight);
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPartAAA.nodes[0][0]), subPartAAA.nodes[0], subPartAAA.leftWeight)
					);
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPartAAA.nodes[1][0]), subPartAAA.nodes[1], subPartAAA.rightWeight)
					);
				}
				numberOfElements = subPartAA.nodes[1][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAA.nodes[1][0]), subPartAA.nodes[1][0])
						);
				} else {
					subPartAAB = this._buildSubpart(subPartAA.nodes[1],  makeMBV(subPartAA.nodes[1][0]), subPartAA.rightWeight);
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPartAAB.nodes[0][0]), subPartAAB.nodes[0], subPartAAB.leftWeight)
					);
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPartAAB.nodes[1][0]), subPartAAB.nodes[1], subPartAAB.rightWeight)
					);
				}
			}
		}
		numberOfElements = subPartA.nodes[1][0].length;
		if(numberOfElements <= this._maxLeaf) {
				finalNodes.push(this._makeLeafNode(makeMBV(subPartA.nodes[1][0]), subPartA.nodes[1][0]));
		} else {
			subPartAB = this._buildSubpart(subPartA.nodes[1], makeMBV(subPartA.nodes[1][0]), subPartA.rightWeight);
			if(!this.use8WayNodes){
				finalNodes.push(
					this._makeUnfinishedNode(makeMBV(subPartAB.nodes[0][0]), subPartAB.nodes[0], subPartAB.leftWeight)
				);
				finalNodes.push(
					this._makeUnfinishedNode(makeMBV(subPartAB.nodes[1][0]), subPartAB.nodes[1], subPartAB.rightWeight)
				);
			} else {
				numberOfElements = subPartAB.nodes[0][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAB.nodes[0][0]), subPartAB.nodes[0][0])
						);
				} else {
						subPartABA = this._buildSubpart(subPartAB.nodes[0],  makeMBV(subPartAB.nodes[0][0]), subPartAB.leftWeight);
						finalNodes.push(
							this._makeUnfinishedNode(makeMBV(subPartABA.nodes[0][0]), subPartABA.nodes[0], subPartABA.leftWeight)
						);
						finalNodes.push(
							this._makeUnfinishedNode(makeMBV(subPartABA.nodes[1][0]), subPartABA.nodes[1], subPartABA.rightWeight)
						);
				}

				numberOfElements = subPartAB.nodes[1][0].length;
				if(numberOfElements <= this._maxLeaf) {
						finalNodes.push(
							this._makeLeafNode(makeMBV(subPartAB.nodes[1][0]), subPartAB.nodes[1][0])
						);
				} else {
						subPartABB = this._buildSubpart(subPartAB.nodes[1],  makeMBV(subPartAB.nodes[1][0]), subPartAB.rightWeight);
						finalNodes.push(
							this._makeUnfinishedNode(makeMBV(subPartABB.nodes[0][0]), subPartABB.nodes[0], subPartABB.leftWeight)
						);
						finalNodes.push(
							this._makeUnfinishedNode(makeMBV(subPartABB.nodes[1][0]), subPartABB.nodes[1], subPartABB.rightWeight)
						);
				}
			}
		}
		return this._makeBoxNode(makeMBV(finalNodes), finalNodes);
	},

	_buildSubpart : function(sortedArraysOfNodes, AABB, totalWeight){
		var bestSplit = this.SAHHelpers.getLowestCostSplit(sortedArraysOfNodes, AABB, totalWeight),
		    newArraysOfSortedNodes = this.SAHHelpers.splitSortedNodeArrays(
			sortedArraysOfNodes,
			bestSplit.axis,
			bestSplit.index,
			bestSplit.left,
			bestSplit.right);

		return {leftWeight: bestSplit.leftWeight, rightWeight: bestSplit.rightWeight, nodes: newArraysOfSortedNodes};
	},

	buildFromArrayOfNodes : function(arrayOfNodes, deferredBuild){
		//make sorted lists of nodes. one list per axis sorted by bounds starts
		var sortedArraysOfNodes = this.SAHHelpers.makeSortedArrays(arrayOfNodes),
		    totalWeight = this.SAHHelpers.makeWeight(arrayOfNodes);

		this.i = this.SAHHelpers.makeMBV(arrayOfNodes);

		if(deferredBuild)
			this._T = this._makeUnfinishedNode(this.i, sortedArraysOfNodes, totalWeight);
		else
			this._T = this._recursiveBuild(sortedArraysOfNodes, this.i, totalWeight);
	},

	buildFromArrayOfElements : function(arrayOfElements, deferredBuild){
		this.buildFromArrayOfNodes(this.nodeHelpers.makeArrayOfNodes(arrayOfElements), deferredBuild);
	},

	buildFromArrayOfNodesAsync : function(arrayOfNodes, progressCallback, finishedCallback){
		var finishedElementCount = 0,
		    totalElementsCount = arrayOfNodes.length,
		    nodesTodo = [],
		    currentNode,
		    parentNode,
		    //make sorted lists of nodes. one list per axis sorted by bounds starts
		    sortedArraysOfNodes = this.SAHHelpers.makeSortedArrays(arrayOfNodes),
		    totalWeight = this.SAHHelpers.makeWeight(arrayOfNodes),
		    thisTree = this;

		this.i = this.SAHHelpers.makeMBV(arrayOfNodes);

		// Make root..
		this._T = this._incrementalBuild(this._makeUnfinishedNode(this.i, sortedArraysOfNodes, totalWeight));
		if(this._T.o) return finishedCallback();
		nodesTodo.push(this._T);

		if(progressCallback)
			progressCallback({phase: "Building acceleration structure...", percent: 0});

		process.nextTick(makeTree);

		function makeTree() {
			var startTime = Date.now(),
			    i;

			while(nodesTodo.length) {
				if(Date.now() - startTime > 1000) {
					if(progressCallback)
						progressCallback({percent: finishedElementCount / totalElementsCount * 100});
					return process.nextTick(makeTree);
				}
				parentNode = nodesTodo.pop();
				i = parentNode.n.length;
				while(i--) {
					currentNode = parentNode.n[i];
					if(currentNode.s) {
						currentNode = thisTree._incrementalBuild(currentNode);
						parentNode.n[i] = currentNode;
						if(currentNode.o) {
							finishedElementCount += currentNode.o.length;
						} else {
							nodesTodo.push(currentNode);
						}
					}
				}
			}
			return finishedCallback(null, thisTree);
		}
	},

	buildFromArrayOfElementsAsync : function(arrayOfElements, progressCallback, finishedCallback){
		var thisTree = this;
		this.nodeHelpers.makeArrayOfNodesAsync(arrayOfElements, progressCallback, function(arrayOfNodes){
			thisTree.buildFromArrayOfNodesAsync(arrayOfNodes, progressCallback, finishedCallback);
		});
	},

	intersect : function (ray, intersectInfo) {
		var parentStack = [],
		    rayStack = [], // Contains the ray-segment for the current sub-tree
		    depthStack = null,
		    rayIntervals = ray.toIntervals(),
		    majorAxis = ray.getMajorAxis(),
		    bestSegment = this.segmentHelpers.cloneSegment(rayIntervals),
		    parentNode,
		    intersectPoints,
		    nodes,
		    i,
		    rs,
		    ltree,
		    leafElementCount,
		    leafElement,
		    noDebug = true,
		    debug = null;

		if(intersectInfo.debug) {
			noDebug = false;
			debug = intersectInfo.debug;
			depthStack = [];
		}

		if("s" in this._T) { // An unfinished node!
			this._T = this._incrementalBuild(this._T);
		}

		intersectPoints = this.i.intersectWithSegment(rayIntervals);
		if (intersectPoints === false) return;

		// We must cheat if the root of the tree is a leaf
		if("o" in this._T)
			parentStack.push({n:[this._T]});
		else
			parentStack.push(this._T);

		if(!noDebug) depthStack.push(debug.currDepth);
		rayStack.push(intersectPoints);

		do {

			parentNode = parentStack.pop();
			nodes = parentNode.n;
			i = nodes.length;
			rs = rayStack.pop();
			if(!noDebug) {
				debug.depth = Math.max(debug.depth, debug.currDepth);
				debug.currDepth = depthStack.pop();
			}

			// Check to see if this node is still reachable
			if(intersectInfo.isHit) {
//					rs = this._TrimStack(bestSegment, rs, majorAxis);
				if(!this.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) {
					continue;
				}
			}
			while(i-->0) {
				ltree = nodes[i];

				// Check to see if this node is still reachable
				if(intersectInfo.isHit) {
					if(!this.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) //{
						continue;
				}

				intersectPoints = ltree.i.intersectWithSegment(rs);

				if (intersectPoints !== false) {

					if(ltree.s) { // An unfinished node!
						ltree = this._incrementalBuild(ltree);
						parentNode.n[i] = ltree;
					}

					if (ltree.n) { // Not a Leaf
						rayStack.push(intersectPoints);
						parentStack.push(ltree);
						if(!noDebug) depthStack.push(debug.currDepth+1);
					} else if (ltree.o) { // A Leaf !!
						leafElementCount = ltree.o.length;
						while(leafElementCount-->0) {
							leafElement = ltree.o[leafElementCount];
							leafElement.iFn.call(leafElement.o, ray, intersectInfo);

							if(intersectInfo.isHit) {
								this.segmentHelpers.setBestSegment(bestSegment, intersectInfo.position);
							}
						}// end while each element
					}

				}
			}
		} while (parentStack.length > 0);
	},

	overlaps : function (testAABB, returnArray) {
		return this._search(testAABB, returnArray, "contains", "oFn");
	},

	contains : function (testAABB, returnArray) {
		return this._search(testAABB, returnArray, "contains", "cdFn");
	},

	contained : function (testAABB, returnArray) {
		return this._search(testAABB, returnArray, "contained", "csFn", true);
	},

	_search : function (testAABB, returnArray, aabbTestFunction, leafTestFunction, useAlteredLogic) {
		var partialParentStack = [], // Contains the elements that partially overlap bounds
		    completeParentStack = [],// Contains elements completely within bounds
		    returnArray = returnArray || [],
		    nodes,
		    nodeCount,
		    parentNode,
		    ltree,
		    contained,
		    overlaps,
		    leafElementCount,
		    leafElement,
		    alteredLogic = !!useAlteredLogic;

		if(this._T === null) return returnArray;

		if(this._T.s) { // An unfinished node!
			this._T = this._incrementalBuild(this._T);
		}

		overlaps = testAABB.overlaps(this.i);
		contained = testAABB[aabbTestFunction](this.i);

		if(overlaps) {
			if(!alteredLogic){
				if(contained) completeParentStack.push(this._T);
				else partialParentStack.push(this._T);
			} else {
				if(contained) partialParentStack.push(this._T);
				else return returnArray;
			}
		} else {
			return returnArray;
		}

		// Traverse tree and find overlapping nodes
		while(partialParentStack.length > 0) {
			parentNode = partialParentStack.pop();
			nodes = parentNode.n;
			nodeCount = nodes.length;

			while(nodeCount--) {
				ltree = nodes[nodeCount];

				if(ltree.s) { // An unfinished node!
					ltree = this._incrementalBuild(ltree);
					parentNode.n[nodeCount] = ltree;
				}

				overlaps = testAABB.overlaps(ltree.i);
				if (overlaps) {
					contained = testAABB[aabbTestFunction](ltree.i);
					if (ltree.n) {
						if(!alteredLogic){
							if(contained) completeParentStack.push(ltree);
							else partialParentStack.push(ltree);
						} else {
							partialParentStack.push(ltree);
						}
					} else {
						leafElementCount = ltree.o.length;
						while(leafElementCount-->0) {
							leafElement = ltree.o[leafElementCount];
							leafElement[leafTestFunction].call(leafElement.o, testAABB, returnArray);
						}
					}
				}
			}
		}

		// Traverse completely contained nodes and select ALL children
		while(completeParentStack.length > 0) {
			parentNode = completeParentStack.pop();
			nodes = parentNode.n;
			nodeCount = nodes.length;

			while(nodeCount--) {
					ltree = nodes[nodeCount];

					if(ltree.s) { // An unfinished node!
						ltree = this._incrementalBuild(ltree);
						nodes[nodeCount] = ltree;
					}

					if (ltree.n) { // Not a Leaf
						completeParentStack.push(ltree);
					} else if (ltree.o) { // A Leaf !!
						leafElementCount = ltree.o.length;
						while(leafElementCount-->0) {
							returnArray.push(ltree.o[leafElementCount].o);
						}
					}
			}
		}
		return (returnArray);
	}

};
module.exports = BVH;