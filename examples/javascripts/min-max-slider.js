function initMinMaxSlider(tree, nodes, drawTree, overlayContext, worldContext, interactionContext, colorInfo, generateNodes){
	"use strict";

	var minDepth = 0;
	var maxDepth = 15;
	var builders = require('../helpers/builders');
	var nextStep;
	var currentRay;
	var startPos;
	var endPos;

	var getRanges = function(e) {
		var columns = $(e.currentTarget).find("td");
		var ranges = [], total = 0, i, w;
		for(i = 0; i<columns.length; i++){
			w = columns.eq(i).width()- 2 - (i==0?1:0);
			w = Math.max(0, w);
			ranges.push(w);
			total+=w;
		}
		return {ranges:ranges, total:total};
	};

	function onCountSlider(e) {
		var dims = getRanges(e);
		var percent = dims.ranges[0]/dims.total;
		var numNodes = Math.floor(percent * 990) + 10;
		$("#node-count").text(numNodes);

		nodes.length = numNodes;
		asyncEach(nodes, generateNodes, null, function(err, n){
			tree.buildFromArrayOfNodes(n, false);
			drawNodes(worldContext, nodes, colorInfo);
			drawTree(overlayContext, tree, minDepth, maxDepth);
		});
	}

	$("#node-count-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onCountSlider,
		minWidth:[0, 0]
	});

	function onSizeSlider(e) {
		var dims = getRanges(e);
		var percent1 = dims.ranges[0]/dims.total;
		var percent2 = dims.ranges[1]/dims.total;
		minNodeSize = Math.floor(percent1 * 63) + 1;
		maxNodeSize = Math.floor((percent1 + percent2) * 63) + 1;

		$('#min-size').text(minNodeSize);
		$('#max-size').text(maxNodeSize);

		asyncEach(nodes, generateNodes, null, function(err, n){
			tree.buildFromArrayOfNodes(n, false);
			drawNodes(worldContext, nodes, colorInfo);
			drawTree(overlayContext, tree, minDepth, maxDepth);
		});
	}

	$("#node-size-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onSizeSlider,
		minWidth:[0, 0, 0]
	});

	function onRenderingSlider(e) {
		var dims = getRanges(e);
		var percent1 = dims.ranges[0]/dims.total;
		var percent2 = dims.ranges[1]/dims.total;
		minDepth = Math.floor(percent1 * 15);
		maxDepth = Math.floor((percent1 + percent2) * 15);
		$("#min-depth").text(minDepth);
		$("#max-depth").text(maxDepth);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$("#tree-range-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onRenderingSlider,
		minWidth:[0, 3, 0]
	});

	function onMinMaxSlider(e) {
		var dims = getRanges(e);
		var percent1 = dims.ranges[0]/dims.total;
		var percent2 = dims.ranges[1]/dims.total;
		var minLeaf = Math.floor(percent1 * 63) + 1;
		var maxLeaf = Math.floor((percent1 + percent2) * 63) + 1;
		$("#min-leaf").text(minLeaf);
		$("#max-leaf").text(maxLeaf);
		tree._minLeaf = minLeaf;
		tree._maxLeaf = maxLeaf;
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$("#tree-min-max-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onMinMaxSlider,
		minWidth:[0, 2, 0]
	});

	function onChangeHueristic(e) {
		var inputs = $('input[name="build-hueristic"]');
		var hueristic = "SAH";
		inputs.each(function(){ if(this.checked) hueristic = this.value; });
		tree.treeBuilder = builders[hueristic](tree);
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$('input[name="build-hueristic"]').change(onChangeHueristic);

	function onIntersectionSlider(e) {
		var dims = getRanges(e);
		var percent = dims.ranges[0]/dims.total;
		var intersectionCost = Math.round(percent * 1000)/10 + 1;
		$("#cost-intersect").text(intersectionCost);
		tree._kI = intersectionCost;
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$("#tree-intersection-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onIntersectionSlider,
		minWidth:[0, 0]
	});


	function onTraversalSlider(e) {
		var dims = getRanges(e);
		var percent = dims.ranges[0]/dims.total;
		var traversalCost = Math.round(percent * 1000)/10;
		$("#cost-traversal").text(traversalCost);
		tree._kT = traversalCost;
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$("#tree-traversal-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onTraversalSlider,
		minWidth:[0, 0]
	});


	function onOverlapSlider(e) {
		var dims = getRanges(e);
		var percent = dims.ranges[0]/dims.total;
		var overlapBonus = Math.round(percent * 2000)/100;
		$("#bonus-overlap").text(overlapBonus);
		tree._kO = overlapBonus;
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(overlayContext, tree, minDepth, maxDepth);
	}

	$("#tree-overlap-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onOverlapSlider,
		minWidth:[0, 0]
	});

	drawTree(overlayContext, tree, minDepth, maxDepth);

	$("#min-depth").text(minDepth);
	$("#max-depth").text(maxDepth);

	$("#min-leaf").text(tree._minLeaf);
	$("#max-leaf").text(tree._maxLeaf);

	$("#cost-intersect").text(tree._kI);
	$("#cost-traversal").text(tree._kT);
	$("#bonus-overlap").text(tree._kO);

	$('#node-count').text(nodes.length);

	$('#min-size').text(minNodeSize);
	$('#max-size').text(maxNodeSize);

	function drawBox(currentAABB, wasLeft, noFill) {
		if(wasLeft === true) {
			interactionContext.strokeStyle = "rgb(0,0,200)";
			interactionContext.fillStyle = "rgba(0,0,200, 0.05)";
		} else if(wasLeft === false) {
			interactionContext.strokeStyle = "rgb(200,0,0)";
			interactionContext.fillStyle = "rgba(200,0,0, 0.05)";
		} else {
			interactionContext.strokeStyle = "rgb(50,50,50)";
			interactionContext.fillStyle = "rgba(50,50,50, 0.05)";
		}
		if(!noFill) {
			interactionContext.fillRect(
				(currentAABB.min[0] * zoom) - canv_off_x + 1,
				(currentAABB.min[1] * zoom) - canv_off_y + 1,
				(currentAABB.max[0] - currentAABB.min[0]) * zoom - 2,
				(currentAABB.max[1] - currentAABB.min[1]) * zoom - 2);
		}
		interactionContext.strokeRect(
			(currentAABB.min[0] * zoom) - canv_off_x,
			(currentAABB.min[1] * zoom) - canv_off_y,
			(currentAABB.max[0] - currentAABB.min[0]) * zoom,
			(currentAABB.max[1] - currentAABB.min[1]) * zoom);

	}
	$("#ray-restart").on("click", redoRay);

	function redoRay() {
		var startOfRay = V2.add(startPos, V2.$(canv_off_x, canv_off_y));
		var endOfRay = V2.add(endPos, V2.$(canv_off_x, canv_off_y));

		var rayDir = V2.sub(endOfRay, startOfRay);
		var rayLength = V2.length(rayDir);

		V2.scale(rayDir, 1 / rayLength, rayDir);

		currentRay = new Ray(startOfRay, rayDir);
		currentRay.maxT = rayLength;
		doRay();
	}

	function doRay() {
		var intersectInfo = new IntersectInfo();
		intersectInfo.debug = {
			currDepth: 0,
			costI: 0,
			costT: 0
		};
		var allBoxes = [];
		var allDirections = [];

		$("#ray-step").off("click").prop("disabled", false);;
		$("#ray-step").on("click", function() {
			nextStep();
		});
		$("#ray-restart").prop("disabled", false);

		tree.intersectStep(
			currentRay,
			intersectInfo,
			function(node, rs, currentAABB, wasLeft, depth, next) {
				nextStep = next;

				allBoxes.push(currentAABB.clone());
				allDirections.push(wasLeft);

				interactionContext.clearRect(0, 0, canv_w, canv_h);
				interactionContext.fillStyle = "rgba(255, 255, 255, 0.35)";
				interactionContext.fillRect(0, 0, canv_w, canv_h);
				interactionContext.lineWidth = 2;

				interactionContext.strokeStyle = "rgba(50, 50, 50, 1)";

				interactionContext.beginPath();
				interactionContext.moveTo(
					startPos[0] * zoom,
					startPos[1] * zoom);
				interactionContext.lineTo(
					endPos[0] * zoom,
					endPos[1] * zoom);
				interactionContext.closePath();
				interactionContext.stroke();

				drawBox(currentAABB, wasLeft);

				interactionContext.strokeStyle = "rgba(50, 250, 50, 1)";
			//			console.log(rs, [(rs[0].a - canv_off_x), (rs[1].a - canv_off_y), (rs[0].b - canv_off_x), (rs[1].b - canv_off_y)])
				// Draw portion of ray between origin and minT
				interactionContext.beginPath();
				interactionContext.moveTo(
					(rs[0].a - canv_off_x) * zoom,
					(rs[1].a - canv_off_y) * zoom);
				interactionContext.lineTo(
					(rs[0].b - canv_off_x) * zoom,
					(rs[1].b - canv_off_y) * zoom);
				interactionContext.closePath();
				interactionContext.stroke();

				interactionContext.clearRect(0, 0, 100, 40);
				interactionContext.fillStyle = "rgb(0,0,0)";

				interactionContext.fillText("# Intersections: " + intersectInfo.debug.costI, 10, 13);
				interactionContext.fillText("# Traversals: " + intersectInfo.debug.costT, 10, 23);
				interactionContext.fillText("Cost of Ray: " + (intersectInfo.debug.costI * tree._kI + intersectInfo.debug.costT * tree._kT), 10, 33);
			},
			function(){
				$("#ray-step").off("click").prop("disabled", true);
				interactionContext.clearRect(0, 0, canv_w, canv_h);
				interactionContext.fillStyle = "rgba(255, 255, 255, 0.35)";
				interactionContext.fillRect(0, 0, canv_w, canv_h);
				interactionContext.lineWidth = 2;

				for(var i = 0; i < allBoxes.length; i++) {
					drawBox(allBoxes[i], allDirections[i], true);
				}

				if(intersectInfo.isHit) {
					interactionContext.strokeStyle = "rgba(250, 50, 50, 1)";
					interactionContext.beginPath();
					interactionContext.moveTo(
						startPos[0] * zoom,
						startPos[1] * zoom);
					interactionContext.lineTo(
						(intersectInfo.position[0] - canv_off_x) * zoom,
						(intersectInfo.position[1] - canv_off_y) * zoom);
					interactionContext.closePath();
					interactionContext.stroke();

					// Draw intersect point
					interactionContext.fillStyle = "rgba(250, 50, 250, 1)";
					interactionContext.beginPath();
					interactionContext.arc(
						(intersectInfo.position[0] - canv_off_x) * zoom,
						(intersectInfo.position[1] - canv_off_y) * zoom,
						4, 0, Math.PI * 2, true);
					interactionContext.fill();
				} else {
					interactionContext.strokeStyle = "rgba(50, 200, 50, 1)";
					interactionContext.beginPath();
					interactionContext.moveTo(
						startPos[0] * zoom,
						startPos[1] * zoom);
					interactionContext.lineTo(
						endPos[0] * zoom,
						endPos[1] * zoom);
					interactionContext.closePath();
					interactionContext.stroke();

				}

				interactionContext.fillStyle = "rgb(0,0,0)";

				interactionContext.fillText("# of Intersections: " + intersectInfo.debug.costI, 10, 13);
				interactionContext.fillText("# of Traversals: " + intersectInfo.debug.costT, 10, 23);
				interactionContext.fillText("Cost of Ray: " + Math.floor(intersectInfo.debug.costI * tree._kI + intersectInfo.debug.costT * tree._kT), 10, 33);
			});
	}

	function startRay() {
		$("#make-ray").prop("disabled", true);
		$("#ray-step").prop("disabled", true);
		
		drawTree(overlayContext, tree, minDepth, maxDepth);

		$("#world-container").on("click", function(e){
			startPos = V2.$(e.offsetX, e.offsetY);

			$("#world-container").off("click");
			$("#ray-restart").prop("disabled", true);

			$("#world-container").on("click", function(e){
				endPos = V2.$(e.offsetX, e.offsetY);

				var startOfRay = V2.add(startPos, V2.$(canv_off_x, canv_off_y));
				var endOfRay = V2.add(endPos, V2.$(canv_off_x, canv_off_y));

				var rayDir = V2.sub(endOfRay, startOfRay);
				var rayLength = V2.length(rayDir);

				V2.scale(rayDir, 1 / rayLength, rayDir);

				currentRay = new Ray(startOfRay, rayDir);
				currentRay.maxT = rayLength;

				$("#world-container").off("click");
				$("#world-container").off("mousemove");
				$("#make-ray").prop("disabled", false).on("click", startRay);
				$("#ray-step").prop("disabled", false).on("click", doRay);
			})

			$("#world-container").on("mousemove", function(e){
				var currentPos = V2.$(e.offsetX, e.offsetY);

				interactionContext.clearRect(0, 0, canv_w, canv_h);

				interactionContext.strokeStyle = "rgba(50, 50, 50, 1)";

				interactionContext.beginPath();
				interactionContext.moveTo(
					startPos[0] * zoom,
					startPos[1] * zoom);
				interactionContext.lineTo(
					currentPos[0] * zoom,
					currentPos[1] * zoom);
				interactionContext.closePath();
				interactionContext.stroke();
			});
		});
	}

	$("#make-ray").on("click", startRay);
}
