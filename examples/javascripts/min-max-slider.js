$(function(){

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

	function onSlider(e) {
		var dims = getRanges(e);
		var percent1 = dims.ranges[0]/dims.total;
		var percent2 = dims.ranges[1]/dims.total;
		minDepth = Math.floor(percent1 * 10);
		maxDepth = Math.floor((percent1 + percent2) * 10);
		$("#min-depth").text(minDepth);
		$("#max-depth").text(maxDepth);
		drawTreeLevel(tree._T, tree.i, 0);
	}

	$("#tree-range-slider").colResizable({
		liveDrag:true, 
		draggingClass:"rangeDrag", 
		gripInnerHtml:"<div class='rangeGrip'></div>", 
		onDrag: onSlider,
		minWidth:[0, 0, 0]
	});

	$("#min-depth").text(minDepth);
	$("#max-depth").text(maxDepth);
});
