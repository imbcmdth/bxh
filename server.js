var connect = require('connect');
var browserify = require('browserify');

var b = browserify({
	require : [ 'bxh', 'mjs']
	//,filter : require('uglify-js')
//	,cache: false
	,debug: true
});

var allowCrossDomain = function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	next();
};

var server = connect.createServer(
	//allowCrossDomain,
	b,
	connect.static(__dirname)
);
server.listen(9001);