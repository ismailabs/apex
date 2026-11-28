import json, sys, numpy as np
from PIL import Image
data=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'tris.json')))
W,H=880,520
def look(eye,tgt,fov,aspect):
    eye=np.array(eye,float);tgt=np.array(tgt,float)
    f=tgt-eye;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
    t=np.tan(np.radians(fov)/2)
    def proj(p):
        d=p-eye;x=d@r;y=d@u;z=d@f
        return np.stack([(x/(z*t*aspect)*.5+.5)*W,(1-(y/(z*t)*.5+.5))*H,z],1)
    return proj,f
def render(tris,eye,tgt,fov,bg=(40,46,58)):
    proj,f=look(eye,tgt,fov,W/H)
    L=np.array([.45,.78,.32]);L/=np.linalg.norm(L)
    img=np.zeros((H,W,3),float);img[:]=np.array(bg)/255
    # gradient floor hint
    zb=np.full((H,W),1e9)
    opaque=[t for t in tris if t['a']>=1];glass=[t for t in tris if t['a']<1]
    for group in (opaque,glass):
        for t in group:
            p=np.array(t['p']);n=np.cross(p[1]-p[0],p[2]-p[0]);ln=np.linalg.norm(n)
            if ln<1e-12:continue
            n/=ln
            if n@f>0: n=-n   # double-sided: face the viewer for lighting
            col=np.array(t['c'])
            if not t['basic']:
                lam=max(0,n@L);hemi=.5+.5*n[1]
                spec=max(0,(n@L))**1 *0
                col=np.clip(col*(.32+.28*hemi*0+0.55*lam+.18*hemi),0,1)
            s=proj(p)
            if (s[:,2]<=.1).any():continue
            x0=int(max(0,np.floor(s[:,0].min())));x1=int(min(W-1,np.ceil(s[:,0].max())))
            y0=int(max(0,np.floor(s[:,1].min())));y1=int(min(H-1,np.ceil(s[:,1].max())))
            if x0>x1 or y0>y1:continue
            xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
            a,b,c=s[0],s[1],s[2]
            den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-9:continue
            w0=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den
            w1=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den
            w2=1-w0-w1
            m=(w0>=0)&(w1>=0)&(w2>=0)
            if not m.any():continue
            z=w0*a[2]+w1*b[2]+w2*c[2]
            sub=zb[y0:y1+1,x0:x1+1]
            if t['a']>=1:
                upd=m&(z<sub)
                sub[upd]=z[upd]
                img[y0:y1+1,x0:x1+1][upd]=col
            else:
                upd=m&(z<sub)
                reg=img[y0:y1+1,x0:x1+1]
                reg[upd]=reg[upd]*(1-t['a'])+col*t['a']
    im=Image.fromarray((np.clip(img,0,1)*255).astype('uint8')).resize((W//2*1,H//2*1),Image.LANCZOS) if False else Image.fromarray((np.clip(img,0,1)*255).astype('uint8'))
    return im
views={'front34':((6.2,3.9,6.4),(0,.3,0),23),'rear34':((-6.4,3.2,-6.0),(0,.4,0),24),'side':((0,1.2,9.5),(0,.55,0),22),'front':((9.5,1.3,0),(0,.5,0),20)}
name=sys.argv[1]
which=sys.argv[2:] or list(views)
for v in which:
    e,t,fov=views[v]
    render(data[name],e,t,fov).save(f'out_{name}_{v}.png')
print('ok')
