
function drawBVHTree(context, node, AABB, minDepth, maxDepth, depth) {
	var axis,
	    nodeCount,
	    childNode;

	if(depth === 0) {
		context.clearRect(0, 0, canv_w, canv_h);
		context.lineWidth = 1.5;
	}

	if(node.n) {
		nodeCount = node.n.length;
		if(depth - 1 <= maxDepth) {
			if(depth - 1 >= minDepth) {
				context.strokeStyle = "rgb(150,0,0)";
				context.fillStyle = "rgba(150,0,0, 0.05)";
				context.strokeRect(
					(node.i.min[0] * zoom) - canv_off_x,
					(node.i.min[1] * zoom) - canv_off_y,
					(node.i.max[0] - node.i.min[0]) * zoom,
					(node.i.max[1] - node.i.min[1]) * zoom);
				context.fillRect(
					(node.i.min[0] * zoom) - canv_off_x,
					(node.i.min[1] * zoom) - canv_off_y,
					(node.i.max[0] - node.i.min[0]) * zoom,
					(node.i.max[1] - node.i.min[1]) * zoom);
			}
			while(nodeCount--) {
				childNode = node.n[nodeCount];
				drawBVHTree(context, childNode, null, minDepth, maxDepth, depth+1);
			}
		}
	} else if(node.o) {
		if(depth - 1 <= maxDepth && depth - 1 >= minDepth) {
			context.strokeStyle = "rgb(0,150,0)";
			context.fillStyle = "rgba(0,150,0, 0.05)";
			context.strokeRect(
				(node.i.min[0] * zoom) - canv_off_x,
				(node.i.min[1] * zoom) - canv_off_y,
				(node.i.max[0] - node.i.min[0]) * zoom,
				(node.i.max[1] - node.i.min[1]) * zoom);
			context.fillRect(
				(node.i.min[0] * zoom) - canv_off_x,
				(node.i.min[1] * zoom) - canv_off_y,
				(node.i.max[0] - node.i.min[0]) * zoom,
				(node.i.max[1] - node.i.min[1]) * zoom);
		}
	}
}

function drawBIHTree(context, node, AABB, minDepth, maxDepth, depth) {
	var axis,
	    leftAABB,
	    rightAABB,
	    overlap,
	    overlapAABB;

	if(depth === 0) {
		context.clearRect(0, 0, canv_w, canv_h);
		context.lineWidth = 1.5;
	}

	if(node.x){
		axis = node.x - 1;

		if(depth <= maxDepth) {
			leftAABB = AABB.clone();
			leftAABB.max[axis] = node.u;

			rightAABB = AABB.clone();
			rightAABB.min[axis] = node.v;

			drawBIHTree(context, node.l, leftAABB, minDepth, maxDepth, depth+1);
			drawBIHTree(context, node.r, rightAABB, minDepth, maxDepth, depth+1);

			if(depth >= minDepth) {
				overlap = node.u - node.v;

				context.strokeStyle = "rgb(0,0,200)";
				context.strokeRect(
					(leftAABB.min[0] * zoom) - canv_off_x + 1,
					(leftAABB.min[1] * zoom) - canv_off_y + 1,
					(leftAABB.max[0] - leftAABB.min[0]) * zoom - 2,
					(leftAABB.max[1] - leftAABB.min[1]) * zoom - 2);
				context.strokeStyle = "rgb(150,0,0)";
				context.strokeRect(
					(rightAABB.min[0] * zoom) - canv_off_x + 1,
					(rightAABB.min[1] * zoom) - canv_off_y + 1,
					(rightAABB.max[0] - rightAABB.min[0]) * zoom - 2,
					(rightAABB.max[1] - rightAABB.min[1]) * zoom - 2);

				if(overlap > 0) {
					leftAABB.max[axis] = node.v;
					rightAABB.min[axis] = node.u;

					overlapAABB = AABB.clone();
					overlapAABB.min[axis] = node.u;
					overlapAABB.max[axis] = node.v;

					context.fillStyle = "rgba(0,0,200, 0.05)";
					context.fillRect(
						(leftAABB.min[0] * zoom) - canv_off_x + 1,
						(leftAABB.min[1] * zoom) - canv_off_y + 1,
						(leftAABB.max[0] - leftAABB.min[0]) * zoom - 2,
						(leftAABB.max[1] - leftAABB.min[1]) * zoom - 2);

					context.fillStyle = "rgba(150,0,0, 0.05)";
					context.fillRect(
						(rightAABB.min[0] * zoom) - canv_off_x + 1,
						(rightAABB.min[1] * zoom) - canv_off_y + 1,
						(rightAABB.max[0] - rightAABB.min[0]) * zoom - 2,
						(rightAABB.max[1] - rightAABB.min[1]) * zoom - 2);

					context.fillStyle = "rgba(0,120,0, 0.1)";
					context.fillRect(
						(overlapAABB.min[0] * zoom) - canv_off_x + 1,
						(overlapAABB.min[1] * zoom) - canv_off_y + 1,
						(overlapAABB.max[0] - overlapAABB.min[0]) * zoom - 2,
						(overlapAABB.max[1] - overlapAABB.min[1]) * zoom - 2);
				} else {
					context.fillStyle = "rgba(0,0,200, 0.05)";
					context.fillRect(
						(leftAABB.min[0] * zoom) - canv_off_x + 1,
						(leftAABB.min[1] * zoom) - canv_off_y + 1,
						(leftAABB.max[0] - leftAABB.min[0]) * zoom - 2,
						(leftAABB.max[1] - leftAABB.min[1]) * zoom - 2);

					context.fillStyle = "rgba(150,0,0, 0.05)";
					context.fillRect(
						(rightAABB.min[0] * zoom) - canv_off_x + 1,
						(rightAABB.min[1] * zoom) - canv_off_y + 1,
						(rightAABB.max[0] - rightAABB.min[0]) * zoom - 2,
						(rightAABB.max[1] - rightAABB.min[1]) * zoom - 2);
				}
			}
		}
	}
}

