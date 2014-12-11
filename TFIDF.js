//TF(t) = (Number of times term t appears in a document) / (Total number of terms in the document).
//IDF(t) = log_e(Total number of documents / Number of documents with term t in it).

var fs = require('graceful-fs');

var files = fs.readdirSync('docs').map(function(d){return "docs/"+d})


var stopwords = fs.readFileSync('sample_data/stopwords.csv',{encoding:"utf8"})
					.trim()
					.split(',')
TFIDF_array(files,stopwords);

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
}

function TFIDF_array(arrayOffiles,stopwords)
{
	var mrcluster = require("mrcluster");

	mrcluster.init()
		.file(arrayOffiles)
		.cache({docCount:arrayOffiles.length,stopwords:stopwords})
		.lineDelimiter('\n')
		.blockSize(1)
		.numMappers(2)
		.numReducers(3)
		.fn("tokenize",tokenize)
		.map(function (line) {
			var hashtable = {},
				words = _fn.tokenize(line,ctx._cache.stopwords);
			hashtable["##"+ctx._file] = hashtable["#"+ctx._file] || 0;
			words.forEach(function(word){
				hashtable[word]=hashtable[word]||{};
				hashtable[word][ctx._file]=hashtable[word][ctx._file]||0;
				++hashtable[word][ctx._file];
				++hashtable["##"+ctx._file];
			});
			return hashtable;
		})
		.reduce(function (a, b) {
			if (typeof(a)=="number") return a+b;
			for (var k in b)
			{
				a[k]+=b[k];
			}
			return a;
		})
		.post_reduce(function(hashtable){
			var wordTable = {}, docTable = {};
			for (var word in hashtable)
			{
				if (word.indexOf('##')==0) 
				{
					docTable[word.substr(2)] = hashtable[word];
					continue;
				}
				var docs = hashtable[word],
					docFreq = 0;
				for (var doc in docs)
				{
					++docFreq;
				}
				var IDF = Math.log(ctx._cache.docCount/docFreq);
				if (IDF == 0) continue; // word appears in all doc, useless
				for (var doc in docs)
				{
					docs[doc]*=IDF;
				}
				wordTable[word] = docs;
			}
			//console.log(wordTable)
			return {words:wordTable, docs:docTable};
		})
		.aggregate(function(array){
			var termFreqDoc = {};		
			array.forEach(function(obj){
				var docs = obj.docs;
				for (var doc in docs) 
				{
					termFreqDoc[doc] = docs[doc];
				}
			});

			var res = {};
			
			array.forEach(function(obj){
				var words = obj.words;
				for (var word in words) 
				{
					var docs = words[word];
					for (var doc in docs)
					{
						res[doc] = res[doc] || [];
						var tfidf = docs[doc]/termFreqDoc[doc];
						if (tfidf > 0) res[doc].push({word:word,tfidf:tfidf});
					}
				}
			});
			
			var lines = "";
			for (var doc in res)
			{
				res[doc].sort(function(a,b){return b.tfidf-a.tfidf;})
						.forEach(function(d){lines+=doc+","+d.word+","+d.tfidf+"\n"})
				
			}
			fs.writeFileSync("TFIDF.csv",lines);
		})
		.start();

}

function TFIDF_csv(csv)
{
	var mrcluster = require("mrcluster");

	mrcluster.init()
		.file(file)
		.lineDelimiter('\n')
		.blockSize(1)
		.numMappers(2)
		.numReducers(3)
		.map(function (line) {
			var hashtable = {};
			var words = tokenize(line), len = words.length;
			words.forEach(function(word){
				hashtable[word]=hashtable[word]||{};
				hashtable[word][ctx._file]=hashtable[word][ctx._file]||0;
				++hashtable[word][ctx._file];
			});
			for (var word in hashtable)
			{
				hashtable[word][ctx._file]/=len;
			}
			return hashtable;
		})
		.reduce(function (a, b) {
			
			for (var k in b)
			{
				a[k]+=b[k];
			}
			return a;
		})
		.post_reduce(function(hashtable){
			var lines = "";
			for (var word in hashtable)
			{
				var docs = hashtable[word],
					docFreq = 0
					termFreq = 0;
				for (var doc in docs)
				{
					++docFreq;
				}
				var IDF = Math.log(ctx._cache/docFreq);
				for (var doc in docs)
				{
					docs[doc]*=IDF;
					lines += doc+","+word+","+docs[doc]+"\n";
				}
				fs.appendFile('TFIDF.csv');
			}
			return 0;
		})
		.start();

}

