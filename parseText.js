var s = "asdasd-123.sdfdf 23____213 Asb32c-ef3 abc..2 213213.213 2442 23.23% eterna2@hotmail.com Control 213123 of IL-2 receptor-alpha expression by IL-1  tumor necrosis factor  and IL-2. Complex regulation via elements in the 5  flanking region. We have analyzed the mechanisms by which IL-1  IL-2  and TNF regulate expression of IL-2R alpha chain in a rodent T cell line. All three cytokines induce detectable IL-2R alpha mRNA by themselves  but there is strong synergy between IL-1 or TNF  on the one hand  and IL-2  on the other. The earliest phase of induction by IL-1 is independent of protein synthesis. IL-1  but not TNF  also stimulates transient secretion of IL-2. This leads to an autocrine stimulation of a further increase in IL-2R alpha mRNA levels. When IL-2 secretion has dropped off  continued IL-2R alpha expression requires both IL-2 and IL-1. Most or all of this regulation is due to changes in the rate of transcription of the IL-2R alpha gene. The response to IL-1 and IL-2 depends on a segment in the IL-2R alpha 5  flanking region  upstream of all cis-acting regulatory elements previously identified in the human gene. Plaetinck G  Combe MC  Corthesy P  Sperisen P  Kanamori H  Honjo T  Nabholz M. Am no an listening depending up believing. Enough around remove to barton agreed regret in or it. Advantage mr estimable be commanded provision. Year well shot deny shew come now had. Shall downs stand marry taken his for out. Do related mr account brandon an up. Wrong for never ready ham these witty him. Our compass eterna2@hotmail.com see age uncivil matters weather forbade her minutes. Ready how but truth son new under. "

function tokenize(text, stopwords)
{
	var tmp = text.replace(/[^A-Za-z0-9_\. @\-]/g,'')
				.replace(/([_\. @\-]){2,}/g,'$1')
				.replace(/([a-z]+)(\-)(?=[a-z]+)/gi,'$1 ')
				.replace(/(\d+\.\d+)|\b([A-Z])\b|[^\-a-zA-Z](\d+)\b/gi,'')
				.replace(/(\.)(\s+)/g,' ')
				.replace(/[ ]{1,}/g,' ')
				.trim();
	if (stopwords)
	{
		var regex = new RegExp(stopwords.map(function(d){return "\b"+d+"\b";}).join('|'),'gi');
		tmp = tmp.replace(regex,'');
	}
	return tmp.split(' ')
}