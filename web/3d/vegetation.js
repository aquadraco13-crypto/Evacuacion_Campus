import * as THREE from './three.module.js';

const tau=2*Math.PI, golden=2.399963;
function seeded(seed){
  return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
const species=[
  {name:'Mango',wood:0x715f4c,spread:.90,branches:9},
  {name:'Samán',wood:0x6d6354,spread:1.01,branches:9},
  {name:'Almendro',wood:0x8a7760,spread:.94,branches:12},
];

// One atlas for all canopy distances. Each tile is a botanical spray with open
// sky between its leaflets. The transparent margin also isolates the mip levels.
function leafAtlas(c,w,h,random){
  const S=w/3;
  for(let k=0;k<3;k++){
    c.save();c.translate(k*S,0);c.scale(S/512,h/512);
    c.beginPath();c.rect(8,8,496,496);c.clip();c.lineCap='round';
    const hue=[96,88,95][k];
    const line=(x,y,u,v,color,weight)=>{
      c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=weight;c.stroke();
    };
    function blade(x,y,length,width,angle){
      const lum=25+random()*19,green=hue+(random()-.5)*17;
      c.save();c.translate(x,y);c.rotate(angle);
      c.beginPath();c.moveTo(0,0);c.bezierCurveTo(length*.19,-width*.69,length*.68,-width*.70,length,0);
      c.bezierCurveTo(length*.74,width*.42,length*.29,width*.8,0,0);
      const grad=c.createLinearGradient(0,-width*.55,0,width*.55);
      grad.addColorStop(0,'hsl('+green+' 36% '+(lum+7)+'%)');
      grad.addColorStop(.50,'hsl('+green+' 40% '+lum+'%)');
      grad.addColorStop(.54,'hsl('+green+' 39% '+(lum-5)+'%)');
      grad.addColorStop(1,'hsl('+green+' 39% '+(lum-2)+'%)');
      c.fillStyle=grad;c.fill();line(0,0,length*.82,0,'rgba(205,212,134,.37)',Math.max(.7,width*.041));c.restore();
    }
    const finish=(x,y,len,angle)=>{
      line(x,y,x+len*Math.cos(angle),y+len*Math.sin(angle),'#767445',k===1?1.7:2.35);
      const pairs=[6,11,5][k];
      for(let i=0;i<pairs;i++)for(const side of [-1,1]){
        const t=(i+.19+.23*random())/pairs,leafLen=([62,31,61][k]+random()*13)*(1-.47*t);
        blade(x+Math.cos(angle)*len*t,y+Math.sin(angle)*len*t,leafLen,
          leafLen*[.27,.35,.57][k],angle+side*(.58+.52*random()));
      }
      blade(x+len*.94*Math.cos(angle),y+len*.94*Math.sin(angle),23,8,angle);
    };
    let x=251,y=486;
    for(let i=0;i<9;i++){
      const u=252+Math.sin(i*.61)*11,v=y-44;
      line(x,y,u,v,'#727242',4.3-i*.33);
      for(const side of [-1,1]){
        const reach=54+Math.sin((i+.65)/10*Math.PI)*143;
        const a=-Math.PI/2+side*(.95-.029*i+.15*random());
        finish(x,y,reach,a);
        if(k===1)finish(x+Math.cos(a)*reach*.53,y+Math.sin(a)*reach*.53,reach*.56,a+side*.45);
      }
      x=u;y=v;
    }
    finish(x,y,40,-Math.PI/2);c.restore();
  }
}

function buffers(){return {pos:[],uv:[],rgb:[],ix:[]};}
function barkTexture(c,w,h,random){
  c.fillStyle='#e9e4d9';c.fillRect(0,0,w,h);
  for(let i=0;i<1700;i++){
    const x=w*random(),y=h*random(),d=2+random()**2*57,bend=(random()-.5)*7;
    c.strokeStyle=i%4===0?'rgba(255,254,237,.67)':'rgba(82,76,62,'+(.12+random()*.28)+')';
    c.lineWidth=.4+random()**2*3.6;
    for(const dy of [0,-h]){
      c.beginPath();c.moveTo(x,y+dy);
      c.bezierCurveTo(x-1.7,y+dy+d*.28,x+bend,y+dy+d*.64,x+bend*.5,y+dy+d);
      c.stroke();
    }
  }
}
function geometry(b){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(b.pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(b.rgb,3));
  if(b.uv.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));
  g.setIndex(b.ix);g.computeVertexNormals();return g;
}
const v=(x,y,z)=>new THREE.Vector3(x,y,z);

