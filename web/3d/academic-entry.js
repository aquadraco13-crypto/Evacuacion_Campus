import * as THREE from './three.module.js';

// Front chord of the circular block. The doors replace this sector of the drum.
export const entryHalfWidth=5.40;
export const entryAngle=Math.asin(entryHalfWidth/18.9);
export const entryZ=Math.sqrt(18.9**2-entryHalfWidth**2);

function headerPrint(texture,anniversary){
  const name=anniversary?'Emblema conmemorativo 50':'Rótulo del bloque académico-administrativo';
  const map=texture(name,1024,320,(c,w,h)=>{
    c.fillStyle='#eeece1';c.fillRect(0,0,w,h);
    for(const [y,color] of [[0,'#5a7843'],[-12,'#82a54c'],[-34,'#aec479']]){
      c.beginPath();c.moveTo(0,0);c.lineTo(w,0);c.lineTo(w,49+y);
      c.bezierCurveTo(w*.78,108+y,w*.34,42+y,0,76+y);c.closePath();c.fillStyle=color;c.fill();
    }
    c.textAlign='center';c.textBaseline='middle';
    if(anniversary){
      c.fillStyle='#bac8a4';c.font='italic bold 142px Georgia';c.fillText('50',w/2,h*.59);
      c.strokeStyle='#799275';c.lineWidth=3;c.beginPath();
      c.ellipse(w*.51,h*.64,103,49,-.18,0,Math.PI*1.75);c.stroke();
    }else{
      c.fillStyle='#26342c';c.font='bold 51px Arial';c.fillText('BLOQUE',w/2,h*.53);
      c.font='bold 41px Arial';c.fillText('ACADÉMICO - ADMINISTRATIVO',w/2,h*.73,w*.92);
    }
  },3);
  return new THREE.MeshStandardMaterial({name,map,roughness:.75});
}

