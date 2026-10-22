import * as THREE from './three.module.min.js';
/* 3D hero: KT-2 hood + glass dome with a goldfish "director". Only loaded with ?hero=3d */
(function(){
  var hero=document.getElementById('hero');if(!hero)return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var wrap=document.createElement('div');wrap.id='dome3d';
  var cv=document.createElement('canvas');wrap.appendChild(cv);hero.appendChild(wrap);
  var renderer;
  try{renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,powerPreference:'low-power'});}
  catch(e){wrap.remove();document.documentElement.classList.remove('d3');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  var scene=new THREE.Scene();
  var cam=new THREE.PerspectiveCamera(32,1,.1,50);cam.position.set(0,.2,9.5);cam.lookAt(0,.1,0);
  scene.add(new THREE.AmbientLight(0xcff7e0,.9));
  var dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(-3,4,5);scene.add(dl);
  var rim=new THREE.PointLight(0x00ffc8,18,14);rim.position.set(3,-1,3);scene.add(rim);
  var g=new THREE.Group();scene.add(g);

  /* hood (white fluffy ring + ears) */
  var white=new THREE.MeshStandardMaterial({color:0xf4f1ea,roughness:1});
  var ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.34,20,56),white);g.add(ring);
  for(var s=-1;s<=1;s+=2){
    var ear=new THREE.Mesh(new THREE.ConeGeometry(.42,1.1,16),white);
    ear.position.set(s*.85,1.45,-.05);ear.rotation.z=-s*.28;g.add(ear);
    var inn=new THREE.Mesh(new THREE.ConeGeometry(.24,.8,12),new THREE.MeshStandardMaterial({color:0xe9b99a,roughness:1}));
    inn.position.set(s*.85,1.4,.12);inn.rotation.z=-s*.28;g.add(inn);
  }
  var back=new THREE.Mesh(new THREE.SphereGeometry(1.2,32,24),white);back.position.z=-2.4;back.scale.set(1.1,1.05,.8);g.add(back);
  var collar=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshStandardMaterial({color:0xc8651e,roughness:.85}));
  collar.position.set(0,-1.55,-.1);collar.scale.set(1.45,.55,.8);g.add(collar);
  var led=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),new THREE.MeshBasicMaterial({color:0x6a7cff}));led.position.set(0,-1.2,.6);g.add(led);

  /* dark dome interior + water tint */
  var inner=new THREE.Mesh(new THREE.SphereGeometry(.98,40,28),new THREE.MeshBasicMaterial({color:0x06231a,side:THREE.BackSide}));g.add(inner);
  var glow=new THREE.Mesh(new THREE.SphereGeometry(.97,40,28),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,
    vertexShader:'varying vec3 vN;void main(){vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vN;void main(){float a=.35+.45*(1.-abs(vN.z));gl_FragColor=vec4(.05,.55,.42,a*.55);}'}));g.add(glow);

  /* goldfish */
  var fish=new THREE.Group();
  var orange=new THREE.MeshStandardMaterial({color:0xff6a14,roughness:.45,emissive:0x331000});
  var finM=new THREE.MeshStandardMaterial({color:0xff9a3c,roughness:.6,transparent:true,opacity:.8,side:THREE.DoubleSide});
  var body=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),orange);body.scale.set(.34,.21,.16);fish.add(body);
  var tail=new THREE.Group();tail.position.x=-.3;fish.add(tail);
  [-1,1].forEach(function(k){var l=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),finM);l.scale.set(.2,.15,.015);l.position.set(-.14,k*.07,0);l.rotation.z=k*.5;tail.add(l);});
  var dors=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),finM);dors.scale.set(.15,.12,.015);dors.position.set(-.04,.2,0);dors.rotation.z=-.4;fish.add(dors);
  [-1,1].forEach(function(k){var p=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),finM);p.scale.set(.08,.04,.02);p.position.set(.1,-.07,k*.14);p.rotation.y=k*.6;fish.add(p);
    var e=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));e.position.set(.24,.06,k*.1);fish.add(e);
    var pu=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),new THREE.MeshBasicMaterial({color:0x111111}));pu.position.set(.268,.06,k*.11);fish.add(pu);});
  fish.scale.setScalar(1.25);g.add(fish);

  /* bubbles */
  var bubs=[],bm=new THREE.MeshBasicMaterial({color:0xcffff0,transparent:true,opacity:.55});
  for(var i=0;i<10;i++){var b=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),bm);b.userData={life:Math.random()};b.visible=false;g.add(b);bubs.push(b);}
  var bi=0;
  function bubble(x,y,z,v){var b=bubs[bi++%bubs.length];b.visible=true;b.userData.life=0;b.userData.v=v||.35;b.userData.s=.025+Math.random()*.035;b.userData.ox=x;b.position.set(x,y,z);b.scale.setScalar(b.userData.s);}

  /* glass */
  var glass=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),2.4);vec3 L=normalize(vec3(-.5,.7,.6));float sp=pow(max(dot(reflect(-L,normalize(vN)),normalize(vV)),0.),40.);float a=.06+f*.55+sp*.9;gl_FragColor=vec4(mix(vec3(.55,1.,.85),vec3(1.),sp),a);}'}));
  glass.renderOrder=5;g.add(glass);

  /* sizing */
  function size(){var r=wrap.getBoundingClientRect(),w=Math.max(80,r.width),h=Math.max(80,r.height);renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
  size();window.addEventListener('resize',size);

  /* pointer: dome tilts, fish chases */
  var px=0,py=0,tx=0,ty=0,lastMove=-9,mx=0,my=0;
  function onMove(e){var r=wrap.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.5;
    px=Math.max(-1.6,Math.min(1.6,(e.clientX-cx)/(window.innerWidth*.5)));py=Math.max(-1.6,Math.min(1.6,-(e.clientY-cy)/(window.innerHeight*.5)));lastMove=performance.now()/1000;}
  window.addEventListener('pointermove',onMove,{passive:true});
  var ray=new THREE.Raycaster(),dash=0,dashDir=1;
  hero.addEventListener('pointerdown',function(e){
    var r=cv.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
    var v=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(v,cam);
    if(ray.intersectObject(glass).length){dash=1;dashDir=Math.random()<.5?-1:1;for(var k=0;k<7;k++)bubble(fish.position.x+(Math.random()-.5)*.2,fish.position.y,fish.position.z,.5+Math.random()*.4);
      if(window.__heroZap)window.__heroZap();wrap.classList.remove('pop');void wrap.offsetWidth;wrap.classList.add('pop');}
  });

  var vx=0,vy=0,yaw=0,t0=performance.now(),running=true,vis=true,scrollK=0;
  window.addEventListener('scroll',function(){scrollK=Math.min(1,window.scrollY/Math.max(1,hero.offsetHeight));},{passive:true});
  function frame(){
    if(!running)return;requestAnimationFrame(frame);if(!vis||document.hidden)return;
    var t=(performance.now()-t0)/1000,now=performance.now()/1000,chase=(now-lastMove)<2.5;
    /* target in dome-local space */
    var wx=Math.sin(t*.7)*.52,wy=Math.sin(t*1.1+1)*.32;
    var ttx=chase?px*.42:wx,tty=chase?py*.45:wy;
    tx+=(ttx-tx)*.04;ty+=(tty-ty)*.04;
    var dx=tx-fish.position.x,dy=ty-fish.position.y;
    vx+=dx*.06;vy+=dy*.06;vx*=.9;vy*=.9;
    if(dash>0){vx+=dashDir*.05*dash;vy+=Math.sin(t*20)*.01;dash-=.03;}
    fish.position.x+=vx*.5;fish.position.y+=vy*.5;
    fish.position.z=Math.sin(t*.9)*.18;
    var r=Math.hypot(fish.position.x,fish.position.y);if(r>.62){fish.position.x*=.62/r;fish.position.y*=.62/r;}
    var wantYaw=(vx<-.002)?Math.PI:(vx>.002?0:yaw);yaw+=(wantYaw-yaw)*.08;
    fish.rotation.y=yaw;fish.rotation.z=Math.max(-.5,Math.min(.5,vy*3))*(Math.cos(yaw)>0?1:-1);
    tail.rotation.y=Math.sin(t*(8+Math.hypot(vx,vy)*60))*.55;
    if(Math.random()<.02)bubble(fish.position.x+(Math.cos(yaw)>0?.4:-.4),fish.position.y+.05,fish.position.z,.25+Math.random()*.25);
    bubs.forEach(function(b){if(!b.visible)return;b.userData.life+=.016*b.userData.v;b.position.y+=.012*(b.userData.v*3);b.position.x=b.userData.ox+Math.sin(b.userData.life*18)*.02;
      if(b.userData.life>1||Math.hypot(b.position.x,b.position.y)>.9)b.visible=false;});
    /* dome follows pointer / scroll */
    var ry=px*.35+Math.sin(t*.5)*.05,rx=-py*.25-scrollK*.5;
    g.rotation.y+=(ry-g.rotation.y)*.06;g.rotation.x+=(rx-g.rotation.x)*.06;
    g.position.y=Math.sin(t*1.2)*.07;
    led.material.color.setHex(Math.sin(t*3)>0?0x6a7cff:0x2a3270);
    renderer.render(scene,cam);
  }
  if(reduce){size();renderer.render(scene,cam);}else{requestAnimationFrame(frame);}
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(hero);
  window.__dome3d={scene:scene,fish:fish,group:g};
})();
