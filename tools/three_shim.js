// Minimal THREE shim: only what hypercars.js + the game's loft/strut/box helpers touch. Dumps world-space triangles.
const m4={id:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
 mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}};
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}
 clone(){return new Vector3(this.x,this.y,this.z)} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}
 length(){return Math.hypot(this.x,this.y,this.z)} normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z} cross(v){return new Vector3(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x)}}
class Quaternion{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}
 setFromUnitVectors(a,b){let r=a.dot(b)+1;let x,y,z;if(r<1e-6){r=0;if(Math.abs(a.x)>Math.abs(a.z)){x=-a.y;y=a.x;z=0}else{x=0;y=-a.z;z=a.y}}else{const c=a.cross(b);x=c.x;y=c.y;z=c.z}
  const l=Math.hypot(x,y,z,r)||1;this.x=x/l;this.y=y/l;this.z=z/l;this.w=r/l;return this}
 isId(){return this.x===0&&this.y===0&&this.z===0&&this.w===1}}
class Color{constructor(c){this.r=1;this.g=1;this.b=1;if(c!==undefined)this.set(c)}
 set(c){if(c&&c.r!==undefined){this.r=c.r;this.g=c.g;this.b=c.b;return this}
  if(typeof c==='string'){c=parseInt(c.replace('#',''),16)}this.r=((c>>16)&255)/255;this.g=((c>>8)&255)/255;this.b=(c&255)/255;return this}}
class Material{constructor(o={}){this.color=new Color(o.color!==undefined?o.color:0xffffff);this.transparent=!!o.transparent;this.opacity=o.opacity===undefined?1:o.opacity;this.emissive=o.emissive;this.basic=false}}
class MeshPhongMaterial extends Material{} class MeshLambertMaterial extends Material{}
class MeshBasicMaterial extends Material{constructor(o){super(o);this.basic=true}}
class Object3D{constructor(){this.position=new Vector3();this.rotation={x:0,y:0,z:0,order:'XYZ'};this.quaternion=new Quaternion();this.scale=new Vector3(1,1,1);this.children=[];this.parent=null;this.visible=true;this.userData={};this.castShadow=false;this.receiveShadow=false}
 add(...c){for(const o of c){if(o.parent)o.parent.children=o.parent.children.filter(k=>k!==o);o.parent=this;this.children.push(o)}return this}
 remove(o){this.children=this.children.filter(k=>k!==o);o.parent=null}
 local(){const{x,y,z}=this.rotation;const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  let R;
  if(!this.quaternion.isId()){const{x:qx,y:qy,z:qz,w:qw}=this.quaternion;
   R=[1-2*(qy*qy+qz*qz),2*(qx*qy+qz*qw),2*(qx*qz-qy*qw),0, 2*(qx*qy-qz*qw),1-2*(qx*qx+qz*qz),2*(qy*qz+qx*qw),0, 2*(qx*qz+qy*qw),2*(qy*qz-qx*qw),1-2*(qx*qx+qy*qy),0, 0,0,0,1]}
  else{const Rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],Rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];R=m4.mul(m4.mul(Rx,Ry),Rz)}
  const S=[this.scale.x,0,0,0,0,this.scale.y,0,0,0,0,this.scale.z,0,0,0,0,1];const T=m4.id();T[12]=this.position.x;T[13]=this.position.y;T[14]=this.position.z;
  return m4.mul(T,m4.mul(R,S))}}
class Group extends Object3D{} class Scene extends Object3D{}
class Mesh extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m}}
class BufferGeometry{constructor(){this.tris=[]} setAttribute(k,a){if(k==='position'){const p=a.array;for(let i=0;i<p.length;i+=9)this.tris.push([[p[i],p[i+1],p[i+2]],[p[i+3],p[i+4],p[i+5]],[p[i+6],p[i+7],p[i+8]]])}} computeVertexNormals(){}}
class Float32BufferAttribute{constructor(a){this.array=a}}
const quad=(t,a,b,c,d)=>{t.push([a,b,c],[a,c,d])};
class BoxGeometry extends BufferGeometry{constructor(w=1,h=1,d=1){super();const x=w/2,y=h/2,z=d/2,v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
 for(const f of [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])quad(this.tris,v[f[0]],v[f[1]],v[f[2]],v[f[3]])}}
class CylinderGeometry extends BufferGeometry{constructor(rt=1,rb=1,h=1,n=8){super();const t=this.tris,top=[],bot=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;top.push([Math.sin(a)*rt,h/2,Math.cos(a)*rt]);bot.push([Math.sin(a)*rb,-h/2,Math.cos(a)*rb])}
 for(let i=0;i<n;i++){const j=(i+1)%n;quad(t,bot[i],bot[j],top[j],top[i]);t.push([[0,h/2,0],top[j],top[i]],[[0,-h/2,0],bot[i],bot[j]])}}}
class CircleGeometry extends BufferGeometry{constructor(r=1,n=8){super();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;this.tris.push([[0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],[Math.cos(b)*r,Math.sin(b)*r,0]])}}}
class RingGeometry extends BufferGeometry{constructor(ri=.5,ro=1,n=8){super();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;quad(this.tris,[Math.cos(a)*ri,Math.sin(a)*ri,0],[Math.cos(a)*ro,Math.sin(a)*ro,0],[Math.cos(b)*ro,Math.sin(b)*ro,0],[Math.cos(b)*ri,Math.sin(b)*ri,0])}}}
class SphereGeometry extends BufferGeometry{constructor(r=1,ws=8,hs=6,ps=0,pl=Math.PI*2,ts=0,tl=Math.PI){super();const g=[];for(let y=0;y<=hs;y++){const row=[];for(let x=0;x<=ws;x++){const u=x/ws,v=y/hs;row.push([-r*Math.cos(ps+u*pl)*Math.sin(ts+v*tl),r*Math.cos(ts+v*tl),r*Math.sin(ps+u*pl)*Math.sin(ts+v*tl)])}g.push(row)}
 for(let y=0;y<hs;y++)for(let x=0;x<ws;x++)quad(this.tris,g[y][x],g[y+1][x],g[y+1][x+1],g[y][x+1])}}
module.exports={THREE:{Vector3,Quaternion,Color,Group,Scene,Mesh,Object3D,BufferGeometry,Float32BufferAttribute,MeshPhongMaterial,MeshLambertMaterial,MeshBasicMaterial,BoxGeometry,CylinderGeometry,CircleGeometry,RingGeometry,SphereGeometry},
 collect(root){const out=[];const walk=(o,pm)=>{if(o.visible===false)return;const w=m4.mul(pm,o.local());
  if(o instanceof Mesh){const mat=o.material;for(const t of o.geometry.tris){const p=t.map(v=>[w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12],w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13],w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]]);
   out.push({p,c:[mat.color.r,mat.color.g,mat.color.b],basic:mat.basic,a:mat.transparent?mat.opacity:1})}}
  o.children.forEach(k=>walk(k,w))};walk(root,m4.id());return out}};
