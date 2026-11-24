import * as THREE from './three.module.js';

// Centre of the triangular clearing between the three trees in the annotated lawn.
export const monumentCenter=[269,386], monumentBearing=-.90;

function outline(letter){
  const s=new THREE.Shape();
  const hole=()=>{const p=new THREE.Path();s.holes.push(p);return p;};
  if(letter==='Y'){
    [[0,1],[.28,1],[.50,.59],[.72,1],[1,1],[.64,.38],[.64,0],[.36,0],[.36,.38]].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  }else if(letter==='O'){
    s.moveTo(.50,0);s.bezierCurveTo(.12,0,0,.11,0,.38);s.lineTo(0,.64);s.bezierCurveTo(0,.91,.13,1,.50,1);
    s.bezierCurveTo(.88,1,1,.90,1,.64);s.lineTo(1,.38);s.bezierCurveTo(1,.10,.88,0,.50,0);
    const p=hole();p.moveTo(.50,.18);p.bezierCurveTo(.66,.18,.69,.23,.69,.38);p.lineTo(.69,.64);
    p.bezierCurveTo(.69,.79,.65,.82,.50,.82);p.bezierCurveTo(.35,.82,.31,.79,.31,.64);
    p.lineTo(.31,.38);p.bezierCurveTo(.31,.23,.34,.18,.50,.18);p.closePath();
  }else if(letter==='♥'){
    s.moveTo(.5,0);s.bezierCurveTo(.43,.063,0,.42,0,.70);s.bezierCurveTo(0,1.02,.32,1.10,.50,.87);
    s.bezierCurveTo(.69,1.10,1,1.02,1,.70);s.bezierCurveTo(1,.43,.60,.09,.50,0);
  }else if(letter==='U'){
    s.moveTo(0,1);s.lineTo(0,.31);s.bezierCurveTo(0,.08,.15,0,.50,0);s.bezierCurveTo(.85,0,1,.08,1,.31);
    s.lineTo(1,1);s.lineTo(.70,1);s.lineTo(.70,.32);s.bezierCurveTo(.70,.22,.66,.18,.5,.18);
    s.bezierCurveTo(.34,.18,.30,.22,.30,.32);s.lineTo(.30,1);
  }else if(letter==='P'){
    s.moveTo(0,0);s.lineTo(.31,0);s.lineTo(.31,.37);s.lineTo(.56,.37);s.bezierCurveTo(.90,.37,1,.47,1,.68);
    s.bezierCurveTo(1,.91,.89,1,.58,1);s.lineTo(0,1);
    const p=hole();p.moveTo(.31,.55);p.lineTo(.31,.82);p.lineTo(.53,.82);p.bezierCurveTo(.67,.82,.70,.77,.70,.68);
    p.bezierCurveTo(.70,.60,.66,.55,.53,.55);p.closePath();
  }else{
    s.moveTo(.99,.71);s.bezierCurveTo(.99,.93,.85,1,.52,1);s.bezierCurveTo(.12,1,0,.89,0,.64);
    s.lineTo(0,.36);s.bezierCurveTo(0,.10,.13,0,.52,0);s.bezierCurveTo(.86,0,1,.10,1,.33);
    s.lineTo(.70,.33);s.bezierCurveTo(.69,.22,.65,.18,.51,.18);s.bezierCurveTo(.35,.18,.31,.22,.31,.36);
    s.lineTo(.31,.64);s.bezierCurveTo(.31,.78,.35,.82,.51,.82);s.bezierCurveTo(.65,.82,.69,.79,.70,.71);
  }
  s.closePath();return s;
}

export function buildMonument({group,box,mesh},mat){
  const sign=group('Monumento YO ♥ UPC');
  const paint=(name,color,roughness=.48)=>new THREE.MeshStandardMaterial({name,color,roughness});
  const finish=(name,front,side)=>[paint(name+' · frente',front,.34),paint(name+' · canto',side,.42)];
  const white=finish('Esmalte marfil',0xfaf9f3,0xe0e4de),green=finish('Esmalte verde UPC',0x96cc37,0x73a22d);
  const red=finish('Corazón bermellón',0xff241a,0xd9191d);
  const grout=paint('Junta de la peana',0x6e8a7b),tiles=[0x23694e,0x287358,0x22644e,0x31775c,0x2c6b50].map((v,i)=>paint('Gres verde '+i,v,.37));
  const w=6.72,d=1.16,h=.53,n=15,tw=w/n;
  box(sign,[w-.055,.085,d-.055],[0,-.026,0],grout);
  box(sign,[w-.015,h-.016,d-.015],[0,h/2-.008,0],grout);
  for(let i=0;i<n;i++){
    const x=-w/2+(i+.5)*tw;
    for(const side of [-1,1])box(sign,[tw-.009,h-.014,.013],[x,h/2,side*d/2],tiles[(i*7+(side+1))%tiles.length]);
    for(let j=0;j<3;j++)box(sign,[tw-.009,.021,d/3-.009],[x,h+.003,(j-1)*d/3],tiles[(i+2*j)%tiles.length]);
  }
  for(const side of [-1,1])for(let j=0;j<3;j++)box(sign,[.014,h-.014,d/3-.009],[side*w/2,h/2,(j-1)*d/3],tiles[j]);
  const widths=[.76,.78,1.31,.78,.76,.77],gap=.13;
  let x=-(widths.reduce((a,b)=>a+b,0)+gap*5)/2;
  for(const [i,ch] of [...'YO♥UPC'].entries()){
    const g=new THREE.ExtrudeGeometry(outline(ch),{depth:ch==='♥'?.41:.34,bevelEnabled:true,
      bevelThickness:ch==='♥'?.055:.018,bevelSize:ch==='♥'?.029:.012,bevelSegments:3,curveSegments:18});
    g.scale(widths[i],1.59,1);
    mesh(sign,'Escultura · '+ch,g,ch==='♥'?red:i<2?white:green,[x,h+.032,-.17]);
    x+=widths[i]+gap;
  }
  // A strip of pale paving leads in from the perimeter walk to the viewing apron.
  function paving(cols,rows,side,depth,z){
    box(sign,[cols*side,.052,rows*depth],[0,-.022,z],mat.pavement);
  }
  paving(8,2,1.08,1.0,1.62);
  paving(2,9,.95,1.18,2.62+9*1.18/2);
  return sign;
}
