function asyncEach(array, fn, progress, finished) {
	var i = 0,
		maxBurnTime = 100, // ms to run before yielding to user agent
		finishedFn = finished || progress,
		progressFn = (finishedFn === progress ? null : progress);

	function iter() {
		var startTime = Date.now();

		while(i < array.length) {
			fn.call(array, array[i], i++);

			if(Date.now() - startTime > maxBurnTime) {
				if(progressFn) progressFn(i, array.length);
				return window.setTimeout(iter, 0);
			}
		}

		if(progressFn) progressFn(i, array.length);
		if(finishedFn) finishedFn(null, array);
	}
	window.setTimeout(iter, 0);
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame    ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

function getXY(e, relativeTo) {
	var posx = 0;
	var posy = 0;
	var e = e || window.event;

	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft
			 + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			 + document.documentElement.scrollTop;
	}

	posx = posx - relativeTo.offsetLeft;
	posy = posy - relativeTo.offsetTop;

	return {x: posx, y: posy};
}
