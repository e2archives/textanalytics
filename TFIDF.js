//TF(t) = (Number of times term t appears in a document) / (Total number of terms in the document).
//IDF(t) = log_e(Total number of documents / Number of documents with term t in it).

function TFIDF_array(arrayOffiles)
{
	var mrcluster = require("mrcluster");

	mrcluster.init()
		.file(arrayOffiles)
		.cache(arrayOffiles.length)
		.lineDelimiter('\n')
		.blockSize(1)
		.numMappers(2)
		.numReducers(3)
		.map(function (line) {
			var hashtable = {},
				words = tokenize(line);
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
				var IDF = Math.log(ctx._cache/docFreq);
				for (var doc in docs)
				{
					docs[doc]*=IDF;
				}
				wordTable[word] = docs;
				fs.appendFile('TFIDF.csv');
			}
			return {words:wordTable, docs:docTable};
		})
		.aggregate(function(array){
			var lines = "",
				termFreqDoc = {};		
			array.forEach(function(obj){
				var docs = obj.docs;
				for (var doc in docs) 
				{
					termFreqDoc[doc] = docs[doc];
				}
			});
			array.forEach(function(obj){
				var words = obj.words;
				for (var word in words) 
				{
					var docs = words[word];
					for (var doc in docs)
					{
						docs[doc]/=termFreqDoc[doc];
						lines += doc+","+word+","+docs[doc]+"\n";
					}
				}
			});
			fs.appendFileSync("TFIDF.csv",lines);
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

