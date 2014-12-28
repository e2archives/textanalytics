var start = process.hrtime();

var cluster = require('cluster'),
	request = require('request'),
	fs = require('graceful-fs');
var _cookie,
	_category,
	_agent = 'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
	_host = 'www.jobsbank.gov.sg',
	_root = 'https://www.jobsbank.gov.sg',
	_loadCat = '/ICMSPortal/portlets/JobBankHandler/loadCategoryValues.do',
	_search = '/ICMSPortal/portlets/JobBankHandler/SearchResult.do',
	_search3 = '/ICMSPortal/portlets/JobBankHandler/SearchResult3.do'

var options =
{
    url: _root,
    headers: 
	{
		'Host': _host,
        'User-Agent': _agent,
		'Referer': _root
    },
	gzip: true
}
	
if (cluster.isMaster) 
{
	
	mkdir('data');
	mkdir('data/global');
	mkdir('data/global/raw');
	cluster.setupMaster({exec : "scrapeWorker.js"});
	cluster.on('exit', 
		function(worker) 
		{ 
			console.log('worker#' + worker.id + ' ended: Time So far = '+ process.hrtime(start)[0] + " seconds"); 

		});
	cluster.on('online', 
		function(worker) 
		{	
			var cat = _category[worker.id-1];
			console.log('worker#' + worker.id + ' online'); 
			genOptions(cat, callback);
			function callback(array_options)
			{
				var dest = 'data/'+cat.key.replace(/[^a-z]/gi,'');
				mkdir(dest);
				worker.send({dest:dest,root:_root,cat:cat, options:array_options});
				console.log('Assigning '+cat.value+' jobs in "'+cat.key+'" to worker#' + worker.id); 
			}
		});
	request(options, getCookie);
}

function createWorkers(cat)
{
	// start workers
	for (var i = 0, len = _category.length; i < len; i++) cluster.fork();
}

function getCookie(error, response, body) {
    if (!error && response.statusCode == 200) {
        _cookie = (response.headers['set-cookie']||[]).join(';');
		options.url = _root+_loadCat;
		options.headers.Cookie = _cookie;
		
		if (fs.existsSync('data/category.txt')) 
		{
			_category = JSON.parse(fs.readFileSync('data/category.txt',{encoding:"utf8"}));
			createWorkers(_category);
		}
		else
		{
			options.qs = {funcType:"category","funcSubType":'',"index":''};
			process.nextTick(function(){ request(options, parseCat); });
		}
    }
}

function parseCat(error, response, body)
{
	if (!error && response.statusCode == 200)
	{
		_category = JSON.parse(body).CategoryVal;
		fs.writeFile('data/category.txt',JSON.stringify(_category));
		createWorkers(_category);
	}
}




function genOptions(cat, callback)
{
	delete options.headers['Cookie'];
	
	request(options, getCookie2);
	
	function getCookie2(error, response, body) {
		if (error) console.log(error);
		if (!error && response.statusCode == 200) {
			var array = genOptionsWithCookie(cat,(response.headers['set-cookie']||[]).join(';')||_cookie);
			callback(array);
		}
	}


}

function genOptionsWithCookie(cat,cookie)
{
	return [  
		{
			url: _root+_search,
			method: "POST",
			headers: 
			{
				'Host': _host,
				'User-Agent': _agent,
				'Referer': _root,
				'Cookie': cookie
			},
			qs: {
				'tabSelected':'CATEGORY',
				'aTabFunction':'aTabFunction',
				'Function': cat.key
			},
			form: {
				'{actionForm.checkValidRequest}':'YES'
			},
			gzip: true,
			encoding: 'utf8'
		},
		{
			url: _root+_search3,
			method: "POST",
			headers: 
			{
				'Host': _host,
				'User-Agent': _agent,
				'Referer': _root,
				'Cookie': cookie
			},
			form: {
				"{actionForm.sortBy}": 1,
				"{actionForm.checkValidRequest}":"YES",
				"{actionForm.recordsPerPage}": parseInt(Math.ceil(parseInt(cat.value)/5)),
				"{actionForm.currentPageNumber}":1,
				"{actionForm.keyWord}":cat.key,
				"{actionForm.searchType}":"Quick Search",
				"{actionForm.SPECIALISATION}":cat.key
			},
			gzip: true,
			encoding: 'utf8'
		}
	];
}

function mkdir(path)
{
	try {	fs.mkdirSync(path);	} 
	catch(e) { if ( e.code != 'EEXIST' ) throw e; }
}