// Bent three-dimensional branches with longitudinal bark ridges and root flare.
function limb(b,points,radii,color,random,sides){
  const initial=b.pos.length/3,twist=random()*.4,base=new THREE.Color(color);
  const ridges=Array.from({length:sides},()=>.94+random()*.12);
  const shades=ridges.map(r=>r*.88+random()*.21);
  const tangent=points.at(-1).clone().sub(points[0]).normalize();
  const guide=Math.abs(tangent.x)>.84?v(0,0,1):v(1,0,0);
  let distance=0;
  points.forEach((p,j)=>{
    if(j)distance+=points[j-1].distanceTo(p);
    const axis=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(j-1,0)]).normalize();
    const side=v(0,0,0).crossVectors(axis,guide).normalize(),other=v(0,0,0).crossVectors(axis,side);
    for(let i=0;i<=sides;i++){
      const idx=i%sides,a=tau*i/sides+twist,rad=ridges[idx]*radii[j];
      b.pos.push(...p.clone().addScaledVector(side,Math.cos(a)*rad).addScaledVector(other,Math.sin(a)*rad).toArray());
      b.uv.push(i/sides,distance/1.28);
      const shade=shades[idx]*(.87+.12*j/(points.length-1));b.rgb.push(base.r*shade,base.g*shade,base.b*shade);
      if(!j||i===sides)continue;
      const stride=sides+1,prev=initial+(j-1)*stride+i,next=prev+1;
      b.ix.push(prev,next,next+stride,prev,next+stride,prev+stride);
    }
  });
}

function spray(b,k,p,length,width,heading,lift,roll,tint){
  const initial=b.pos.length/3,pose=new THREE.Quaternion().setFromEuler(new THREE.Euler(-lift,heading,roll,'YXZ'));
  const color=new THREE.Color().setRGB(tint,tint*.99,tint*.91);
  for(let j=0;j<=3;j++)for(let i=0;i<=2;i++){
    const t=j/3,side=i-1;
    const local=v(side*width*.5,Math.sin(t*Math.PI)*length*.17-side*side*width*.10-t*t*length*.21,t*length);
    b.pos.push(...local.applyQuaternion(pose).add(p).toArray());
    b.uv.push((k+.012+.976*i/2)/3,.012+.976*t);b.rgb.push(color.r,color.g,color.b);
    if(j<3&&i<2){const n=initial+j*3+i;b.ix.push(n,n+3,n+4,n,n+4,n+1);}
  }
}

