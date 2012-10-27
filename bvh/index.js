(function (root, factory) {
		"use strict";

		if (typeof exports === 'object') {
			module.exports = factory(
				require('aabb'),
				require('../helpers/segment.js'),
				require('../helpers/builders'),
				require('../helpers/node.js'));
		} else if (typeof define === 'function' && define.amd) {
			define([
				'/aabb/index',
				'../helpers/segment.js',
				'../helpers/builders/index',
				'../helpers/node.js'
			], factory);
		} else {
			if(!root.BxH) root.BxH = {};
			root.BxH.BVH = factory(
				root.AABB,
				root.BxH.SegmentHelpers,
				root.BxH.TreeBuilders,
				root.BxH.NodeHelpers);
		}
	}(this, function (AABB, SegmentHelpers, TreeBuilders, NodeHelpers) {
		"use strict";

		function BVH(dimensions, leafSizeMin, leafSizeMax, buildAlgorithm) {
			this._dimensions = dimensions || this._dimensions; 

			// The optimal leaf size is dependent on the user agent and model size
			// Chrome : 1-11  ?? Who knows ??
			// Firefox: ~3
			// Opera  : ~?
			// IE     : ~?

			this._minLeaf = leafSizeMin || this._minLeaf; // Minimum leaf size
			this._maxLeaf = leafSizeMax || this._maxLeaf; // Maximum leaf size

			this.treeBuilder = (buildAlgorithm || TreeBuilders.Median)(this);

			this._T = null; // The tree's root
			this.i = null;  // The tree's AABB

			this.segmentHelpers = SegmentHelpers(this._dimensions);
			this.nodeHelpers = NodeHelpers(this._dimensions);
		};

		BVH.prototype = {
			_name: "BVH",
			_dimensions: 3,
			_minLeaf: 2,
			_maxLeaf: 4,
			_kT: 10,  /* = _kT - Cost per node-traversal */
			_kI: 5,   /* = _kI - Cost per intersection test */
			_kO: 10,  /* = _kO - Cost savings for *empty* overlapped area (higher = better) */
			_kB: 1,   /* = _kB - Cost savings for balanced splits (lower = better) */
			useMultiWayNodes: 0, // 0 = 2 way, 1 = 4 way, 2 = 8 way

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


			_recursiveBuild : function(AABB, sortedArraysOfNodes, localWeight){
				var numberOfElements = sortedArraysOfNodes[0].length,
				    makeMBV = this.nodeHelpers.makeMBV.bind(this.nodeHelpers),
				    finalNodes = [];

				this._makeSubpartRecursive(sortedArraysOfNodes, AABB, localWeight, finalNodes, 0);

				return this._makeBoxNode(makeMBV(finalNodes), finalNodes);
			},

			_incrementalBuild : function(unfinishedNode){
				var sortedArraysOfNodes = unfinishedNode.s,
				    AABB = unfinishedNode.i,
				    numberOfElements = sortedArraysOfNodes[0].length,
				    makeMBV = this.nodeHelpers.makeMBV.bind(this.nodeHelpers),
				    localWeight = unfinishedNode.w;

				var finalNodes = [];
				
				this._makeSubpartUnfinished(sortedArraysOfNodes, AABB, localWeight, finalNodes, 0);

				return this._makeBoxNode(makeMBV(finalNodes), finalNodes);
			},

			_buildSubpart : function(sortedArraysOfNodes, AABB, totalWeight){
				var bestSplit = this.treeBuilder.getBestSplit(sortedArraysOfNodes, AABB, totalWeight);

				if(!bestSplit) return false; // Means the builder determined that this node should be a lead

				var newArraysOfSortedNodes = this.nodeHelpers.splitSortedNodeArrays(
					sortedArraysOfNodes,
					bestSplit.axis,
					bestSplit.index,
					bestSplit.left,
					bestSplit.right);

				return {
					leftWeight: bestSplit.leftWeight,
					rightWeight: bestSplit.rightWeight,
					nodes: newArraysOfSortedNodes
				};
			},

			_makeSubpartRecursive : function(sortedArraysOfNodes, AABB, totalWeight, finalNodes, depth) {
				var subPart =
					this._buildSubpart(
						sortedArraysOfNodes,
						AABB,
						totalWeight),
				    makeMBV = this.nodeHelpers.makeMBV.bind(this.nodeHelpers);

				if(!subPart) {
					return finalNodes.push(this._makeLeafNode(
						AABB, sortedArraysOfNodes[0]));
				}

				if(subPart.nodes[0][0].length <= this._minLeaf) {
					finalNodes.push(this._makeLeafNode(
						makeMBV (subPart.nodes[0][0]), subPart.nodes[0][0]));
				} else if(this.useMultiWayNodes <= depth) {
					finalNodes.push(
						this._recursiveBuild(makeMBV(subPart.nodes[0][0]), subPart.nodes[0], subPart.leftWeight)
					);
				} else {
					this._makeSubpartRecursive(
						subPart.nodes[0],
						makeMBV(subPart.nodes[0][0]),
						subPart.leftWeight,
						finalNodes,
						depth + 1);
				}

				if(subPart.nodes[1][0].length <= this._minLeaf) {
					finalNodes.push(this._makeLeafNode(
						makeMBV (subPart.nodes[1][0]), subPart.nodes[1][0]));
				} else if(this.useMultiWayNodes <= depth) {
					finalNodes.push(
						this._recursiveBuild(makeMBV(subPart.nodes[1][0]), subPart.nodes[1], subPart.rightWeight)
					);
				} else {
					this._makeSubpartRecursive(
						subPart.nodes[1],
						makeMBV(subPart.nodes[1][0]),
						subPart.rightWeight,
						finalNodes,
						depth + 1);
				}
			},

			_makeSubpartUnfinished : function(sortedArraysOfNodes, AABB, totalWeight, finalNodes, depth) {
				var subPart =
					this._buildSubpart(
						sortedArraysOfNodes,
						AABB,
						totalWeight),
				    makeMBV = this.nodeHelpers.makeMBV.bind(this.nodeHelpers);

				if(!subPart) {
					return finalNodes.push(this._makeLeafNode(
						AABB, sortedArraysOfNodes[0]));
				}

				if(subPart.nodes[0][0].length <= this._minLeaf) {
					finalNodes.push(this._makeLeafNode(
						makeMBV (subPart.nodes[0][0]), subPart.nodes[0][0]));
				} else if(this.useMultiWayNodes <= depth) {
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPart.nodes[0][0]), subPart.nodes[0], subPart.leftWeight)
					);
				} else {
					this._makeSubpartUnfinished(
						subPart.nodes[0],
						makeMBV(subPart.nodes[0][0]),
						subPart.leftWeight,
						finalNodes,
						depth + 1);
				}

				if(subPart.nodes[1][0].length <= this._minLeaf) {
					finalNodes.push(this._makeLeafNode(
						makeMBV (subPart.nodes[1][0]), subPart.nodes[1][0]));
				} else if(this.useMultiWayNodes <= depth) {
					finalNodes.push(
						this._makeUnfinishedNode(makeMBV(subPart.nodes[1][0]), subPart.nodes[1], subPart.rightWeight)
					);
				} else {
					this._makeSubpartUnfinished(
						subPart.nodes[1],
						makeMBV(subPart.nodes[1][0]),
						subPart.rightWeight,
						finalNodes,
						depth + 1);
				}
			},

			buildFromArrayOfNodes : function(arrayOfNodes, deferredBuild){
				//make sorted lists of nodes. one list per axis sorted by bounds starts
				var sortedArraysOfNodes = this.nodeHelpers.makeSortedArrays(arrayOfNodes),
				    totalWeight = this.nodeHelpers.makeWeight(arrayOfNodes);

				this.i = this.nodeHelpers.makeMBV(arrayOfNodes);

				if(deferredBuild)
					this._T = this._makeUnfinishedNode(this.i, sortedArraysOfNodes, totalWeight);
				else
					this._T = this._recursiveBuild(this.i, sortedArraysOfNodes, totalWeight);
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
				    sortedArraysOfNodes = this.nodeHelpers.makeSortedArrays(arrayOfNodes),
				    totalWeight = this.nodeHelpers.makeWeight(arrayOfNodes),
				    thisTree = this;

				this.i = this.nodeHelpers.makeMBV(arrayOfNodes);

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

			each : function(nodeCallback, leafCallback) {
				function iterate(node, depth){
					var i, childNode, retVal = true;
					if(node.n) {
						i = node.n.length;
						if(nodeCallback) retVal = nodeCallback(node, depth);
						while(retVal && i--) {
							childNode = node.n[i];
							iterate(childNode, depth+1);
						}
					} else if(node.o) {
						if(leafCallback) leafCallback(node, depth);
					}
				}
				iterate(this._T, 0);
			},

			intersectStep : function (ray, intersectInfo, stepCallback, finishedCallback) {
				var parentStack = [],
				    rayStack = [], // Contains the ray-segment for the current sub-tree
				    depthStack = null,
				    rayIntervals = ray.toRaySegment(),
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
				    debug = null,
				    thisTree = this,
				    step,
				    subStep;

				if(intersectInfo.debug) {
					noDebug = false;
					debug = intersectInfo.debug;
					depthStack = [];
				}

				if("s" in this._T) { // An unfinished node!
					this._T = this._incrementalBuild(this._T);
				}

				intersectPoints = this.i.intersectWithSegment(rayIntervals);
				if (intersectPoints === false) {
					if(finishedCallback) return finishedCallback(intersectInfo);
					return;
				}

				// We must cheat if the root of the tree is a leaf
				if("o" in this._T)
					parentStack.push({n:[this._T]});
				else
					parentStack.push(this._T);

				if(!noDebug) depthStack.push(debug.currDepth);
				rayStack.push(intersectPoints);

				step = function() {
					while (parentStack.length > 0) {

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
							if(!thisTree.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) {
								continue;
							}
						}
						if(!noDebug) debug.costT++;

						subStep = function() {
							while(i-->0) {
								ltree = nodes[i];

								// Check to see if this node is still reachable
								if(intersectInfo.isHit) {
									if(!thisTree.segmentHelpers.trimSegmentInPlace(bestSegment, rs, majorAxis)) //{
										continue;
								}

								intersectPoints = ltree.i.intersectWithSegment(rs);

								if (intersectPoints !== false) {

									if(ltree.s) { // An unfinished node!
										ltree = thisTree._incrementalBuild(ltree);
										parentNode.n[i] = ltree;
									}

									if (ltree.n) { // Not a Leaf
										rayStack.push(intersectPoints);
										parentStack.push(ltree);
										if(!noDebug) depthStack.push(debug.currDepth+1);
										return stepCallback(ltree, intersectPoints, ltree.i, false, debug.currDepth, subStep);
									} else if (ltree.o) { // A Leaf !!
										leafElementCount = ltree.o.length;
										while(leafElementCount-->0) {
											if(!noDebug) debug.costI++;

											leafElement = ltree.o[leafElementCount];
											leafElement.iFn.call(leafElement.o, ray, intersectInfo);

											if(intersectInfo.isHit) {
												thisTree.segmentHelpers.setBestSegment(bestSegment, intersectInfo.position);
											}
										}// end while each element
										return stepCallback(ltree, intersectPoints, ltree.i, true, debug.currDepth, subStep);
									}
								}
							}
							step(); // Continue outer loop!
						};
						if(parentNode === thisTree._T) return stepCallback(parentNode, rs, parentNode.i, false, debug.currDepth, subStep);
						else return subStep();
					}
					if(finishedCallback) return finishedCallback(intersectInfo);
				}
				step();
			},

			intersect : function (ray, intersectInfo) {
				var parentStack = [],
				    rayStack = [], // Contains the ray-segment for the current sub-tree
				    depthStack = null,
				    rayIntervals = ray.toRaySegment(),
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
		return BVH;
}));
