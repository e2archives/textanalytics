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

exports = tokenize;