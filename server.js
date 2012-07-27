var connect = require('connect');
var browserify = require('browserify');

var b = browserify({
	require : [ '../bxh', 'mjs']
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
	connect.static(__dirname + "/examples"),
	b
);
server.listen(9001);