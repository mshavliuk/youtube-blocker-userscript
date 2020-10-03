module.exports = function (content) {
	// FIXME: replace with something less hacky
	return content.replace(
		/module.exports = ([\w_]+);?/,
		"module.exports = { default: $1, $1: $1 };"
	);
};
