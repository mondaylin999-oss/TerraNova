import type {Category} from './live-layers';

// Follows the mapping used by NASA's Webb sonifications: an image is scanned left to right,
// vertical position sets pitch, brightness sets loudness, colour sets timbre and bright points ring out.
export const BANDS=14,COLUMNS=180;
const TOP_LAT=80,RAMP=.25,STEPS=[0,3,5,7,10];
const VOICES:Record<Category,{root:number;wave:OscillatorType;glide:number;wind:number}>={
 weather:{root:196,wave:'sine',glide:.1,wind:1},
 ocean:{root:98,wave:'sine',glide:.22,wind:1.4},
 forest:{root:146.83,wave:'triangle',glide:.1,wind:.7},
 air:{root:261.63,wave:'sine',glide:.16,wind:1.6},
};
export type Cell={level:number;warmth:number;star:boolean};
export type Column=Cell[];
export type Spark={lat:number;born:number;size:number};
export const bandLat=(band:number)=>TOP_LAT-(band+.5)*2*TOP_LAT/BANDS;
const clamp=(value:number)=>Math.min(1,Math.max(0,value));
const noteFor=(root:number,band:number)=>{const up=BANDS-1-band;return root*2**(Math.floor(up/5)+STEPS[up%5]/12)};

// Averages the equirectangular texture into a grid of north-to-south cells for each longitude.
export function readColumns(tex:Uint8ClampedArray,width:number,height:number):Column[]{
 const raw:{luma:number;warmth:number}[][]=[],bandHeight=2*TOP_LAT/BANDS/180*height,top=(90-TOP_LAT)/180*height,columnWidth=width/COLUMNS;
 for(let c=0;c<COLUMNS;c++){const column=[];for(let b=0;b<BANDS;b++){let r=0,g=0,blue=0,n=0;for(let y=top+b*bandHeight;y<top+(b+1)*bandHeight;y+=2)for(let x=c*columnWidth;x<(c+1)*columnWidth;x+=2){const i=(Math.floor(y)*width+Math.floor(x))*4;r+=tex[i];g+=tex[i+1];blue+=tex[i+2];n++}r/=n;g/=n;blue/=n;column.push({luma:(.2126*r+.7152*g+.0722*blue)/255,warmth:clamp(.5+(r-blue)/(r+blue+1))})}raw.push(column)}
 const sorted=raw.flat().map(x=>x.luma).sort((a,b)=>a-b),floor=sorted[Math.floor(sorted.length*.15)],ceiling=Math.max(floor+.01,sorted[Math.floor(sorted.length*.985)]);
 const levels=raw.map(column=>column.map(x=>clamp((x.luma-floor)/(ceiling-floor))));
 return raw.map((column,c)=>column.map((cell,b)=>{const level=levels[c][b],around=[levels[(c+COLUMNS-1)%COLUMNS][b],levels[(c+1)%COLUMNS][b],levels[c][b-1]??level,levels[c][b+1]??level],mean=around.reduce((a,x)=>a+x)/4;return{level,warmth:cell.warmth,star:level>.7&&level-mean>.1}}));
}