function drawNodes(context, arrayOfNodes, colorInfo) {
	var numOfNodes = arrayOfNodes.length;
	var canvasWidth = context.width;
	var canvasHeight = context.height;
	var rect = [
		{a: canv_off_x, b: canvasWidth * zoom},
		{a: canv_off_y, b: canvasHeight * zoom }];
	var node;

	context.strokeStyle = "rgb(0,0,0)";
	context.lineWidth = colorInfo.border_width;
	//context.lineWidth = border_width*zoom;

	context.clearRect(0, 0, canv_w, canv_h);
	context.fillStyle = 'rgb(50, 150, 50)';

	while(numOfNodes--) {
		node = arrayOfNodes[numOfNodes];
		context.strokeRect(
			node.i.min[0] * zoom - canv_off_x,
			node.i.min[1] * zoom - canv_off_y,
			(node.i.max[0] - node.i.min[0]) * zoom,
			(node.i.max[1] - node.i.min[1]) * zoom);
		if(node.o.color) context.fillStyle = node.o.color;
		context.fillRect(
			node.i.min[0] * zoom - canv_off_x,
			node.i.min[1] * zoom - canv_off_y,
			(node.i.max[0] - node.i.min[0]) * zoom,
			(node.i.max[1] - node.i.min[1]) * zoom);
	}
	return arrayOfNodes.length;
}

function drawObjects(context, arrayOfObjects, colorInfo) {
	var numOfObjects = arrayOfObjects.length;
	var canvasWidth = context.width;
	var canvasHeight = context.height;
	var rect = [
		{a: canv_off_x, b: canvasWidth * zoom},
		{a: canv_off_y, b: canvasHeight * zoom }];
	var object;

	context.strokeStyle = "rgb(0,0,0)";
	context.lineWidth = colorInfo.border_width;
	//context.lineWidth = border_width*zoom;

	context.clearRect(0, 0, context.width, canv_w, canv_h);
	context.fillStyle = 'rgb(50, 150, 50)';

	while(numOfObjects--) {
		object = arrayOfObjects[numOfObjects];
		context.strokeRect(
			(object.AABB.min[0] * zoom) - canv_off_x,
			(object.AABB.min[1] * zoom) - canv_off_y,
			(object.AABB.max[0] - object.AABB.min[0]) * zoom,
			(object.AABB.max[1] - object.AABB.min[1]) * zoom);
		if(object.color) context.fillStyle = object.color;
		context.fillRect(
			(object.AABB.min[0] * zoom) - canv_off_x,
			(object.AABB.min[1] * zoom) - canv_off_y,
			(object.AABB.max[0] - object.AABB.min[0]) * zoom,
			(object.AABB.max[1] - object.AABB.min[1]) * zoom);
	}
	return arrayOfObjects.length;
}

function drawLabel(context, numElements, percent, colorInfo) {
	context.fillStyle="rgb(200,200,200)";

	context.clearRect(0, 0, 200, 40);
	context.fillStyle = "rgb(0,0,0)";
	context.fillText("# of Elements in Tree: " + numElements + " (" + percent + "%)", 10, 23);
	context.fillText("-= " + colorInfo.colors_name +" =-", 10, 33);
}
