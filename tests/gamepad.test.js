// Run from the repo root: node tests/gamepad.test.js
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'..','index.html'),'utf8');
const m=html.match(/\/\*GAMEPAD-MATH-START\*\/([\s\S]*?)\/\*GAMEPAD-MATH-END\*\//);
assert(m,'gamepad math markers missing');
const {gpAxisCurve,gpTriggerVal,gpReadState}=new Function(m[1]+';return{gpAxisCurve,gpTriggerVal,gpReadState}')();

// gpAxisCurve: deadzone, symmetry, monotonicity, and [-1, 1] clamping
assert.strictEqual(gpAxisCurve(0),0);
assert.strictEqual(gpAxisCurve(0.08),0);
assert.strictEqual(gpAxisCurve(-0.11),0);
assert.strictEqual(gpAxisCurve(1),1);
assert.strictEqual(gpAxisCurve(-1),-1);
assert.strictEqual(gpAxisCurve(1.5),1);
assert.strictEqual(gpAxisCurve(-1.5),-1);
assert(Math.abs(gpAxisCurve(0.5)+gpAxisCurve(-0.5))<1e-9,'axis curve should be odd-symmetric');
{
 let prev=-1;
 for(let x=-1;x<=1.0001;x+=0.02){
  const v=gpAxisCurve(Math.min(1,x));
  assert(v>=prev-1e-9&&v>=-1&&v<=1,'axis curve must be monotonic in [-1, 1]');
  prev=v;
 }
}

// gpTriggerVal: deadzone, clamping, digital fallback
assert.strictEqual(gpTriggerVal(undefined),0);
assert.strictEqual(gpTriggerVal({value:0.02,pressed:false}),0);
assert.strictEqual(gpTriggerVal({value:1,pressed:true}),1);
assert.strictEqual(gpTriggerVal({value:0,pressed:true}),1);
{
 const half=gpTriggerVal({value:0.5,pressed:false});
 assert(half>0.4&&half<0.6,'half trigger should scale between 0 and 1');
}

// gpReadState: standard gamepad mapping
const btn=(v=0,p=v>0.5)=>({value:v,pressed:p});
function mockPad(overrides={}){
 const buttons=Array.from({length:16},()=>btn(0,false));
 const axes=[0,0,0,0];
 if(overrides.axes)overrides.axes.forEach((v,i)=>axes[i]=v);
 if(overrides.buttons)for(const [idx,val] of Object.entries(overrides.buttons))buttons[idx]=val;
 return {connected:true,mapping:'standard',axes,buttons};
}

// Analog stick + RT/LT
{
 const s=gpReadState(mockPad({axes:[0.6,-0.2],buttons:{7:btn(0.8,true),6:btn(0.25,false),1:btn(1,true)}}));
 assert(s.st>0.3&&s.st<0.8,'analog stick right');
 assert(s.th>0.7&&s.th<0.85,'analog RT throttle');
 assert(s.br>0.15&&s.br<0.3,'analog LT brake');
 assert.strictEqual(s.hb,true,'B button triggers handbrake');
 assert.strictEqual(s.buttons.back,true,'B button maps to back');
}

// D-pad steering + A button digital throttle fallback + menu buttons
{
 const s=gpReadState(mockPad({buttons:{14:btn(1,true),0:btn(1,true),3:btn(1,true),4:btn(1,true),9:btn(1,true),8:btn(1,true)}}));
 assert.strictEqual(s.st,-1,'D-pad left steers full left');
 assert.strictEqual(s.th,1,'A button acts as digital throttle');
 assert.strictEqual(s.buttons.confirm,true);
 assert.strictEqual(s.buttons.reset,true);
 assert.strictEqual(s.buttons.cam,true);
 assert.strictEqual(s.buttons.pause,true);
 assert.strictEqual(s.buttons.mute,true);
 assert.strictEqual(s.buttons.left,true);
}

// Stick overrides D-pad when outside deadzone; D-pad wins when stick is centered
{
 const s=gpReadState(mockPad({axes:[-1,0],buttons:{15:btn(1,true)}}));
 assert.strictEqual(s.st,-1,'stick outside deadzone takes priority');
}

console.log('gamepad tests passed');
