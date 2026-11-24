import * as THREE from './three.module.js';

// Approximate position on the paved apron, between the west court and Carrera 30.
export const cafeACenter=[126.3,222.6];
export const cafeABearing=.08-Math.PI/2+.52;

export function buildBlockACafe({group,box,part,beam,mesh},mat,texture){
  const cafe=group('Cafetería del Bloque A');
  function section(name){
    const node=group('Cafetería A · '+name);
    cafe.add(node);
    return node;
  }
  const shell=section('Pórtico abierto');
  const screen=section('Celosías escalonadas');
  const tables=section('Mesas y sillas verdes');
  const counter=section('Barra de servicio');
  const surface=(name,color,extra={})=>new THREE.MeshStandardMaterial({
    name:'Cafetería A · '+name,color,roughness:.79,...extra
  });
  const ochre=surface('terrazo ocre',0xe7c483,{map:mat.serviceConcrete.map});
  const grille=surface('celosía de concreto',0xb69a69);
  const cream=surface('cielo raso',0xe2d8c6);
  const green=surface('asientos verdes',0x21705b,{roughness:.48,side:THREE.DoubleSide});
  const steel=surface('tubos pintados',0xc6c1a9,{metalness:.28});
  const laminate=surface('tableros de mesa',0xb3805e);
  const lamp=surface('difusor de luz',0xfff3ce,{emissive:0xffebbd,emissiveIntensity:.48});
  const mineral=surface('ladrillo de sardinel',0xbd8963);
  const post=new THREE.CylinderGeometry(1,1,1,20);
  const floor=.18, ceiling=3.88, halfWidth=7.8, front=-3.62;
  const xColumns=[-7.8,-3.9,0,3.9,7.8];
  const brickUV={repeat:[2.43,1.44]};

  box(shell,[17.5,.12,8.95],[0,-.025,0],mat.structure);
  box(shell,[16.16,.18,7.98],[0,.075,0],ochre);
  box(shell,[16.13,.025,7.95],[0,floor-.013,0],mat.pavement,{repeat:[2.42,2.42]});
  box(shell,[16.92,.20,8.5],[0,ceiling+.10,0],cream);
  box(shell,[16.72,.68,8.30],[0,ceiling+.53,0],mat.brick,brickUV);
  box(shell,[16.86,.07,8.44],[0,ceiling+.905,0],mat.structure);
  box(shell,[16.1,.042,7.66],[0,ceiling+.96,0],cream);
  for(let i=0;i<126;i++){
    box(shell,[.126,.18,.052],[-8.30+i*.1325,ceiling+.27,-4.156],mineral);
  }

  function column(x,z){
    part(shell,post,ochre,[.179,ceiling-floor,.179],[x,(ceiling+floor)/2,z]);
    part(shell,post,ochre,[.204,.52,.204],[x,floor+.26,z]);
    part(shell,post,grille,[.211,.039,.211],[x,floor+.54,z]);
    part(shell,post,ochre,[.208,.115,.208],[x,ceiling-.060,z]);
  }
  for(const x of xColumns) for(const z of [front,3.65]) column(x,z);
  for(const x of [-halfWidth,halfWidth]) column(x,0);
  // The lattice hangs farther down beside each column, forming stepped arches.
  function lattice(cx,cz,span,onSide=false){
    function rail(u,y,w,h){
      box(screen,onSide?[.115,h,w]:[w,h,.115],onSide?[cx,y,cz+u]:[cx+u,y,cz],grille);
    }
    const levels=[5,5,4,3,2,2,2,3,4,5,5], pitch=span/levels.length, rise=.239;
    for(let i=0;i<=levels.length;i++){
      const h=Math.max(levels[i-1]||0,levels[i]||0)*rise;
      rail(-span/2+i*pitch,ceiling-h/2-.05,.054,h);
    }
    for(let row=0;row<=5;row++){
      let start=-1;
      for(let i=0;i<=levels.length;i++){
        if(i<levels.length && levels[i]>=row){
          if(start<0) start=i;
        } else if(start>=0){
          rail(((start+i)*pitch-span)/2,ceiling-.05-row*rise,(i-start)*pitch+.054,.053);
          start=-1;
        }
      }
    }
  }
  for(let i=1;i<xColumns.length;i++) lattice((xColumns[i]+xColumns[i-1])/2,front,3.58);
  for(const x of [-halfWidth,halfWidth]) for(const z of [-1.81,1.825]) lattice(x,z,3.28,true);
  for(const x of [-5.65,-1.85,1.85,5.65]) for(const z of [-1.9,1.1]){
    box(shell,[.76,.072,.52],[x,ceiling-.035,z],mat.frame);
    box(shell,[.69,.018,.46],[x,ceiling-.074,z],lamp);
  }

  // A bent seat and backrest in one shell on a light tubular frame.
  const profile=[[-.22,.473],[-.17,.454],[.095,.449],[.17,.47],[.19,.52],[.20,.639],[.237,.805],[.23,.837]];
  const verts=[],index=[];
  for(const [i,[z,y]] of profile.entries()){
    const w=i===0 || i===profile.length-1?.183:.212;
    verts.push(-w,y+.015,z,0,y,z,w,y+.015,z);
    if(i){const a=(i-1)*3; for(let j=0;j<2;j++) index.push(a+j,a+j+3,a+j+1,a+j+1,a+j+3,a+j+4);}
  }
  const seat=new THREE.BufferGeometry();
  seat.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  seat.setIndex(index);
  seat.computeVertexNormals();
  function chair(x,z,yaw){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const point=(dx,y,dz)=>[x+c*dx+s*dz,floor+y,z-s*dx+c*dz];
    part(tables,seat,green,[1,1,1],point(0,0,0),[0,yaw,0]);
    for(const side of [-1,1]){
      for(const end of [-1,1]) beam(tables,post,point(side*.202,.011,end*.202),point(side*.154,.453,end*.14),.016,.016,steel);
      beam(tables,post,point(side*.15,.42,.13),point(side*.15,.72,.214),.013,.013,steel);
    }
  }
  for(const [i,x] of [-6.15,-3.50,1.90,4.55,6.55].entries()) for(const z of [-2.36,.06]){
    part(tables,post,laminate,[.55,.054,.55],[x,floor+.745,z]);
    part(tables,post,steel,[.08,.69,.08],[x,floor+.37,z]);
    part(tables,post,steel,[.33,.047,.33],[x,floor+.027,z]);
    chair(x,z-.82,Math.PI-.05*(i%2));
    chair(x,z+.82,.10*(i%3));
  }

  box(counter,[15.9,3.70,.17],[0,floor+1.85,3.80],mat.brick,brickUV);
  box(counter,[8.00,1.02,.72],[.28,floor+.51,2.25],mat.pine);
  box(counter,[8.16,.095,.84],[.28,floor+1.067,2.23],mat.ivory);
  for(const x of [-1.95,.12,2.23]) box(counter,[.05,.89,.04],[x,floor+.505,1.874],steel);
  box(counter,[1.07,1.80,.72],[-5.58,floor+.90,3.21],steel);
  box(counter,[.89,1.47,.043],[-5.58,floor+.94,2.83],mat.glass);
  for(const y of [.53,.92,1.34]) box(counter,[.84,.026,.029],[-5.58,floor+y,2.80],steel);
  box(counter,[.40,.067,.32],[2.91,floor+1.15,2.18],mat.frame);
  box(counter,[.32,.23,.047],[2.91,floor+1.29,2.17],mat.dark,{rotate:[.18,0,0]});
  const boardMap=texture('Rótulo interior · Cafetería del Bloque A',1024,160,(ctx,w,h)=>{
    ctx.fillStyle='#25453d';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#efe5bf';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='600 78px Arial';ctx.fillText('Cafetería del Bloque A',w/2,h/2);
  });
  const board=mesh(counter,'Rótulo de la barra',new THREE.PlaneGeometry(4.1,.64),
    surface('rótulo de la barra',0xffffff,{map:boardMap}),[.28,2.82,3.695]);
  board.rotation.y=Math.PI;
  return cafe;
}