function crownTemplate(k,seed){
  const random=seeded(seed),s=species[k],wood=buffers(),leaves=buffers();
  const lean=v((random()-.5)*.77,0,(random()-.5)*.70);
  const forkH=[2.46,2.70,3.28][k]+random()*.33,fork=lean.clone();fork.y=forkH;
  const forkBase=fork.clone().multiplyScalar(.45);forkBase.y=1.46;
  const trunkWidth=[.27,.36,.245][k];
  limb(wood,[v(0,-.09,0),v(.03,.25,.01),forkBase,fork],[trunkWidth*1.63,trunkWidth*1.12,trunkWidth,trunkWidth*.72],s.wood,random,12);
  const phase=random()*tau;
  for(let i=0;i<5;i++){
    const a=phase+i*tau/5,r=trunkWidth*(2.5+random());
    limb(wood,[v(Math.cos(a)*r,-.055,Math.sin(a)*r),v(Math.cos(a)*r*.44,.16,Math.sin(a)*r*.44),v(.02,.53,0)],
      [.025,.105,trunkWidth*.73],s.wood,random,8);
  }
  for(let i=0;i<s.branches;i++){
    const a=phase+i*golden+random()*.24,tier=k===2?Math.floor(i/4)/2:i/(s.branches-1);
    const reach=(k===2?2.76-.95*tier:k===1?2.3+.68*Math.sin(i*2.26):1.86+.67*Math.sin(i*2.05))*s.spread;
    const base=fork.clone();base.y+=(k===2?tier*1.62:tier*.93)-.40;
    if(i===s.branches-1)limb(wood,[fork.clone().add(v(0,-.25,0)),base],[.16,.12],s.wood,random,8);
    const endY=(k===2?4.0+tier*2.18:k===1?4.94+tier*1.18:3.82+tier*2.45)+(random()-.5)*.60;
    const mid=base.clone().add(v(Math.cos(a-.10)*reach*.47,.51+random()*.30,Math.sin(a-.10)*reach*.47));
    const outer=v(Math.cos(a)*reach,endY,Math.sin(a)*reach).add(lean);
    const bend=mid.clone().lerp(outer,.49).add(v(-Math.sin(a)*.17,.09,Math.cos(a)*.17));
    limb(wood,[base,mid,bend,outer],[.14+random()*.04,.105,.068,.039],s.wood,random,8);
    for(let j=0;j<3;j++){
      const ang=a+(j-1)*.84+random()*.24;
      const back=mid.clone().lerp(outer,.22+j*.37);
      const tip=back.clone().add(v(Math.cos(ang)*(.43+random()*.55),.26+random()*.84,Math.sin(ang)*(.43+random()*.55)));
      limb(wood,[back,back.clone().lerp(tip,.52).add(v(.05,.1,.09)),tip],[.052,.033,.012],s.wood,random,6);
      for(let n=0;n<12;n++){
        const az=ang+n*golden+random()*.45,layer=n%3,sz=[1.37,1.34,1.18][k]*(.73+random()*.55);
        const p=tip.clone().add(v(Math.sin(az)*.27,(layer-1)*.23,Math.cos(az)*.27));
        const lift=[-.99,-.49,-.43][k]+layer*.57+(random()-.5)*.68;
        spray(leaves,k,p,sz,sz*(k===1?1.19:.96),az,lift,(random()-.5)*1.55,.65+random()*.48);
      }
    }
  }
  return {wood:geometry(wood),leaves:geometry(leaves)};
}

export function createVegetation(kit,texture){
  const map=texture('Hojas del campus · mango, samán y almendro',1536,512,leafAtlas);
  map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;
  const bark=new THREE.MeshStandardMaterial({name:'Corteza estriada del campus',vertexColors:true,roughness:1,
    map:texture('Corteza · fisuras y fibras',256,384,barkTexture,7)});
  const foliage=species.map(s=>new THREE.MeshStandardMaterial({name:'Follaje · '+s.name,map,vertexColors:true,
    side:THREE.DoubleSide,alphaTest:.32,roughness:.89}));
  const variants=species.map((_,k)=>[0,1,2].map(j=>crownTemplate(k,3371+k*131+j*777)));
  const small=buffers();
  for(let i=0;i<9;i++)spray(small,0,v(0,0,0),1.12,.99,golden*i,-.45+(i%3)*.65,i*.28,.84+.16*(i%2));
  const rosette=geometry(small);
  return {
    tree(x,z,h,r,base,parent){
      const random=seeded(Math.imul(Math.round(x*101),1640531)^Math.imul(Math.round(z*97),80561));
      const k=Math.floor(random()*3),model=variants[k][Math.floor(random()*3)],turn=[0,random()*tau,0];
      const scale=[r/4,h/7.1,r*(.86+.23*random())/4],at=[x,base,z];
      kit.part(parent,model.wood,bark,scale,at,turn);
      kit.part(parent,model.leaves,foliage[k],scale,at,turn);
    },
    crown(parent,point,r,depth,yaw){
      kit.part(parent,rosette,foliage[0],[r,r*.80,r*depth],point,[0,yaw,0]);
    }
  };
}
