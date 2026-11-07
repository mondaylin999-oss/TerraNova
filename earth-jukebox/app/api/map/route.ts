import {allowedLayers} from '../../../lib/live-layers';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,layer=p.get('layer')||'',date=p.get('date')||'',width=Number(p.get('size')??2048);
 if(!allowedLayers.includes(layer)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||![2048,4096,8192].includes(width))return new Response('Invalid imagery request',{status:400});
 const q=new URLSearchParams({service:'WMS',version:'1.1.1',request:'GetMap',layers:'BlueMarble_ShadedRelief_Bathymetry,'+layer,styles:'',srs:'EPSG:4326',bbox:'-180,-90,180,90',width:String(width),height:String(width/2),format:'image/jpeg',time:date,transparent:'false'});
 try{const r=await fetch('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?'+q,{next:{revalidate:900},signal:AbortSignal.timeout(width>2048?70000:25000)});if(!r.ok||!r.headers.get('content-type')?.includes('image/'))throw Error();return new Response(await r.arrayBuffer(),{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=900'}})}catch{return new Response('NASA imagery unavailable',{status:502})}
}
