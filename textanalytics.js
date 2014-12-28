const fs = require('graceful-fs');

function TextAnalytics() {
    var ctx = this, fn = {};

	ctx.file = function(file)
	{
		ctx._file = file;
		return ctx;
	};
		
	ctx.blockSize = function(blockSize)
	{
		ctx._blockSize = blockSize;
		return ctx;
	};
	
	ctx.stopwordsFile = function(file, delimiter) {
		ctx._stopwords = fs.readFileSync(file,{encoding:"utf8"}).trim().split(delimiter || '\n').filter(function(d){return (d.trim().length > 0)});
		return ctx;
	};

	ctx.stopwordsArray = function(array) {
		ctx._stopwords = array;
		return ctx;
	};
	
	ctx.start = function(option) {
		var run = fn[option] || fn["BagOfWords"];
		run();
	};

	// in build functions
	fn.BagOfWords = function(){
		var os = require('os'),
			mem = os.freemem(),
			cpus = os.cpus().length;
		
		require("mrcluster")
			.init()
			.file(ctx._file)
			.blockSize(ctx._blockSize || 64)
			.numMappers(parseInt(cpus/4)||1)
			.numReducers(parseInt(3*cpus/4)||1)
			.fn("tokenize",tokenize)
	
	}
	
	
    return ctx;
};

function tokenize(text, stopwords)
{
	var tmp = text.replace(/[^A-Za-z0-9_\. @\-]/g,'')
				.replace(/([_\. @\-]){2,}/g,'$1')
				.replace(/([a-z]+)(\-)(?=[a-z]+)/gi,'$1 ')
				.replace(/(\d+\.\d+)|\b([A-Z])\b|[^\-a-zA-Z](\d+)\b/gi,'')
				.replace(/(\.)([\s\n\r\t]*)/g,' ')
				.replace(/[ ]{1,}/g,' ')
				.toLowerCase()
				.trim();
	if (stopwords)
	{
		var regex = new RegExp(stopwords.map(function(d){return "\b"+d+"\b";}).join('|'),'gi');
		tmp = tmp.replace(regex,'');
	}
	return tmp.split(' ')
};

exports.init = function(){return new TextAnalytics(););