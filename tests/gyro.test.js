// Run from the repo root: node tests/gyro.test.js
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'..','index.html'),'utf8');
const m=html.match(/\/\*TILT-MATH-START\*\/([\s\S]*?)\/\*TILT-MATH-END\*\//);
assert(m,'tilt math markers missing');
const {tiltWheelAngle,tiltCurve,assistBlend}=new Function(m[1]+';return{tiltWheelAngle,tiltCurve,assistBlend}')();
const R=Math.PI/180;
// Build the beta/gamma a phone reports. wheel: + = turned right. lean: screen tipped back from upright.
function pose(wheel,lean,orient){
 const sx=-Math.sin(wheel*R)*Math.cos(lean*R),sy=Math.cos(wheel*R)*Math.cos(lean*R),uz=Math.sin(lean*R);
 const [ux,uy]=orient===90?[sy,-sx]:[-sy,sx];
 let beta=Math.asin(uy)/R,gamma=Math.atan2(-ux,uz)/R;
 if(gamma>=90||gamma<-90){beta=(beta>=0?180:-180)-beta;gamma+=gamma>0?-180:180}
 return[beta,gamma]}
for(const o of[90,270])for(const lean of[-30,-5,-0.5,0.5,5,30,45])for(const w of[-30,-10,0,10,30]){
 const got=tiltWheelAngle(...pose(w,lean,o),o);
 assert(Math.abs(got-w)<0.01,`angle o=${o} lean=${lean} wheel=${w} got ${got}`)}
// no jump when the phone passes through vertical
for(const o of[90,270]){let prev=null;for(let lean=-20;lean<=20;lean+=0.25){const a=tiltWheelAngle(...pose(8,lean,o),o);if(prev!==null)assert(Math.abs(a-prev)<0.5,'jump at lean '+lean);prev=a}}
// nearly flat: weaker, never wild
for(const o of[90,270])for(const lean of[65,75,85,89]){const a=tiltWheelAngle(...pose(20,lean,o),o);assert(a>=0&&a<=20.01,'flat '+lean+' '+a)}
for(const full of[46,39,32,26,21]){
 assert.strictEqual(Math.abs(tiltCurve(0,full)),0);assert.strictEqual(Math.abs(tiltCurve(1.4,full)),0);
 assert.strictEqual(tiltCurve(full,full),1);assert.strictEqual(tiltCurve(-90,full),-1);
 let p=-1;for(let d=-60;d<=60;d+=0.1){const v=tiltCurve(d,full);assert(v>=p-1e-9);p=v}}
for(const a of[0,.25,.45])for(let help=-1;help<=1;help+=0.1){let p=-2;for(let s=-1;s<=1.00001;s+=0.01){
 const v=assistBlend(Math.min(1,s),help,a);assert(v>=p-1e-9&&v>=-1&&v<=1,'assist not monotonic');p=v}
 assert(Math.abs(assistBlend(1,help,a)-1)<1e-9&&Math.abs(assistBlend(-1,help,a)+1)<1e-9)}
console.log('gyro tests passed');
