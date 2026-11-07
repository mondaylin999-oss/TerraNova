import {allowedLayers} from '../../../lib/live-layers';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,layer=p.get('layer')||allowedLayers[0];
 if(!allowedLayers.includes(layer))return Response.json({error:'Unknown layer'},{status:400});
 const lat=Number(p.get('lat')??16.87),lon=Number(p.get('lon')??96.2);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return Response.json({error:'Invalid coordinates'},{status:400});
 const result:{checkedAt:string;date?:string;legend?:string;weather?:unknown;errors:string[]}={checkedAt:new Date().toISOString(),errors:[]};
 const tasks=await Promise.allSettled([
 fetch('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?service=WMS&request=GetCapabilities&version=1.3.0',{next:{revalidate:900},signal:AbortSignal.timeout(20000)}).then(async r=>{if(!r.ok)throw Error();const xml=await r.text();const block=xml.split('<Layer').find(s=>s.includes('<Name>'+layer+'</Name>'));const dim=block?.match(/<Dimension[^>]*>([^<]+)<\/Dimension>/)?.[1];const dates=dim?.match(/\d{4}-\d{2}-\d{2}/g);if(!dates?.length)throw Error();result.date=dates[dates.length-1];const legend=block?.match(/xlink:href="([^"]+)"/g)?.find(x=>x.includes('legend'));if(legend)result.legend=legend.slice(12,-1).replaceAll('&amp;','&');}),
 (async()=>{const end=new Date(Date.now()-2*86400000),start=new Date(Date.now()-20*86400000);const fmt=(d:Date)=>d.toISOString().slice(0,10).replaceAll('-','');const q=new URLSearchParams({parameters:'T2M,RH2M,WS10M,PRECTOTCORR',community:'AG',latitude:String(lat),longitude:String(lon),start:fmt(start),end:fmt(end),format:'JSON','time-standard':'UTC'});const r=await fetch('https://power.larc.nasa.gov/api/temporal/daily/point?'+q,{next:{revalidate:3600},signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error();const d=await r.json() as {properties?:{parameter:Record<string,Record<string,number>>};parameters:unknown};const ps=d.properties?.parameter??{};const dates=Object.keys(ps?.T2M||{}).filter(k=>Number.isFinite(ps.T2M[k])&&ps.T2M[k]>-999).sort();const date=dates.at(-1);if(!date)throw Error();result.weather={date,values:Object.fromEntries(Object.entries(ps??{}).map(([k,v])=>[k,(v as Record<string,number>)[date]])),parameters:d.parameters};})(),
 ]);tasks.forEach((t,i)=>{if(t.status==='rejected')result.errors.push(['NASA imagery','POWER measurements'][i]+' temporarily unavailable')});
 return Response.json(result,{headers:{'Cache-Control':'public, max-age=300'}});
}