export class EarthSonifier{
 private ctx=new AudioContext();
 private master=this.ctx.createGain();
 private analyser=this.ctx.createAnalyser();
 private echo=this.ctx.createConvolver();
 private noise=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);
 private tones:{osc:OscillatorNode;gain:GainNode}[]=[];
 private winds:{filter:BiquadFilterNode;gain:GainNode}[]=[];
 private columns:Column[]|null=null;
 private column=-1;
 private lastPing=0;
 private bins:Uint8Array<ArrayBuffer>;
 cells:Column|null=null;
 tilt=0;
 offset=0;
 sparks:Spark[]=[];
 constructor(private topic:Category,private volume:number){
  const {ctx,master,analyser,echo,noise}=this,compressor=ctx.createDynamicsCompressor(),wet=ctx.createGain();
  noise.getChannelData(0).forEach((_,i,data)=>{data[i]=Math.random()*2-1});
  const impulse=ctx.createBuffer(2,ctx.sampleRate*2,ctx.sampleRate);
  for(let channel=0;channel<2;channel++)impulse.getChannelData(channel).forEach((_,i,data)=>{data[i]=(Math.random()*2-1)*(1-i/data.length)**3});
  echo.buffer=impulse;wet.gain.value=.35;analyser.fftSize=128;analyser.smoothingTimeConstant=.78;this.bins=new Uint8Array(analyser.frequencyBinCount);
  master.gain.value=0;master.connect(compressor);echo.connect(wet);wet.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
  const source=ctx.createBufferSource();source.buffer=noise;source.loop=true;
  for(let band=0;band<BANDS;band++){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),windGain=ctx.createGain();
   gain.gain.value=0;windGain.gain.value=0;filter.type='bandpass';filter.Q.value=9;
   osc.connect(gain);gain.connect(master);gain.connect(echo);source.connect(filter);filter.connect(windGain);windGain.connect(master);osc.start();
   this.tones.push({osc,gain});this.winds.push({filter,gain:windGain});
  }
  source.start();this.tune(0);
 }
 private tune(time:number){const {root,wave}=VOICES[this.topic],now=this.ctx.currentTime;for(let band=0;band<BANDS;band++){const note=noteFor(root,band);this.tones[band].osc.type=wave;this.tones[band].osc.frequency.setTargetAtTime(note,now,time);this.winds[band].filter.frequency.setTargetAtTime(note*2,now,time)}}
 private silence(){const now=this.ctx.currentTime;this.column=-1;this.cells=null;for(const voice of [...this.tones,...this.winds])voice.gain.gain.setTargetAtTime(0,now,.15)}
 private burst(seconds:number){const source=this.ctx.createBufferSource();source.buffer=this.noise;source.start(0,Math.random());source.stop(this.ctx.currentTime+seconds);return source}
 private ping(band:number,cell:Cell,now:number){
  if(now-this.lastPing<.09)return;this.lastPing=now;this.sparks.push({lat:bandLat(band),born:performance.now(),size:cell.level});
  const note=noteFor(VOICES[this.topic].root,band)*2;
  for(const [ratio,loudness] of [[1,.09],[2.76,.03]]){const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.frequency.value=note*ratio;gain.gain.setValueAtTime(loudness*cell.level,now);gain.gain.exponentialRampToValueAtTime(.0001,now+1.4);osc.connect(gain);gain.connect(this.master);gain.connect(this.echo);osc.start(now);osc.stop(now+1.5)}
  if(cell.level>.92){const filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();filter.type='highpass';filter.frequency.value=6000;gain.gain.setValueAtTime(.05,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.55);this.burst(.6).connect(filter);filter.connect(gain);gain.connect(this.master);gain.connect(this.echo)}
 }
 private whoosh(){const now=this.ctx.currentTime,filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();filter.type='bandpass';filter.Q.value=1.4;filter.frequency.setValueAtTime(280,now);filter.frequency.exponentialRampToValueAtTime(2600,now+.7);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.16,now+.25);gain.gain.exponentialRampToValueAtTime(.0001,now+.8);this.burst(.85).connect(filter);filter.connect(gain);gain.connect(this.master);gain.connect(this.echo)}
 async play(){await this.ctx.resume();this.master.gain.setTargetAtTime(this.volume/100,this.ctx.currentTime,RAMP)}
 async pause(){this.master.gain.setTargetAtTime(0,this.ctx.currentTime,RAMP/3);await new Promise(done=>setTimeout(done,350));await this.ctx.suspend()}
 close(){void this.ctx.close()}
 setVolume(volume:number){this.volume=volume;if(this.ctx.state==='running')this.master.gain.setTargetAtTime(volume/100,this.ctx.currentTime,.05)}
 setTopic(topic:Category){if(topic===this.topic)return;this.topic=topic;this.whoosh();this.tune(.2)}
 setColumns(columns:Column[]|null){this.columns=columns;if(!columns)this.silence()}
 // Plays the slice of imagery under the scan line, so dragging the Earth scrubs the sound.
 scan(lon:number,tilt:number){
  this.tilt=tilt;if(!this.columns)return;
  const column=Math.floor((((lon+this.offset)/360+.5)%1+1)%1*COLUMNS)%COLUMNS;if(column===this.column)return;
  this.column=column;this.cells=this.columns[column];
  const now=this.ctx.currentTime,{glide,wind}=VOICES[this.topic];
  this.cells.forEach((cell,band)=>{const loud=cell.level**2;this.tones[band].gain.gain.setTargetAtTime(loud*cell.warmth*.16,now,glide);this.winds[band].gain.gain.setTargetAtTime(loud*(1-cell.warmth)*wind*.9,now,glide*2);if(cell.star)this.ping(band,cell,now)});
 }
 frequencies(){this.analyser.getByteFrequencyData(this.bins);return this.bins}
}
