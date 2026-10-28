const crypto=require('node:crypto'),epg=require('./engine/epg.cjs'),sax=require('./engine/sax.cjs'),{informative}=require('./engine/guide-quality.cjs');
const REGIONS=['ES','FR','PT','NL','GB','IT','DE','BE','CA','ARAB','MA','DZ','TN','AF','TR'];
const esc=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const stamp=n=>new Date(n).toISOString().replace(/[-:T]/g,'').slice(0,14)+' +0000';
const piizi=(region,key)=>'piizi.'+crypto.createHash('sha256').update([region,key,0,''].join('|')).digest('hex').slice(0,24);
function parseTargets(xml){const channels=[],p=sax.parser(true,{trim:true});let c=null,field=false,text='';p.onopentag=n=>{if(n.name==='channel')c={id:n.attributes.id,names:[]};if(n.name==='display-name'&&c){field=true;text='';}};p.ontext=p.oncdata=t=>{if(field)text+=t;};p.onclosetag=n=>{if(n==='display-name'&&c){c.names.push(text);field=false;}if(n==='channel'&&c){channels.push(c);c=null;}};p.write(xml).close();const result=[];for(const c of channels){let target;for(const region of REGIONS){for(const name of c.names){const key=epg.canonical(name,region);if(key&&piizi(region,key)===c.id){target={id:c.id,region,key,name:c.names[0]};break;}}if(target)break;}if(target)result.push(target);}return result;}
function groupName(region){return region==='ARAB'?'[AR] ARABIC':region==='PT'?'[PR] Portugal':region==='BE'?'[BL] BELGIUM':region==='AF'?'[AF] AFRIQUE':'['+region+'] TV';}
function normalizedSchedule(list,now){const sorted=list.filter(p=>informative(p)&&Number.isFinite(p.start)&&p.end>p.start&&p.end>now-7200000&&p.start<now+48*3600000).slice().sort((a,b)=>a.start-b.start);const unique=[];for(const p of sorted)if(!unique.length||unique[unique.length-1].start!==p.start)unique.push({...p});return unique.map((p,i)=>({...p,end:Math.min(p.end,unique[i+1]?.start??Infinity)})).filter(p=>p.end>p.start);}
function buildGuide(targets,data,now=Date.now()){
 const entries=new Map(),families=[];const proposed=new Map();
 const offer=(id,family)=>{if(!id||id.length>180||/[\r\n<>]/.test(id))return;const set=proposed.get(id)||new Set();set.add(family);proposed.set(id,set);};
 const inverse={mlaliga:'mlaligatv',mlaliga2:'mlaligatv2',mlaliga3:'mlaligatv3',mlaliga4:'mlaligatv4',nationalgeographic:'natgeo',nationalgeographicwild:'natgeowild',nickjunior:'nickjr',canalhollywood:'hollywood',launo:'la1',lados:'la2',tve1:'la1',tve2:'la2'};
 const aliasTables=require('./engine/channel-aliases.json');let current=0,withoutCurrent=0;
 for(const target of targets){const channel=epg.match({name:target.key,group:groupName(target.region)},data),list=normalizedSchedule(data.programmes[channel]||[],now);if(!list.length)continue;const key=target.region+'|'+target.key;let family=entries.get(key);if(!family){family={key,region:target.region,name:data.channels[channel]?.names?.[0]||target.name,channel,list,ids:new Set(),hasCurrent:list.some(p=>p.start<=now&&p.end>now)};entries.set(key,family);families.push(family);}offer(target.id,family);const country=target.region==='GB'?'uk':target.region.toLowerCase();offer(target.key+'.'+country,family);if(target.region==='GB')offer(target.key+'.gb',family);if(target.region==='ES')offer('cima.es.'+target.key,family);
 for(const [from,to]of Object.entries({...inverse,...aliasTables[target.region]}))if(epg.canonical(to,target.region)===target.key)offer(from+'.'+country,family);
 offer(channel,family);offer(channel.toLowerCase(),family);
 }
 let ambiguous=0;for(const [id,set]of proposed){if(set.size===1){[...set][0].ids.add(id);}else{ambiguous++;}}
 const out=['<?xml version="1.0" encoding="UTF-8"?>','<tv generator-info-name="PiiZiTV EPG">'];let programmes=0;
 for(const f of families){if(f.hasCurrent)current++;else withoutCurrent++;for(const id of f.ids)out.push('<channel id="'+esc(id)+'"><display-name>'+esc(f.name)+'</display-name></channel>');}
 for(const f of families)for(const id of f.ids)for(const p of f.list){out.push('<programme channel="'+esc(id)+'" start="'+stamp(p.start)+'" stop="'+stamp(p.end)+'"><title>'+esc(p.title)+'</title>'+(p.description?'<desc>'+esc(p.description.slice(0,160))+'</desc>':'')+'</programme>');programmes++;}out.push('</tv>');
 return {xml:out.join('\n'),stats:{targets:targets.length,families:families.length,currentFamilies:current,futureOnlyFamilies:withoutCurrent,xmlChannels:[...families].reduce((n,f)=>n+f.ids.size,0),programmes,ambiguousAliasesSkipped:ambiguous,windowHours:48}};
}
module.exports={REGIONS,esc,stamp,piizi,parseTargets,buildGuide,normalizedSchedule};
