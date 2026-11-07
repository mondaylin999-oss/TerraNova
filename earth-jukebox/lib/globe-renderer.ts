// Draws the NASA texture as a sphere. Both renderers use the disc proportions the sound overlay assumes.
const IMAGE_SIZES=[2048,4096,8192],MAX_CANVAS=2560,RADIUS_SHARE=275/300,RAD=Math.PI/180;
const VERTEX=`#version 300 es
in vec2 corner;out vec2 screen;
void main(){screen=corner;gl_Position=vec4(corner,0.,1.);}`;
const FRAGMENT=`#version 300 es
precision highp float;
in vec2 screen;out vec4 color;
uniform sampler2D earth;uniform vec2 turn;uniform float radius,edge;
const float PI=3.14159265359;
void main(){
 vec2 p=screen/radius;float reach=length(p),alpha=1.-smoothstep(1.-edge,1.,reach);
 if(alpha<=0.)discard;
 float z=sqrt(max(0.,1.-reach*reach)),north=p.y*cos(turn.y)+z*sin(turn.y),depth=z*cos(turn.y)-p.y*sin(turn.y);
 float u=(atan(p.x,depth)+turn.x)/(2.*PI)+.5,wrapped=fract(u),centred=fract(u+.5)-.5;
 // Picks the longitude form without a jump here, otherwise mipmapping draws a seam where the map wraps.
 vec2 uv=vec2(fwidth(wrapped)<=fwidth(centred)?wrapped:centred,.5-asin(clamp(north,-1.,1.))/PI);
 color=vec4(texture(earth,uv).rgb*(.55+.45*z)*alpha,alpha);
}`;
export type Globe={maxImage:number;gap:number;upload(image:ImageBitmap):void;draw(lon:number,lat:number):void;dispose():void};

class GpuGlobe implements Globe{
 maxImage:number;gap=0;
 private texture=this.gl.createTexture();
 private program=this.gl.createProgram();
 private ready=false;
 private turn:WebGLUniformLocation|null;
 private edge:WebGLUniformLocation|null;
 private anisotropy=this.gl.getExtension('EXT_texture_filter_anisotropic');
 constructor(private canvas:HTMLCanvasElement,private gl:WebGL2RenderingContext){
  this.maxImage=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  for(const [type,source] of [[gl.VERTEX_SHADER,VERTEX],[gl.FRAGMENT_SHADER,FRAGMENT]] as const){const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(this.program,shader);gl.deleteShader(shader)}
  gl.linkProgram(this.program);gl.useProgram(this.program);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const corner=gl.getAttribLocation(this.program,'corner');gl.enableVertexAttribArray(corner);gl.vertexAttribPointer(corner,2,gl.FLOAT,false,0,0);
  gl.uniform1f(gl.getUniformLocation(this.program,'radius'),RADIUS_SHARE);
  this.turn=gl.getUniformLocation(this.program,'turn');this.edge=gl.getUniformLocation(this.program,'edge');
 }
 upload(image:ImageBitmap){
  const {gl}=this;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(this.anisotropy)gl.texParameterf(gl.TEXTURE_2D,this.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(16,gl.getParameter(this.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  this.ready=true;
 }
 draw(lon:number,lat:number){
  const {gl,canvas}=this,size=Math.min(MAX_CANVAS,Math.round((canvas.clientWidth||600)*devicePixelRatio));
  if(canvas.width!==size){canvas.width=canvas.height=size}
  if(!this.ready)return;
  gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(this.turn,(lon%360)*RAD,lat*RAD);gl.uniform1f(this.edge,3/size/RADIUS_SHARE);gl.drawArrays(gl.TRIANGLES,0,3);
 }
 dispose(){this.gl.deleteTexture(this.texture);this.gl.deleteProgram(this.program)}
}

// Fallback for browsers without WebGL2: slower and softer, but keeps the Earth on screen.
class SoftwareGlobe implements Globe{
 maxImage=2048;gap=100;
 private texture:{data:Uint8ClampedArray;width:number;height:number}|null=null;
 private ctx:CanvasRenderingContext2D;
 private out:ImageData;
 constructor(canvas:HTMLCanvasElement){canvas.width=canvas.height=600;this.ctx=canvas.getContext('2d')!;this.out=this.ctx.createImageData(600,600)}
 upload(image:ImageBitmap){const copy=document.createElement('canvas');copy.width=image.width;copy.height=image.height;const ctx=copy.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);this.texture={data:ctx.getImageData(0,0,image.width,image.height).data,width:image.width,height:image.height}}
 draw(lon:number,lat:number){
  if(!this.texture)return;const {data,width,height}=this.texture,{out}=this,size=600,r=size/2*RADIUS_SHARE,a=lon*RAD,b=lat*RAD;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const X=(x-size/2)/r,Y=(size/2-y)/r,rr=X*X+Y*Y,i=(y*size+x)*4;if(rr>1){out.data[i+3]=0;continue}const Z=Math.sqrt(1-rr),yy=Y*Math.cos(b)+Z*Math.sin(b),zz=Z*Math.cos(b)-Y*Math.sin(b),u=((Math.atan2(X,zz)+a)/(2*Math.PI)+.5)%1,v=.5-Math.asin(yy)/Math.PI,ti=(Math.min(height-1,Math.floor(v*height))*width+Math.min(width-1,Math.floor((u+1)%1*width)))*4;for(let k=0;k<3;k++)out.data[i+k]=data[ti+k]*(.55+.45*Z);out.data[i+3]=255}
  this.ctx.putImageData(out,0,0);
 }
 dispose(){this.texture=null}
}

export function createGlobe(canvas:HTMLCanvasElement):Globe{
 const gl=canvas.getContext('webgl2',{antialias:false,alpha:true,premultipliedAlpha:true});
 return gl?new GpuGlobe(canvas,gl):new SoftwareGlobe(canvas);
}
// A quick image first, then the smallest one that matches the screen. The sphere's centre shows
// about 1/π of the map's width across its diameter, and the selected view is 82vw wide.
export function imageSizes(canvas:HTMLCanvasElement,maxImage:number){
 const needed=Math.max(canvas.clientWidth,innerWidth*.82)*devicePixelRatio*Math.PI,usable=IMAGE_SIZES.filter(size=>size<=maxImage),best=usable.find(size=>size>=needed)??usable[usable.length-1];
 return best>usable[0]?[usable[0],best]:[best];
}
