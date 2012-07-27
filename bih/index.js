"use strict";

var AABB = require('../aabb'),
    SegmentHelpers = require('../helpers/segment.js'),
    TreeBuilders = require('../helpers/builders'),
    NodeHelpers = require('../helpers/node.js');

function BIH(dimensions, leafSizeMin, leafSizeMax, buildAlgorithm) {
	this._dimensions = dimensions || this._dimensions; 

	// The optimal leaf size is dependent on the user agent and model size
	// Chrome : 1-11  ?? Who knows ??
	// Firefox: ~3
	// Opera  : ~?
	// IE     : ~?

	this._minLeaf = leafSizeMin || this._minLeaf; // Minimum leaf size
	this._maxLeaf = leafSizeMax || this._maxLeaf; // Maximum leaf size

	this.treeBuilder = (buildAlgorithm || TreeBuilders.SAH)(this);

	this._T = null; // The tree's root
	this.i = null;  // The tree's AABB

	this.segmentHelpers = SegmentHelpers(this._dimensions);
	this.nodeHelpers = NodeHelpers(this._dimensions);
};

BIH.prototype = {
	_name: "BIH",
	_dimensions: 3,
	_minLeaf: 2,
	_maxLeaf: 4,
	_kT: 50,  /* = _kT - Cost per node-traversal */
	_kI: 50,  /* = _kI - Cost per intersection test */
	_kO: 1.2, /* = _kO - Cost savings for *empty* overlapped area (higher = better) */
	_kB: 1,   /* = _kB - Cost savings for balanced splits (lower = better) */

	// ALL nodes only have one-letter variables to save space in the event that the tree is serialized.
	// TODO: Allow the tree to be serialized. :)
	_makeUnfinishedNode : function(boundingBox, sortedArraysOfNodes, totalWeight) {
		return {
			i: boundingBox,
			s: sortedArraysOfNodes,
			w: totalWeight
		};
	},

	_makeSplittingNode : function(leftPlane, rightPlane, leftNode, rightNode, axis, cost) {
		return {
			x: axis,
			u: leftPlane,
			v: rightPlane,
			l: leftNode,
			r: rightNode
		};
	},

	_makeLeafNode : function(boundingBox, elements) {
		return {
//			i: boundingBox,
			o: elements
		};
	},

	_deleteLeafNode : function(node) {
		// this == node's parent
	},

	_recursiveBuild : function(sortedArraysOfNodes, AABB, localWeight) {
		var numberOfElements = sortedArraysOfNodes[0].length;

		if(numberOfElements <= this._minLeaf) return this._makeLeafNode(
			this.nodeHelpers.makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		// scan across all sorrted-axises for a best fit
		var bestSplit = this.treeBuilder.getBestSplit(sortedArraysOfNodes, AABB, localWeight);

		// If it is cheaper to build a leaf, do so
		if(!bestSplit) return this._makeLeafNode(
			this.nodeHelpers.makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		// Make each node's AABB
		var leftAABB = AABB.clone(),
		    rightAABB = AABB.clone(),
		    newArraysOfSortedNodes = this.nodeHelpers.splitSortedNodeArrays(
		    	sortedArraysOfNodes,
		    	bestSplit.axis,
		    	bestSplit.index,
		    	bestSplit.left,
		    	bestSplit.right);

		leftAABB.max[bestSplit.axis] = bestSplit.left;
		rightAABB.min[bestSplit.axis] = bestSplit.right;

		// make and return a new node
		// call recursive_build twice for each node
		return this._makeSplittingNode(
			bestSplit.left,
			bestSplit.right,
			this._recursiveBuild(newArraysOfSortedNodes[0], leftAABB, bestSplit.leftWeight),
			this._recursiveBuild(newArraysOfSortedNodes[1], rightAABB, bestSplit.rightWeight),
			bestSplit.axis + 1,
			bestSplit.cost
		);
	},

	_incrementalBuild : function(unfinishedNode){
		var sortedArraysOfNodes = unfinishedNode.s,
		    AABB = unfinishedNode.i,
		    numberOfElements = sortedArraysOfNodes[0].length,
		    localWeight = unfinishedNode.w;

		if(numberOfElements <= this._minLeaf) return this._makeLeafNode(
			this.nodeHelpers.makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		// scan across all sorrted-axises for a best fit
		var bestSplit = this.treeBuilder.getBestSplit(sortedArraysOfNodes, AABB, localWeight);

		// If it is cheaper to build a leaf, do so
		if(!bestSplit) return this._makeLeafNode(
			this.nodeHelpers.makeMBV(sortedArraysOfNodes[0]), sortedArraysOfNodes[0]);

		// Make each node's new AABB
		var leftAABB = AABB.clone(),
		    rightAABB = AABB.clone(),
		    newArraysOfSortedNodes = this.nodeHelpers.splitSortedNodeArrays(
		    	sortedArraysOfNodes,
		    	bestSplit.axis,
		    	bestSplit.index,
		    	bestSplit.left,
		    	bestSplit.right);

		leftAABB.max[bestSplit.axis] = bestSplit.left;
		rightAABB.min[bestSplit.axis] = bestSplit.right;

		// make and return a new node
		return this._makeSplittingNode(
			bestSplit.left,
			bestSplit.right,
			this._makeUnfinishedNode(leftAABB, newArraysOfSortedNodes[0], bestSplit.leftWeight),
			this._makeUnfinishedNode(rightAABB, newArraysOfSortedNodes[1], bestSplit.rightWeight),
			bestSplit.axis + 1,
			bestSplit.cost
		);
	},

	buildFromArrayOfNodes : function(arrayOfNodes, deferredBuild){
		//make sorted lists of nodes. one list per axis sorted by min aabb
		var sortedArraysOfNodes = this.nodeHelpers.makeSortedArrays(arrayOfNodes),
		    totalWeight = this.nodeHelpers.makeWeight(arrayOfNodes);

		this.i = this.nodeHelpers.makeMBV(arrayOfNodes);

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
		    doLeft = [],
		    currentNode,
		    wasLeft,
		//make sorted lists of nodes. one list per axis sorted by min aabb
		    sortedArraysOfNodes = this.nodeHelpers.makeSortedArrays(arrayOfNodes),
		    totalWeight = this.nodeHelpers.makeWeight(arrayOfNodes),
		    thisTree = this;

		this.i = this.nodeHelpers.makeMBV(arrayOfNodes);

		// Make root..
		this._T = this._incrementalBuild(this._makeUnfinishedNode(this.i, sortedArraysOfNodes, totalWeight));
		if(this._T.o) return finishedCallback();
		nodesTodo.push(this._T);
		doLeft.push(true);

		if(progressCallback)
			progressCallback({phase: "Building acceleration structure...", percent: 0});

		process.nextTick(makeTree);

		function makeTree() {
			var startTime = Date.now();
			while(nodesTodo.length) {
				if(Date.now() - startTime > 1000) {
					if(progressCallback)
						progressCallback({percent: finishedElementCount / totalElementsCount * 100});
					return process.nextTick(makeTree);
				}

				currentNode = nodesTodo.pop();
				wasLeft = doLeft.pop();

				if(!wasLeft) {
					currentNode.r = thisTree._incrementalBuild(currentNode.r);
					if(currentNode.r.o) {
						finishedElementCount += currentNode.r.o.length;
					} else {
						nodesTodo.push(currentNode.r);
						doLeft.push(true);
					}
				} else {
					currentNode.l = thisTree._incrementalBuild(currentNode.l);
					nodesTodo.push(currentNode);
					doLeft.push(false);
					if(currentNode.l.o) {
						finishedElementCount += currentNode.l.o.length;
					} else {
						nodesTodo.push(currentNode.l);
						doLeft.push(true);
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

	// tree.each (recursive)
	// go over each node and leaf in the tree (depth-first) and execute the provided
	// callback functions.
	// Very useful for drawing the tree, counting nodes, ect.
	each : function(nodeCallback, leafCallback) {
		function iterate(node, currentAABB, depth){
			var axis,
			    leftAABB,
			    rightAABB, retVal;

			if(node.x){
				axis = node.x - 1;

				leftAABB = currentAABB.clone();
				leftAABB.max[axis] = node.u;

				rightAABB = currentAABB.clone();
				rightAABB.min[axis] = node.v;

				if(nodeCallback) retVal = nodeCallback(node, leftAABB, rightAABB, depth);
				if(!retVal) return;

				iterate(node.l, leftAABB, depth+1);
				iterate(node.r, rightAABB, depth+1);
			} else if(node.o) {
				if(leafCallback) leafCallback(node, currentAABB, depth);
			}
		}

		iterate(this._T, this.i, 0);
	},

	// tree.intersectStep 
	// intersect the tree with ray returning the earliest element that hits the ray
	// returns information to a callback and provides a next function to continue 
	// traversal
	//
	// Based on Havran's TA-B -
	// Modified for BIH with several new cases:
	//  - I1 (ray enters between planes, exits in left node)
	//  - I2 (ray enters between planes, exits in right node)
	//  - I3 (ray enters between planes, exits between planes)
	//  - B1 (Ray enters in both planes, exits both)
	//  - B2 (Ray enters in both planes, exits left)
	//  - B3 (Ray enters in both planes, exits right)
	//
	// Modified for incremental(on-demand?) tree building
	//
	// stepCallback(node, rs, currentAABB, wasLeft, depth, next)
	intersectStep : function(ray, intersectInfo, stepCallback, finishedCallback) {
		var parentStack = [], // Contains the nodes that are parents of the hit nodes
		    rayStack = [], // Contains the ray-segment for the current sub-tree
		    depthStack = [], // Just for depth determining. debugging stuff.
		    directionStack = [], // Which was the last direction taken - true = left
		    aabbStack = [],
		    currentAABB = this.i.clone(),
		    tempAABB,
		    lastDirectionWasLeft = true,
		    rayIntervals = ray.toIntervals(),
		    majorAxis = ray.getMajorAxis(),
		    node = null,
		    parentNode = null,
		    rs = null,
		    axis = null,
		    newRS = null,
		    bestSegment = this.segmentHelpers.cloneSegment(rayIntervals),
		    leafElementCount,
		    leafElement = null,
		    noDebug = true,
		    debug = null,
		    thisTree = this;

		if(intersectInfo.debug) {
			noDebug = false;
			debug = intersectInfo.debug;
			depthStack = [];
		}

		// Test ray AABB first
		rs = this.i.intersectWithSegment(rayIntervals);

		// If there are no elements or the ray-AABB test failed, don't bother traversing
		if (rs && this._T !== null) {
			node = this._T;
		} else {
			return stepCallback(null, rs, currentAABB, null, 0, null);
		}

		stepCallback(node, rs, currentAABB, null, 0, step);

		function step() {
			while( (node !== null) || parentStack.length > 0) {
				if(!noDebug) debug.currDepth++;

				if(node === null) {
					rs = rayStack.pop(); // Depth-First Descent
					parentNode = parentStack.pop();
					lastDirectionWasLeft = directionStack.pop();
					currentAABB = aabbStack.pop();
					if(!noDebug) {
						debug.depth = Math.max(debug.depth, debug.currDepth);
						debug.currDepth = depthStack.pop();
					}


					if(lastDirectionWasLeft)
						node = parentNode.l;
					else
						node = parentNode.r;
				}

				// Check to see if this node is still reachable
				if(intersectInfo.isHit) {
					if(!thisTree.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) {
						node = null;
						continue;
					}
				}

				if(!noDebug) debug.costT++;

				if(node.s) { // An unfinished node!
					node = thisTree._incrementalBuild(node);
					if(parentNode == null) {
						thisTree._T = node;
					} else {
						if(lastDirectionWasLeft)
							parentNode.l = node;
						else
							parentNode.r = node;
					}
				}

				// Below is not an "else if" because we want to continue traversal during an incremental build
				if (node.x) { // A node!
					axis = node.x - 1; // Axis: 1 = x, 2 = y, 3 = z ...
					// Cases where entry point is between *both* splitting planes
					if (rs[axis].a < node.v && rs[axis].a > node.u) {
						if (rs[axis].b <= node.u) { // Is the exit point inside the left node?
							/* case I1 */
							// The ray enters the volume between the planes so
							// we need to clip the ray start for this case
							thisTree.segmentHelpers.clipSegmentStartInPlace(rs, axis, node.u);
							parentNode = node;
							lastDirectionWasLeft = true;
							currentAABB.max[axis] = node.u;
							node = node.l;
						} else if (rs[axis].b >= node.v) { // Is the exit point inside the right node?
							/* case I2 */
							// The ray enters the volume between the planes so
							// we need to clip the ray start for this case
							thisTree.segmentHelpers.clipSegmentStartInPlace(rs, axis, node.v);
							parentNode = node;
							lastDirectionWasLeft = false;
							currentAABB.min[axis] = node.v;
							node = node.r;
						} // If start is between both planes,
						// the end point CAN NOT be in BOTH nodes - it is unpossible
						 else {
							node = null;
						}
					} else if (rs[axis].a <= node.u) { // Starts in left node
						if (rs[axis].a >= node.v) { // Also in right node!
							// If we exit and are no longer in the right node, we must clip the ray
							if (rs[axis].b < node.v) {
								newRS = thisTree.segmentHelpers.clipSegmentEnd(rs, axis, node.v);
							} else {
								newRS = thisTree.segmentHelpers.cloneSegment(rs);
							}
							// This will be popped later, so right = far node
							rayStack.push(newRS);
							parentStack.push(node);
							directionStack.push(false);
							tempAABB = currentAABB.clone();
							tempAABB.min[axis] = node.v;
							aabbStack.push(tempAABB);
							if(!noDebug) depthStack.push(debug.currDepth);
							
							// If we exit and are no longer in the left node, we must clip the ray
							if (rs[axis].b > node.u) {
								thisTree.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
							}
							// This will be popped first, so left = near node
							parentNode = node;
							lastDirectionWasLeft = true;
							currentAABB.max[axis] = node.u;
							node = node.l;
						} else if (rs[axis].b < node.v) { // We are exiting before the right plane
							if (rs[axis].b <= node.u) {
								// We are exiting before the left plane
								/* cases N1,N2,N3,P5,Z2,Z3 */
								parentNode = node;
								lastDirectionWasLeft = true;
								currentAABB.max[axis] = node.u;
								node = node.l;
							} else {
								// The ray exits the volume between the planes so
								// we need to clip the ray end for this case
								thisTree.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
								parentNode = node;
								lastDirectionWasLeft = true;
								currentAABB.max[axis] = node.u;
								node = node.l;
							}
						} else { // The ray exits on the far side of the right plane
							/* case N4 */
							// This will be popped later, so right = far node
							newRS = thisTree.segmentHelpers.clipSegmentStart(rs, axis, node.v);

							rayStack.push(newRS);
							parentStack.push(node);
							directionStack.push(false);
							tempAABB = currentAABB.clone();
							tempAABB.min[axis] = node.v;
							aabbStack.push(tempAABB);
							if(!noDebug) depthStack.push(debug.currDepth);

							// This will be popped first, so left = near node
							thisTree.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
							parentNode = node;
							lastDirectionWasLeft = true;
							currentAABB.max[axis] = node.u;
							node = node.l;
						}
					} else if (rs[axis].a >= node.v) { // Starts in right node
						if (rs[axis].b > node.u) { // Ray exits before the left plane
							if (rs[axis].b >= node.v) { // Ray exits before the right plane
								/* cases P1,P2,P3,N5,Z1 */
								parentNode = node;
								lastDirectionWasLeft = false;
								currentAABB.min[axis] = node.v;
								node = node.r;
							} else { /* cases P1,P2,P3,N5,Z1 */
								// we need to clip the ray end for this case
								thisTree.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.v);
								parentNode = node;
								lastDirectionWasLeft = false;
								currentAABB.min[axis] = node.v;
								node = node.r;
							}
						} else { // Ray hits both planes
							/* case P4 */
							// This will be popped later, so left = far node
							newRS = thisTree.segmentHelpers.clipSegmentStart(rs, axis, node.u);
							rayStack.push(newRS);
							parentStack.push(node);
							directionStack.push(true);
							tempAABB = currentAABB.clone();
							tempAABB.max[axis] = node.u;
							aabbStack.push(tempAABB);
							if(!noDebug) depthStack.push(debug.currDepth);

							// This will be popped first, so right = near node
							thisTree.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.v);
							parentNode = node;
							lastDirectionWasLeft = false;
							currentAABB.min[axis] = node.v;
							node = node.r;
						}
					} else {
						node = null;
					}
				}

				if (node && node.x) return stepCallback(node, rs, currentAABB, lastDirectionWasLeft, debug.currDepth, step);

				if (node && node.o) { // A leaf!!
					leafElementCount = node.o.length;
					while(leafElementCount-->0) {
						if(!noDebug) debug.costI++;

						leafElement = node.o[leafElementCount];
						leafElement.iFn.call(leafElement.o, ray, intersectInfo);

						if(intersectInfo.isHit) {
							thisTree.segmentHelpers.setBestSegment(bestSegment, intersectInfo.position);
						}
					}// end while each element

					// Causes the loop to pop far-node candidates from the stack
					stepCallback(node, rs, currentAABB, lastDirectionWasLeft, debug.currDepth, step);
					node = null;
					return;
				}
			}// end of main while()
			if(!noDebug) debug.depth = Math.max(debug.depth, debug.currDepth);
			if(finishedCallback) finishedCallback(intersectInfo);
		}
	},

	// tree.intersect (non-recursive)
	// intersect the tree with ray returning the earliest element that hits the ray
	//
	// Based on Havran's TA-B -
	// Modified for BIH with several new cases:
	//  - I1 (ray enters between planes, exits in left node)
	//  - I2 (ray enters between planes, exits in right node)
	//  - I3 (ray enters between planes, exits between planes)
	//  - B1 (Ray enters in both planes, exits both)
	//  - B2 (Ray enters in both planes, exits left)
	//  - B3 (Ray enters in both planes, exits right)
	//
	// Modified for incremental(on-demand?) tree building
	intersect : function(ray, intersectInfo) {
		var parentStack = [], // Contains the nodes that are parents of the hit nodes
		    rayStack = [], // Contains the ray-segment for the current sub-tree
		    depthStack = [], // Just for depth determining. debugging stuff.
		    directionStack = [], // Which was the last direction taken - true = left
		    lastDirectionWasLeft = true,
		    rayIntervals = ray.toIntervals(),
		    majorAxis = ray.getMajorAxis(),
		    node = null,
		    parentNode = null,
		    rs = null,
		    axis = null,
		    newRS = null,
		    bestSegment = this.segmentHelpers.cloneSegment(rayIntervals),
		    leafElementCount,
		    leafElement = null,
		    noDebug = true,
		    debug = null;

		if(intersectInfo.debug) {
			noDebug = false;
			debug = intersectInfo.debug;
			depthStack = [];
		}

		// Test ray AABB first
//		rs = _intersectSegmentWithAABB(rayIntervals, this.i);
		rs = this.i.intersectWithSegment(rayIntervals);

		// If there are no elements or the ray-AABB test failed, don't bother traversing
		if (rs && this._T !== null) {
			node = this._T;
		} else {
			return;
		}

		while( (node !== null) || parentStack.length > 0) {
			if(!noDebug) debug.currDepth++;

			if(node === null) {
				rs = rayStack.pop(); // Depth-First Descent
				parentNode = parentStack.pop();
				lastDirectionWasLeft = directionStack.pop();
				if(!noDebug) {
					debug.depth = Math.max(debug.depth, debug.currDepth);
					debug.currDepth = depthStack.pop();
				}


				if(lastDirectionWasLeft)
					node = parentNode.l;
				else
					node = parentNode.r;
			}

			// Check to see if this node is still reachable - this is buggy
			if(intersectInfo.isHit) {
				if(!this.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) {
					node = null;
					continue;
				}
			}

			if(node.s) { // An unfinished node!
				node = this._incrementalBuild(node);
				if(parentNode == null) {
					this._T = node;
				} else {
					if(lastDirectionWasLeft)
						parentNode.l = node;
					else
						parentNode.r = node;
				}
			}

			// Below is not an "else if" because we want to continue traversal during an incremental build
			if (node.x) { // A node!
				axis = node.x - 1; // Axis: 1 = x, 2 = y, 3 = z ...
				// Cases where entry point is between *both* splitting planes
				if (rs[axis].a < node.v && rs[axis].a > node.u) {
					if (rs[axis].b <= node.u) { // Is the exit point inside the left node?
						/* case I1 */
						// The ray enters the volume between the planes so
						// we need to clip the ray start for this case
						this.segmentHelpers.clipSegmentStartInPlace(rs, axis, node.u);
						parentNode = node;
						lastDirectionWasLeft = true;
						node = node.l;
					} else if (rs[axis].b >= node.v) { // Is the exit point inside the right node?
						/* case I2 */
						// The ray enters the volume between the planes so
						// we need to clip the ray start for this case
						this.segmentHelpers.clipSegmentStartInPlace(rs, axis, node.v);
						parentNode = node;
						lastDirectionWasLeft = false;
						node = node.r;
					} // If start is between both planes,
					// the end point CAN NOT be in BOTH nodes - it is unpossible
					 else {
						node = null;
					}
				} else if (rs[axis].a <= node.u) { // Starts in left node
					if (rs[axis].a >= node.v) { // Also in right node!
						// If we exit and are no longer in the right node, we must clip the ray
						if (rs[axis].b < node.v) {
							newRS = this.segmentHelpers.clipSegmentEnd(rs, axis, node.v);
						} else {
							newRS = this.segmentHelpers.cloneSegment(rs);
						}
						// This will be popped later, so right = far node
						rayStack.push(newRS);
						parentStack.push(node);
						directionStack.push(false);
						if(!noDebug) depthStack.push(debug.currDepth);
						
						// If we exit and are no longer in the left node, we must clip the ray
						if (rs[axis].b > node.u) {
							this.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
						}
						// This will be popped first, so left = near node
						parentNode = node;
						lastDirectionWasLeft = true;
						node = node.l;
					} else if (rs[axis].b < node.v) { // We are exiting before the right plane
						if (rs[axis].b <= node.u) {
							// We are exiting before the left plane
							/* cases N1,N2,N3,P5,Z2,Z3 */
							parentNode = node;
							lastDirectionWasLeft = true;
							node = node.l;
						} else {
							// The ray exits the volume between the planes so
							// we need to clip the ray end for this case
							this.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
							parentNode = node;
							lastDirectionWasLeft = true;
							node = node.l;
						}
					} else { // The ray exits on the far side of the right plane
						/* case N4 */
						// This will be popped later, so right = far node
						newRS = this.segmentHelpers.clipSegmentStart(rs, axis, node.v);

						rayStack.push(newRS);
						parentStack.push(node);
						directionStack.push(false);
						if(!noDebug) depthStack.push(debug.currDepth);

						// This will be popped first, so left = near node
						this.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.u);
						parentNode = node;
						lastDirectionWasLeft = true;
						node = node.l;
					}
				} else if (rs[axis].a >= node.v) { // Starts in right node
					if (rs[axis].b > node.u) { // Ray exits before the left plane
						if (rs[axis].b >= node.v) { // Ray exits before the right plane
							/* cases P1,P2,P3,N5,Z1 */
							parentNode = node;
							lastDirectionWasLeft = false;
							node = node.r;
						} else { /* cases P1,P2,P3,N5,Z1 */
							// we need to clip the ray end for this case
							this.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.v);
							parentNode = node;
							lastDirectionWasLeft = false;
							node = node.r;
						}
					} else { // Ray hits both planes
						/* case P4 */
						// This will be popped later, so left = far node
						newRS = this.segmentHelpers.clipSegmentStart(rs, axis, node.u);
						rayStack.push(newRS);
						parentStack.push(node);
						directionStack.push(true);
						if(!noDebug) depthStack.push(debug.currDepth);

						// This will be popped first, so right = near node
						this.segmentHelpers.clipSegmentEndInPlace(rs, axis, node.v);
						parentNode = node;
						lastDirectionWasLeft = false;
						node = node.r;
					}
				} else {
					node = null;
				}
			}

			if (node && node.o) { // A leaf!!
				leafElementCount = node.o.length;
				while(leafElementCount-->0) {
					leafElement = node.o[leafElementCount];
					leafElement.iFn.call(leafElement.o, ray, intersectInfo);

					if(intersectInfo.isHit) {
						this.segmentHelpers.setBestSegment(bestSegment, intersectInfo.position);
					}
				}// end while each element

				// Causes the loop to pop far-node candidates from the stack
				node = null;
			}
		}// end of main while()
		if(!noDebug) debug.depth = Math.max(debug.depth, debug.currDepth);
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

	// tree.overlaps (non-recursive) -
	// Search a region defined by testAABB and return an array of all elements
	// that overlap this region.
	//
	// Posible node-intervals cases during traversal:
	//   B0 - Interval starts in left, ends in right;
	//   L0 - Interval starts in left, ends in left;
	//   L1 - Interval starts in left, ends in gap;
	//   R0 - Interval starts in right, ends in right;
	//   R1 - Interval starts in gap, ends in right;
	//   G0 - Interval starts in gap, ends in gap;
	// Modified for incremental(on-demand?) tree building
	_search : function(testAABB, returnArray, aabbTestFunction, leafTestFunction, useAlteredLogic) {
		var parentStack = [], // Contains the nodes that are parents of the hit nodes
		    directionStack = [], // Which was the last direction taken - true = left
		    lastDirectionWasLeft = true,
		    returnArray = returnArray || [],
		    node = null,
		    parentNode = null,
		    axis = null,
		    leafElementCount,
		    leafElement = null,
		    overlaps, contained,
		    alteredLogic = !!useAlteredLogic;

		if(this._T === null) return returnArray;

		overlaps = testAABB.overlaps(this.i);
		contained = testAABB[aabbTestFunction](this.i);

		if(overlaps) {
			if(!alteredLogic){
				node = this._T;
			} else {
				if(contained) node = this._T;
				else return returnArray;
			}
		} else {
			return returnArray;
		}

		while( (node != null) || parentStack.length > 0) {

			if(node == null) {
				parentNode = parentStack.pop();
				lastDirectionWasLeft = directionStack.pop();

				if(lastDirectionWasLeft)
					node = parentNode.l;
				else
					node = parentNode.r;
			}

			if(node.s) { // An unfinished node!
				node = this._incrementalBuild(node);
				if(parentNode == null) {
					this._T = node;
				} else {
					if(lastDirectionWasLeft)
						parentNode.l = node;
					else
						parentNode.r = node;
				}
			}

			// Below is not an "else if" because we want to continue traversal during 
			// an incremental build
			if (node.x) { // A node!
				axis = node.x - 1; // Axis: 1 = x, 2 = y, 3 = z ... so on
				// Cases where entry point is between *both* splitting planes
				
				if(testAABB.min[axis] <= node.u) { // Starts in left node
					if(testAABB.max[axis] >= node.v) { // B0 Ends in right - Both nodes
						if(!alteredLogic || testAABB.min[axis] >= node.v) {
							parentStack.push(node);
							directionStack.push(false);
						}
					} // L0, L1, Left node
					if(!alteredLogic || testAABB.max[axis] <= node.u) {
						parentNode = node;
						lastDirectionWasLeft = true;
						node = node.l;
					} else {
						node = null;
					}
				} else if(testAABB.max[axis] >= node.v) { // Ends in right
					// R0, R1 - only Right node
					if(!alteredLogic || testAABB.min[axis] >= node.v) {
						parentNode = node;
						lastDirectionWasLeft = false;
						node = node.r;
					} else {
						node = null;
					}
				} else { // G0 - no nodes
					node = null;
				}
			}

			if (node && node.o) { // A Leaf !!
				leafElementCount = node.o.length;
				while(leafElementCount-->0) {
					leafElement = node.o[leafElementCount];
					leafElement[leafTestFunction].call(leafElement.o, testAABB, returnArray);
				}
				node = null;
			}
		}// end of main while()
		return (returnArray);
	},

	toJSON : function() {
		return JSON.stringify(this._T);
	}
};

module.exports = BIH;