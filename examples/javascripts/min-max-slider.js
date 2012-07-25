function initMinMaxSlider(tree, nodes, drawTree, context){
	var minDepth = 0;
	var maxDepth = 15;
	var builders = require('bxh/helpers/builders');

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

	function onRenderingSlider(e) {
		var dims = getRanges(e);
		var percent1 = dims.ranges[0]/dims.total;
		var percent2 = dims.ranges[1]/dims.total;
		minDepth = Math.floor(percent1 * 15);
		maxDepth = Math.floor((percent1 + percent2) * 15);
		$("#min-depth").text(minDepth);
		$("#max-depth").text(maxDepth);
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
	}

	$("#tree-range-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onRenderingSlider,
		minWidth:[0, 10, 0]
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
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
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
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
	}

	$('input[name="build-hueristic"]').change(onChangeHueristic);

	function onIntersectionSlider(e) {
		var dims = getRanges(e);
		var percent = dims.ranges[0]/dims.total;
		var intersectionCost = Math.round(percent * 1000)/10 + 1;
		$("#cost-intersect").text(intersectionCost);
		tree._kI = intersectionCost;
		tree.buildFromArrayOfNodes(nodes, false);
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
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
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
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
		drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);
	}

	$("#tree-overlap-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onOverlapSlider,
		minWidth:[0, 0]
	});

	drawTree(context, tree._T, tree.i, minDepth, maxDepth, 0);

	$("#min-depth").text(minDepth);
	$("#max-depth").text(maxDepth);

	$("#min-leaf").text(tree._minLeaf);
	$("#max-leaf").text(tree._maxLeaf);

	$("#cost-intersect").text(tree._kI);
	$("#cost-traversal").text(tree._kT);
	$("#bonus-overlap").text(tree._kO);
}
