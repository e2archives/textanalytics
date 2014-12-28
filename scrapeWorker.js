var _root,
	_dest,
	_cat,
	_options,
	_queue = [],
	request = require('request'), 
	cheerio = require('cheerio'),
	fs = require('graceful-fs');

var orderBy = ['TimeStamp','Job ID','Posting Date','Closing Date','Title','Company','Address','Contact','Job Category','Industry','Employment Type','Working Hours','Shift Pattern','Salary','Job Level','Min. Years of Experience','Description','Skills'];
var curr = 0;

process.on('message', function (msg) {
	if (msg.dest) _dest = msg.dest;
	if (msg.root) _root = msg.root;
	if (msg.cat) _cat = msg.cat;
	if (msg.options) {
		_options = msg.options;
		start();
	}

})

function start()
{
	_cat.value = parseInt(_cat.value);
	if (fs.existsSync(_dest+"/_joblist.txt")) 
	{
		_queue = fs.readFileSync(_dest+"/_joblist.txt",{encoding:'utf8'}).trim().split('\n');
		crawl(_queue);
	}
	else request(_options[0], parseFirst);
}

function parseFirst(error, response, body) {
	if (error) console.log(error);
    if (!error && response.statusCode == 200) {
		process.nextTick(function(){ request(_options[1], parseBody); })
    }
}

function parseBody(error, response, body)
{
	if (error) console.log(error);
	if (!error && response.statusCode == 200) {
	
		//console.log('.');
		$ = cheerio.load(body);
		//console.log('.');
		var lines = '';
		$('td.jobDesActive a.text').each(function(i,d){
			_queue.push($(this).attr('href'));
		});
		
		crawl(_queue);
		fs.writeFileSync(_dest+"/_joblist.txt", _queue.join('\n'));
	}
}

function crawl(queue)
{
	var url = queue.pop();
	
	if (!url || url.length == 0) process.exit();
	
	url = _root+url.trim();
	
	var id = url.split('?id=')[1];

	if (fs.existsSync("data/global/raw/"+id+".csv")) {
		if (!fs.existsSync(_dest+"/jobs.csv")) 
			fs.appendFileSync(_dest+"/jobs.csv", orderBy.join(',')+'\n');

		fs.appendFileSync(_dest+"/jobs.csv", fs.readFileSync("data/global/raw/"+id+".csv"));
		process.nextTick(function(){crawl(queue);})
	}
	else
	{
		var left = parseInt(_queue.length/500);
		if (left!=curr || _queue.length < 10)
		{
			curr = left;
			console.log(_cat.key+': '+_queue.length+"/"+_cat.value+" left");
		}
		request({url:url,encoding:'utf8'},parseDetails);
	}
	
	
}

function parseDetails(error, response, body)
{
	if (error) console.log(error);
	if (!error && response.statusCode == 200) {
	
		var misc_list = ['Posting Date','Closing Date','Job ID'];
		var misc_list_parser = [function(d){return d.split(':')[1].trim();},function(d){return d.split(':')[1].trim();},function(d){return d.trim();}];
		var ul_list = ['Industry','Employment Type','Working Hours','Shift Pattern','Salary','Job Level','Min. Years of Experience'];
		var stats = ['No. of Vacancies','No. of People who viewed the job','No. of People who applied for the job'];
		var address = [],contact=[];

		var address_list = ['Address','Contact'];
		$ = cheerio.load(body);
		
		var data = {
			Title:$('div.jobDes h3.jd_header1').text().trim(),
			Company: $('div.jobDes h3.jd_header2').text().trim(),
			Description: $('#divMainJobDescription span').text().trim().replace(/\b[(\\)(t)|(\\)(r)|(\\)(n)]\b/g,''),
			Skills: $('#divMainSkillsRequired span').text().trim().replace(/\b[(\\)(t)|(\\)(r)|(\\)(n)]\b/g,''),
			TimeStamp: (new Date()).getTime()
		}
		var cat = "";
		$('div.jd_contentRight table ul.details li span').each(function(i,d){cat+=$(this).text().trim()+'|';});
		data['Job Category'] = cat;
		var dl = $('div.jd_contentRight dl');
		$(dl[0]).find('p').each(function(i,d){address.push($(this).text().trim());});
		data.Address = address.join('|');
		$(dl[1]).find('span').each(function(i,d){contact.push($(this).text().trim());});
		data.Contact = contact.join('|');
		 /*{
			if (i<address_list.length)  
			{
				var tmp = "";
				$(this).find('li span').each(function(ii,dd){ tmp+=$(this).text().trim()+"\n";});
				data[ul_list[i]]=tmp.trim();
			}
		});*/
		 
		$('div.text p').each(function(i,d){if (i<misc_list.length) data[misc_list[i]] = misc_list_parser[i]($(this).text());});
		$('ul.jd_NoBulletinRight').each(function(i,d){
			if (i<ul_list.length)  
			{
				var tmp = [];
				$(this).find('table li span').each(function(ii,dd){ tmp.push($(this).text().trim());});
				if (tmp.length == 0) data[ul_list[i]] = $(this).find('li').text().trim();
				else data[ul_list[i]]=tmp.join('|');
			}
		});
		var last = $('div.jd_contentRight span.text'), len = last.length;
		stats.forEach(function(d,i){
			data[d] = parseInt($(last[len-(stats.length*2)+(i*2)+1]).text().trim());
		});
		
		
		var array = [];
		orderBy.forEach(function(d){
			data[d] = (typeof(data[d]) == 'string')?data[d].replace(/((\t)|(\r)|(\n)|(\\t)|(\\r)|(\\n))/g,''):data[d];
			array.push(data[d]);
		});
		
		array = JSON.stringify(array)
		array = array.substr(1,array.length-2)+"\n";
		if (!fs.existsSync("data/global/jobs.csv")) 
			fs.appendFileSync("data/global/jobs.csv", orderBy.join(',')+'\n');
		
		fs.appendFileSync("data/global/jobs.csv", array);
		fs.appendFileSync(_dest+"/jobs.csv", array);
		//fs.writeFileSync("data/global/raw/"+data['Job ID']+".json", JSON.stringify(data));
		fs.writeFileSync("data/global/raw/"+data['Job ID']+".csv", array);

		process.nextTick(function(){crawl(_queue);})

	}

}
