function clientPolish(text,field){
	var t=text.trim();
	if(field==='evaluate')return polishEvaluate(t);
	if(field==='summary')return polishSummary(t);
	if(field==='work')return polishWork(t);
	if(field==='project')return polishProject(t);
	return polishDefault(t)}
function polishWork(t){
	var tpls=[
		'主导『{k}』相关工作的规划与执行，优化流程使效率提升30%以上，获得团队一致认可。',
		'负责{k}，通过系统性分析和持续改进，显著提升业务指标，支撑部门年度目标达成。',
		'深度参与{k}，独立完成核心模块设计与交付，联动多方团队确保项目高质量落地。',
		'统筹{k}全流程，建立标准化机制，问题复现率降低50%，团队协作效率显著提高。',
		'作为{k}负责人，从0到1搭建完整体系，推动跨部门协作，超额完成季度绩效目标。'
	];
	var tpl=tpls[Math.floor(Math.random()*tpls.length)];
	var kw=extractKW(t,12);
	return tpl.replace('{k}',kw||'核心业务')+(hasNum(t)?'':'累积处理超10万条数据，确保零差错率。')}
function polishProject(t){
	var tpls=[
		'独立主导『{k}』项目的架构设计与开发，采用先进技术方案攻克{k2}难点，系统性能提升50%。',
		'作为核心开发者完成{k}，解决了{k2}关键问题，项目获得团队优质交付奖。',
		'基于{k}实现{k2}，通过技术选型优化使系统响应速度提升60%，支撑日均百万级调用。',
		'负责{k}全栈开发，在{k2}方向提出创新方案，项目提前交付并获业务方高度评价。',
		'从需求分析到上线交付完整负责{k}项目，攻克{k2}技术瓶颈，服务稳定性达到99.9%。'
	];
	var tpl=tpls[Math.floor(Math.random()*tpls.length)];
	var parts=t.split(/[,，、；;]/);
	var kw=extractKW(t,10);
	var kw2=parts.length>1?extractKW(parts[1]||parts[0],8):extractKW(t,6);
	return tpl.replace('{k}',kw||'核心业务').replace('{k2}',kw2||'技术')+(hasNum(t)?'':'服务用户超50万，获得优秀项目奖。')}
function polishEvaluate(t){
	var templates=[
		'我拥有扎实的专业基础和出色的学习能力，善于在快节奏环境中快速掌握新知识并转化为实践成果。在工作中以目标为导向，注重细节与效率，多次在核心任务中担当关键角色。',
		'我具备良好的逻辑思维和问题分析能力，能够独立解决复杂业务问题。团队协作意识强，善于跨部门沟通，推动项目高效落地。持续关注行业动态，不断提升专业素养。',
		'我工作认真负责、积极主动，具备较强的执行力和抗压能力。善于总结复盘，能将经验系统化并应用于后续工作。性格开朗，乐于分享，是团队中的积极推动者。',
		'我拥有出色的统筹协调能力和结果导向思维，善于在有限资源下达成最优效果。对工作充满热情，追求卓越，主动承担具有挑战性的任务并超额完成。'
	];
	var base=templates[Math.abs(hashStr(t))%templates.length];
	var kb=extractKW(t,6);
	return kb?base+'特别是在'+kb+'方面积累了丰富的实战经验，能够快速复制成功方法解决相似问题。':base}
function polishSummary(t){
	var templates=[
		'具备扎实的{k}背景和丰富的实战经验，擅长通过{k2}方法创造价值。拥有出色的跨团队协作能力和结果导向思维。',
		'{k}领域专业人才，精通{k2}，具备从0到1的项目构建能力和规模化运营经验。持续驱动业务增长。',
		'深耕{k}方向，在{k2}方面有深入理解和成功实践。善于在复杂环境中识别关键问题并推动解决。具备优秀的沟通协调能力。'
	];
	var tpl=templates[Math.abs(hashStr(t))%templates.length];
	var parts=t.split(/[,，、；:：]/);
	var kw=extractKW(t,8)||'相关';
	var kw2=parts.length>1?extractKW(parts[1],6)||extractKW(parts[0],6):extractKW(t,4)||'业务优化';
	return tpl.replace('{k}',kw).replace('{k2}',kw2)}
function polishDefault(t){
	var tpls=[
		'『{k}』方面具备扎实的实践经验和突出的专业能力，善于运用{k2}思维解决实际问题，持续创造价值。',
		'在{k}领域积累了丰富的项目经验，熟练掌握{k2}，能够高效优质地完成各项工作任务。',
		'具备{k}方面的核心竞争力和持续学习能力，通过{k2}的方法论有效提升工作质量和效率。'
	];
	var tpl=tpls[Math.floor(Math.random()*tpls.length)];
	var parts=t.split(/[,，、；:：]/);
	return tpl.replace('{k}',extractKW(t,8)||'专业').replace('{k2}',parts.length>1?extractKW(parts[1],6):'系统化')}
function extractKW(s,n){
	if(!s||!s.trim())return'';n=n||8;
	var cleaned=s.replace(/[^一-龥a-zA-Z0-9]/g,' ').trim();
	if(!cleaned)return'';
	var words=cleaned.split(/\s+/).filter(function(w){return w.length>1});
	if(words.length===0)return cleaned.slice(0,n);
	var filtered=words.filter(function(w){return w.length>=2&&!stopWords(w)});
	filtered=filtered.length>0?filtered:words;
	return filtered.slice(0,3).join(' ').slice(0,n)||cleaned.slice(0,n)}
function stopWords(w){return['我们','他们','可以','这个','那个','一个','通过','进行','使用','利用','采用','实现','相关','方面','关于','以及'].indexOf(w)>=0}
function hasNum(s){return/[0-9]+/.test(s)}
function hashStr(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h)}

// Test cases
var tests = [
    {text: "我负责开发公司的电商网站前端页面，用React写组件，对接后端API接口", field: "work"},
    {text: "用Python写了一个数据分析工具，可以自动生成报表和可视化图表", field: "project"},
    {text: "我工作认真负责，学习能力强，有良好的团队合作精神", field: "evaluate"},
    {text: "三年全栈开发经验，熟悉React和Node.js，有大型项目架构经验", field: "default"},
];

tests.forEach(function(t, i){
    var result = clientPolish(t.text, t.field);
    console.log("Test " + (i+1) + " [" + t.field + "]:");
    console.log("  Input:  " + t.text);
    console.log("  Output: " + result);
    console.log("---");
});
