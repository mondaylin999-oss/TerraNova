'use client';
import {useEffect,useRef,useState} from 'react';
import SoundOverlay from './sound-overlay';
import {createGlobe,imageSizes} from '../lib/globe-renderer';
import {readColumns,type Column,type EarthSonifier} from '../lib/sonify';
export default function LiveGlobe({url,onPick,sound=null}:{url:string;onPick:(lat:number,lon:number)=>void;sound?:EarthSonifier|null}){
 const canvas=useRef<HTMLCanvasElement>(null),rot=useRef({lon:96,lat:12}),drag=useRef<{x:number;y:number}|null>(null),[status,S]=useState('Loading NASA imagery…'),[spin,P]=useState(true),columns=useRef<Column[]|null>(null),listener=useRef(sound),spinning=useRef(spin);
 useEffect(()=>{listener.current=sound;sound?.setColumns(columns.current)},[sound]);
 // Animation frames stop in a hidden tab, so a timer keeps the scan moving instead of holding one chord.
 useEffect(()=>{if(!sound)return;let last=performance.now();const timer=setInterval(()=>{const now=performance.now();if(document.hidden&&!drag.current){rot.current.lon+=(now-last)*.009;sound.scan(rot.current.lon,rot.current.lat)}last=now},100);return()=>clearInterval(timer)},[sound]);
 useEffect(()=>{spinning.current=spin},[spin]);
 useEffect(()=>{
  const node=canvas.current!,globe=createGlobe(node),loading=new AbortController();let alive=true,frame=0,last=0;
  async function loadImagery(){
   for(const [stage,size] of imageSizes(node,globe.maxImage).entries()){
    try{
     const response=await fetch(`${url}&size=${size}`,{signal:loading.signal});if(!response.ok)throw Error();const img=await createImageBitmap(await response.blob());if(!alive){img.close();return}
     // Sound only needs broad areas of colour, so it reads a small copy rather than the whole image.
     if(!stage){const small=document.createElement('canvas');small.width=1024;small.height=512;const tc=small.getContext('2d',{willReadFrequently:true})!;tc.drawImage(img,0,0,1024,512);columns.current=readColumns(tc.getImageData(0,0,1024,512).data,1024,512);listener.current?.setColumns(columns.current)}
     globe.upload(img);img.close();S(`NASA imagery loaded · ${(40075/size).toFixed(1)} km per pixel`);
    }catch{if(alive&&!stage)S('Imagery unavailable. Refresh to retry.');return}
   }
  }
  function draw(t:number){if(!alive)return;frame=requestAnimationFrame(draw);if(t-last<globe.gap)return;if(!drag.current)rot.current.lon+=Math.min(t-last,200)*(listener.current?.009:spinning.current?.003:0);last=t;listener.current?.scan(rot.current.lon,rot.current.lat);globe.draw(rot.current.lon,rot.current.lat)}
  S('Loading NASA imagery…');void loadImagery();frame=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(frame);loading.abort();globe.dispose();columns.current=null;listener.current?.setColumns(null)};
 },[url]);
 return <div className="globe-stage"><div className="globe-disc"><canvas ref={canvas} width={600} height={600} tabIndex={0} aria-label="3D NASA globe. Drag or use arrow keys to rotate; Enter inspects center." onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.preventDefault();if(e.key==='ArrowLeft')rot.current.lon-=10;if(e.key==='ArrowRight')rot.current.lon+=10;if(e.key==='ArrowUp')rot.current.lat=Math.min(70,rot.current.lat+10);if(e.key==='ArrowDown')rot.current.lat=Math.max(-70,rot.current.lat-10);if(e.key==='Enter')onPick(rot.current.lat,((rot.current.lon+180)%360+360)%360-180)}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY}}} onPointerMove={e=>{const d=drag.current;if(!d)return;rot.current.lon-=(e.clientX-d.x)*.5;rot.current.lat=Math.max(-70,Math.min(70,rot.current.lat+(e.clientY-d.y)*.4));d.x=e.clientX;d.y=e.clientY}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}/>{sound&&<SoundOverlay sound={sound}/>}</div><div className="globe-cross">+</div><div className="globe-buttons"><button onClick={()=>P(!spin)}>{spin?'Ⅱ Pause rotation':'↻ Rotate'}</button><button onClick={()=>onPick(rot.current.lat,((rot.current.lon+180)%360+360)%360-180)}>⌖ Inspect center</button></div><small role="status">{status}</small></div>
}
