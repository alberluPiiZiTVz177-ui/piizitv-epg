const crypto=require('node:crypto');
function informative(p){const title=String(p?.title||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return !!title&&!/^(?:no\s*data|no (?:program(?:me)?|epg|schedule)(?:ming)? (?:data|information)(?: available)?|information (?:not available|unavailable)|sin (?:datos|informacion|programacion)(?: disponible)?|programa por determinar|to be announced|tba|n\/a|24\/?7|programming unavailable|no information available|\W+)$/.test(title);}
function cleanGuide(data,now=Date.now()){
 if(!data?.channels||!data?.programmes)return {channels:{},programmes:{}};
 const programmes={},fingerprints=new Map();let discarded=0,quarantined=0;
 for(const [id,list]of Object.entries(data.programmes)){const good=list.filter(informative);discarded+=list.length-good.length;if(good.length)programmes[id]=good;
 const next=good.filter(p=>p.end>now&&p.start<now+36*3600000).slice(0,12);if(next.length<4)continue;
 const hash=crypto.createHash('sha256').update(JSON.stringify(next.map(p=>[p.start,p.end,p.title]))).digest('hex');const ids=fingerprints.get(hash)||[];ids.push(id);fingerprints.set(hash,ids);}
 for(const ids of fingerprints.values()){if(ids.length<6)continue;const families=new Set(ids.map(id=>String(data.channels[id]?.names?.[0]||id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^(?:[a-z]{2}\s*[-:|]\s*)/,'').replace(/[^a-z0-9]/g,'').slice(0,6)));if(families.size<5)continue;for(const id of ids){delete programmes[id];quarantined++;}}
 return {...data,programmes,quality:{discarded,quarantined}};
}
module.exports={informative,cleanGuide};