export function academicEntry(kit,m,texture,round){
  const {group,mesh,box}=kit,g=group('Acceso académico-administrativo');
  round.add(g);g.position.z=entryZ;
  const H=entryHalfWidth,opening=3.93,centers=[-2.46,2.46],floor=.23,upper=3.51;
  const top=5.87,glass=new THREE.MeshStandardMaterial({name:'Acceso · vidrio laminado intacto',
    color:0xa4c1ba,transparent:true,opacity:.27,roughness:.23,metalness:.08,depthWrite:false,side:THREE.DoubleSide});
  const rubber=new THREE.MeshStandardMaterial({name:'Acceso · juntas de acristalamiento',color:0x334340});
  const reflection=texture('Reflejo continuo de las copas',1024,180,(c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#85958f');sky.addColorStop(.62,'#a2afa6');sky.addColorStop(1,'#687a70');
    c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.filter='blur(2.5px)';
    for(let j=0;j<3;j++){
      c.beginPath();c.moveTo(0,h);
      for(let x=0;x<=w+2;x+=2){
        const y=h*(.79+.05*j+.105*Math.sin(x*.011+j)+.05*Math.cos(x*.025)+.018*Math.sin(x*.13+2*j));
        c.lineTo(x,y);
      }
      c.lineTo(w,h);c.fillStyle=['#64796a85','#576b5b85','#5362558f'][j];c.fill();
    }
  },5);
  const upperGlass=new THREE.MeshStandardMaterial({name:'Acceso · cristal de la franja superior',map:reflection,
    transparent:true,opacity:.60,depthWrite:false,side:THREE.DoubleSide,roughness:.26});
  const alu=m.steel;
  for(const [a,b] of [[-H,centers[0]-opening/2],[centers[0]+opening/2,centers[1]-opening/2],[centers[1]+opening/2,H]]){
    box(g,[b-a,upper,.33],[(a+b)/2,upper/2,0],m.darkGreen);
  }
  box(g,[2*H,.37,.36],[0,upper+.185,0],m.darkGreen);
  box(g,[2*H,.22,.35],[0,top-.11,0],m.white);
  box(g,[2*H,.07,.17],[0,upper+.405,.11],alu);
  const clerestoryBottom=upper+.44,clerestoryTop=top-.23;
  for(let i=0;i<10;i++){
    const w=2*H/10,cx=-H+(i+.5)*w,y=(clerestoryBottom+clerestoryTop)/2;
    const pane=new THREE.PlaneGeometry(w-.042,clerestoryTop-clerestoryBottom);
    const uv=pane.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setX(j,(i+uv.getX(j))/10);
    mesh(g,'Paño superior de vidrio',pane,upperGlass,[cx,y,.027]);
    box(g,[.050,clerestoryTop-clerestoryBottom+.08,.102],[cx-w/2,y,.055],alu);
  }
  for(const y of [clerestoryBottom,clerestoryTop])box(g,[H*2,.056,.105],[0,y,.052],alu);
  box(g,[.05,clerestoryTop-clerestoryBottom,.10],[H,(clerestoryBottom+clerestoryTop)/2,.055],alu);
  const headY=2.48;
  function glazedLeaf(parent,cx,w,height,z,y0,handle){
    box(parent,[w-.077,height-.11,.024],[cx,y0+height/2,z],glass);
    for(const sign of [-1,1])box(parent,[.050,height,.072],[cx+sign*(w/2-.025),y0+height/2,z+.013],alu);
    for(const y of [y0+.045,y0+height-.025])box(parent,[w,.052,.073],[cx,y,z+.013],alu);
    if(handle){
      const hx=cx+handle*(w/2-.14);
      for(const y of [y0+.89,y0+1.24])box(parent,[.028,.028,.095],[hx,y,z+.081],alu);
      box(parent,[.031,.38,.032],[hx,y0+1.065,z+.12],alu);
    }
  }
  for(const [i,x] of centers.entries()){
    const a=x-opening/2,b=x+opening/2;
    const panel=headerPrint(texture,i===1);
    box(g,[opening-.06,upper-headY-.07,.07],[x,(upper+headY)/2,-.004],m.white);
    mesh(g,panel.name,new THREE.PlaneGeometry(opening-.09,upper-headY-.09),panel,[x,(upper+headY)/2,.040]);
    for(const end of [a,b])box(g,[.08,upper-floor,.15],[end,(upper+floor)/2,.04],alu);
    for(const y of [floor,headY,upper-.022])box(g,[opening,.065,.15],[x,y,.04],alu);
    const jamb=.48,leaf=(opening-2*jamb-.10)/2;
    for(const edge of [a+jamb/2+.025,b-jamb/2-.025])glazedLeaf(g,edge,jamb-.045,headY-floor-.07,.035,floor+.035,0);
    glazedLeaf(g,x+leaf/2+.015,leaf,headY-floor-.07,.035,floor+.035,-1);
    if(i===0){
      const door=group('Hoja de vidrio abierta hacia el vestíbulo');g.add(door);
      door.position.set(x-leaf-.005,floor+.035,.03);door.rotation.y=Math.PI*.46;
      glazedLeaf(door,leaf/2,leaf,headY-floor-.07,0,0,1);
    }else glazedLeaf(g,x-leaf/2-.015,leaf,headY-floor-.07,.035,floor+.035,1);
    box(g,[opening,.025,.14],[x,floor+.007,.10],rubber);
  }
  // Complete the vestibule behind both glazed bays and connect the left bay to the hall.
  const tz=-3.12,corridorX=-1.95,corridorW=5.28/round.scale.x;
  for(const [a,b] of [[-H,corridorX-corridorW/2],[corridorX+corridorW/2,H]]){
    box(g,[b-a,3.82,.14],[(a+b)/2,2.12,tz],m.plaster);
    box(g,[b-a,1.0,.035],[(a+b)/2,.73,tz+.084],m.lining,{repeat:[.58,.62]});
  }
  box(g,[2*H,.12,3.13],[0,4.04,tz/2],m.white);
  for(const side of [-1,1])box(g,[.16,top,3.42],[side*(H-.02),top/2,-1.59],m.darkGreen);
  box(g,[2*H,.08,3.28],[0,floor-.04,-1.56],m.tile,{repeat:[1.44,1.44]});
  for(const side of [-1,1]){
    const stripeX=corridorX+side*(2.64-1.10)/round.scale.x;
    box(g,[.72/round.scale.x,.006,3.20],[stripeX,floor+.003,-1.56],m.check,
      {repeat:[1.44/round.scale.x,1.44/round.scale.z]});
  }
  // The public walkway rises to this porch. Carry the left checker strip all
  // the way through the open leaf, with one aligned metric grid on the porch.
  const porch=new THREE.Shape(),end=4.15;
  porch.moveTo(-H,0);porch.lineTo(H,0);porch.lineTo(H,-end+.33);
  porch.quadraticCurveTo(H,-end,H-.33,-end);porch.lineTo(-H+.33,-end);
  porch.quadraticCurveTo(-H,-end,-H,-end+.33);porch.closePath();
  const lip=new THREE.ExtrudeGeometry(porch,{depth:.202,bevelEnabled:false});
  lip.rotateX(-Math.PI/2);mesh(g,'Canto del umbral',lip,m.lining,[0,.015,0]);
  const surface=new THREE.ShapeGeometry(porch);surface.rotateX(-Math.PI/2);
  const pos=surface.attributes.position,uv=surface.attributes.uv;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    pos.setY(i,floor-.006*z/end);
    uv.setXY(i,x*round.scale.x/1.44,-z*round.scale.z/1.44);
  }
  surface.computeVertexNormals();mesh(g,'Porche de gres frente a las puertas',surface,m.tile);
  const bandX=corridorX-(2.64-1.10)/round.scale.x,bandW=.72/round.scale.x;
  const strip=new THREE.PlaneGeometry(bandW,end);strip.rotateX(-Math.PI/2);strip.translate(bandX,0,end/2);
  const coords=strip.attributes.position,st=strip.attributes.uv;
  for(let i=0;i<coords.count;i++){
    const z=coords.getZ(i);coords.setY(i,floor+.003-.006*z/end);
    st.setXY(i,(coords.getX(i)-bandX+bandW/2)*round.scale.x/1.44,-z*round.scale.z/1.44);
  }
  strip.computeVertexNormals();mesh(g,'Damero de entrada',strip,m.check);
  return g;
}
