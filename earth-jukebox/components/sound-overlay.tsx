'use client';
import {useEffect,useRef} from 'react';
import {bandLat,type EarthSonifier} from '../lib/sonify';
const SIZE=600,CENTER=SIZE/2,RADIUS=275,SPARK_LIFE=1100,RAD=Math.PI/180;
// Draws what is being heard: the scan line, each band's loudness, chimes and the sound's spectrum.
export default function SoundOverlay({sound}:{sound:EarthSonifier}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const node=canvas.current!,ctx=node.getContext('2d')!,orbit=node.closest<HTMLElement>('.hero-orbit'),calm=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0;
  // The Earth is cropped by the hero, so the scan follows the meridian through the middle of what is visible.
  function aim(){if(!orbit)return;const box=node.getBoundingClientRect(),crop=orbit.getBoundingClientRect(),radius=box.width*RADIUS/SIZE,center=box.left+box.width/2,middle=(Math.max(crop.left,center-radius)+Math.min(crop.right,center+radius))/2;sound.offset=Math.asin(Math.max(-.9,Math.min(.9,(middle-center)/radius)))/RAD}
  function project(lat:number){const phi=lat*RAD,theta=sound.offset*RAD,tilt=sound.tilt*RAD,north=Math.sin(phi),depth=Math.cos(phi)*Math.cos(theta);return{x:CENTER+RADIUS*Math.cos(phi)*Math.sin(theta),y:CENTER-RADIUS*(north*Math.cos(tilt)-depth*Math.sin(tilt)),front:north*Math.sin(tilt)+depth*Math.cos(tilt)>.05}}
  function draw(now:number){
   frame=requestAnimationFrame(draw);aim();ctx.clearRect(0,0,SIZE,SIZE);
   const bins=sound.frequencies(),energy=bins.reduce((sum,value)=>sum+value,0)/bins.length/255;
   orbit?.style.setProperty('--pulse',calm?'0':energy.toFixed(3));
   if(!calm){ctx.lineWidth=3;ctx.strokeStyle='#54e6efaa';ctx.beginPath();bins.forEach((value,i)=>{for(const side of [-1,1]){const angle=-Math.PI/2+side*(i+.5)/bins.length*Math.PI,length=value/255*23;ctx.moveTo(CENTER+Math.cos(angle)*(RADIUS+2),CENTER+Math.sin(angle)*(RADIUS+2));ctx.lineTo(CENTER+Math.cos(angle)*(RADIUS+2+length),CENTER+Math.sin(angle)*(RADIUS+2+length))}});ctx.stroke()}
   ctx.lineWidth=2.5;ctx.strokeStyle='#7ff4ffc4';ctx.beginPath();let drawing=false;for(let lat=-88;lat<=88;lat+=4){const point=project(lat);if(!point.front){drawing=false;continue}if(drawing)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);drawing=true}ctx.stroke();
   sound.cells?.forEach((cell,band)=>{const point=project(bandLat(band));if(!point.front)return;ctx.fillStyle=cell.warmth>.5?'#ffd089':'#74e4ff';ctx.globalAlpha=.25+cell.level*.75;ctx.beginPath();ctx.arc(point.x,point.y,2+cell.level*7,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
   sound.sparks=sound.sparks.filter(spark=>now-spark.born<SPARK_LIFE);
   if(!calm)for(const spark of sound.sparks){const point=project(spark.lat);if(!point.front)continue;const age=(now-spark.born)/SPARK_LIFE;ctx.strokeStyle='#fff6d6';ctx.globalAlpha=1-age;ctx.lineWidth=2;ctx.beginPath();ctx.arc(point.x,point.y,6+age*(26+spark.size*30),0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
  }
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);orbit?.style.removeProperty('--pulse')};
 },[sound]);
 return <canvas ref={canvas} className="sound-overlay" width={SIZE} height={SIZE} aria-hidden="true"/>;
}
