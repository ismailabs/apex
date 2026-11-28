const vm=require('vm'),fs=require('fs'),{THREE,collect}=require('./three_shim.js');
const ctx={THREE,Math,console};vm.createContext(ctx);
// ---- helpers copied verbatim from index.html ----
vm.runInContext(`
const V3=THREE.Vector3,UP=new V3(0,1,0);
const scene=new THREE.Scene();
function box(w,h,d,mat,x,y,z,parent,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;(parent||scene).add(m);return m}
function loft(secs,mat){
const pos=[],ring=s=>{const[x,w,y0,y1,tw=w*.6]=s,ym=y0+(y1-y0)*.6;return[[x,y0,-w*.8],[x,ym,-w],[x,y1,-tw],[x,y1,tw],[x,ym,w],[x,y0,w*.8]]};
const R=secs.map(ring),tri=(a,b,c)=>pos.push(...a,...b,...c);
for(let i=0;i<R.length-1;i++)for(let k=0;k<6;k++){const j=(k+1)%6;tri(R[i][k],R[i+1][k],R[i+1][j]);tri(R[i][k],R[i+1][j],R[i][j])}
for(let k=1;k<5;k++){tri(R[0][0],R[0][k],R[0][k+1]);const e=R[R.length-1];tri(e[0],e[k+1],e[k])}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;return m}
function strut(a,b,r,mat,parent){const A=new V3(...a),B=new V3(...b),d=B.clone().sub(A),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),5),mat);m.position.copy(A).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());parent.add(m);return m}
const tyreMat=new THREE.MeshLambertMaterial({color:0x16171b}),visorMat=new THREE.MeshPhongMaterial({color:0x0a1420});
`,ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'hc_extracted.js'),'utf8'),ctx);
// size guard-rails (metres): body is about 4.5-4.9 long, ~2.0 wide (mirrors add ~0.2), roof about 1.1-1.25 (Jesko wing taller)
const LIM={laferrari:{L:[4.55,4.85],W:2.3,H:[1.08,1.2]},chiron:{L:[4.55,4.85],W:2.3,H:[1.15,1.3]},jesko:{L:[4.55,5.1],W:2.3,H:[1.15,1.65]}};
const out={};
for(const d of vm.runInContext('HC.DEFS',ctx)){
  const car=d.build(d.liv);   // liv hex strings must be accepted by Color.set via setLivery AND constructor
  car.setLivery(d.liv);
  out[d.id]=collect(car.group);
  const bb=[[1e9,1e9,1e9],[-1e9,-1e9,-1e9]];for(const t of out[d.id])for(const v of t.p)for(let i=0;i<3;i++){bb[0][i]=Math.min(bb[0][i],v[i]);bb[1][i]=Math.max(bb[1][i],v[i])}
  {const l=bb[1][0]-bb[0][0],w=bb[1][2]-bb[0][2],h=bb[1][1],q=LIM[d.id];const bad=[];if(l<q.L[0]||l>q.L[1])bad.push('LENGTH '+l.toFixed(2));if(w>q.W)bad.push('WIDTH '+w.toFixed(2));if(h<q.H[0]||h>q.H[1])bad.push('HEIGHT '+h.toFixed(2));if(out[d.id].length>6000)bad.push('TRIS '+out[d.id].length);console.log(bad.length?'  WARN '+d.id+': '+bad.join(', '):'  ok   '+d.id+' size within targets')}
  console.log(d.id,'tris',out[d.id].length,'bbox x',bb[0][0].toFixed(2),bb[1][0].toFixed(2),'y',bb[0][1].toFixed(2),bb[1][1].toFixed(2),'z',bb[0][2].toFixed(2),bb[1][2].toFixed(2),
    'wheels',car.wheels.length,'pivots',car.pivots.length,'tcam',car.tcam);
}
fs.writeFileSync(require('path').join(__dirname,'tris.json'),JSON.stringify(out));

