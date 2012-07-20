"use strict";

// Most minimal InterSectInfo structure possible
function IntersectInfo() {
}

IntersectInfo.prototype = {
	isHit : false,
	position : null
};

module.exports = IntersectInfo;