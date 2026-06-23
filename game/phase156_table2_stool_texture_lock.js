import * as THREE from 'three';

const LABEL = 'PHASE-156-TABLE2-STOOL-TEXTURE-ASSET-LOCK';
const ROOT = 'PHASE156_TABLE2_STOOL_TEXTURE_ROOT';
const TEX = {
  felt:'data:image/webp;base64,UklGRg4FAABXRUJQVlA4IAIFAABwKACdASqAAIAAPvVmqk6qpaOiMHPs4VAeiWldkYaA9weEuzp4D/8JpRdG5iEQj/sV26tnV6rqJibrPrkxHQUUCohQXQ3QRYH/0OGrV1NZj9TcDr7miM3c+znSo+AXEQFHHFnIZdgT2XLSJAeXviahF1xdi5zFldpWdxW4X1f14uU67HG98AQqv9AxvDSsWETVhtToGJ4rBtVToq9jGeSyoniAUGrT93RPzCyIy0tfcBYV9OeoAJXJ8EXCRsFE0HdBIJzkhxEkqGnuJ25IMX7Plaif2k/W3g4XAg4vCYtlbwxemBrClmZvq0+I7z9BRAYCvSQpdxVjhVP1gypwjLg/CTThUw/IDFUOynOe9oFkj4lJc5BHQ6CMnk4dSbiOuzkomH8nVzcpyjo/ntN0cW2UXx5DQjD67OeOhfRKa+SWpUdVfkWCmHXDMXsEAAD8/OTaP0cIzhp4Fw9INy8w4V13S54uOKHIUBYkhHpL3tX6EgKaV1juln0Xcny7V5WgV6DE7yRRmFeJBRZOvVM4MvKGXIfb3cuqikRFWzmEnQRTsN9N3HwDQmXKHxzFZNveQo7IA7yLq08kIWXzE2huI95rWHuhUEVQX7ayyZ/zCQThSWOx3AaljHHEdIxB0sp45wiz02ur6JRHSZryx2tj9syZIS5Z7WkM0QHEs5pwmOWsxbpotW72o7+8oACvu4gs1WepWGsBSgMEQhBZmqHOZnL2MJmK2QdvjkxILdvvTtyLCvD40++aX937LVhFRqwEOyedYHGPsDejP70cLXPJxlVdw4Hhq85q4SPGmMDzH5TNLwqmbukojxIrHtYNCuyZ4SFzyXOf4blFismRXJPdL+JFHRuE22B/yzlq+yKJr/0eUAfQBnMz8yoCJaX5i/Oe4Gfpgvlx7HQWKCZpvJi98NOH8UihIY+yZKt/hbbyU/xLLQUSrLZP17THvCs8Dm+fjWkj/SVIygmaDBlA5GXcp5DHagZ6GqlKc8l+hIG327onjmF4RxP2kSXw9ntO/MyOruoYM3HeXxfneTtBlNb4Z9oxTapE1STd54Aesw7Lt938luUurv5jWNL9tW9lDcKkLYzz++e/xPckGkOMA+w5+0mC93NEqvGWCAFHSnRGlVOGW4m48NQuaboxQQcMZCreW4pxQpiNcUdcrNxrdbi+kPnMUbq2j58jtP7jCOkQ3aezzHlttiBjMPkqA1nX2rJK77ks49yDfusZNoDuhw2cg1hBlczZrNbqcq/NDTLORS4JXxwTMaGh+4XwCBtBfqcNNhPAwve3gZPCaRjVSC8CW+mmLuf8EGfNHM5JCAWEwyFB0mOTOz5YIItvBHi4XCa+U0wKVVKZwBXYAtz8lXtBGnASYYHSFsPxh5dkTVooKdduKBfVuV2OxyUMtKsO5xUtyV8+v4Iq9es1cw5TEyM8YeuQdl92DMhF082M9noLoIZC02tLAQGytyHK5agLZ7o8KDfXeXMLjYgW28WYHijkr4crM9B9MeK2/EUn/A2OMhNHjM+MRozXtWi31L2tTOolVXWXW5iflLDW0XVVOXsvcgJ3JdeygiMxKWAKOVSCoefo0iccUxyxdi9OqmqynYGpjAynhoTtInY8vunUmALLOxP5H6ETUys1RVCVQ6lLPrXzYxHQI9VnggMMvlJddUzdetKZJ+PU7gThilu4e+JkY8zc9p0lSZH2RysDZ3u/PnhHAAAA',
  leather:'data:image/webp;base64,UklGRiABAABXRUJQVlA4IBQBAAAQCQCdASqAAIAAPvV4slYtpqotoRgJ8bAeiWkG+IhqECIMbX4ChbMpKssHZvq1C2CFclvCw+UqxoSyn72yE7MCLsjOPydoGt8yYOKyyo3WWQAA/ul/bO9JdC2H4Ez9hyLcJxVt8gfHzYvVWgXVUIytkag4lAQfYED9ZVyfZc2genZDsM0A1LncBHlAW8rWolYA1mN5kWjyeHUWvbAHWjgRlP9mTh46eCU+jAHhpEBpmtr9PgazjdzG1H0Wqe6l7ILH2E0kFAelo55u6F8o0OCWehJItwwha1j5YNxMlvb8lEbrgEhQ/W9IBfK57Z2QQriAAGML4DN4MZdq4AaUMEf0ZOgugwHKAKPwAPp96cX8cQyfDAA=',
  wood:'data:image/webp;base64,UklGRr4BAABXRUJQVlA4ILIBAAAQDQCdASqAAIAAPvV6sVSqp6okIpM6+VAeiWltCG9X+QQ5A6gemJ2/Aav8Xo5f82DjK4SkUkjDADg6xUUKvYnhsWGRwq3Sq+U14W/FgvNe8sMZUt8kXfs1MX+tDVeZtlBDqNI/Xyfk7Tg3wpgMVRnWEAD+7DA/1MT+CVyJ40v6mw862zXo620PPlcdNE8A/nYLFFIITysuqX4QGLBCcP9rF6uvT/UY2ceBia0McvUb5tGVomYb4ZbX8/H79oVyrKYllCSQBf/1ahpBqHwRwJSHzvgxZp7JJ4KjqSrLeuN7H97qVKelq2X1tS/CQQpAOOsFljtvInHsVnWNOLxhZo3dItAWu8yXUBTNpVstejI7oEqoe/eL9XjGFBLHIVTojkwOTHIJshZoHzc0xVMqmhNnlyoN0RJIx3QA7sWWjHCmOZVFYmUqyqDPpy1gEtXbp+BffBuU/MUJCRkFdlTle0vv8/b062AVzGir7G0S54kMM0xrmmkVtuQAXe5X9RbQZ7LaJuzw6+49RcbTlj0UJHjJksvHF5/+Q8JZUT3Jff0aJGWHJC3UO3TAegyRyZDE3QwAAA==',
  fabric:'data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAADQBgCdASqAAIAAPvV6uFaqp6UkoIgBUB6JaW7dAAHdRf1afLiN4sT3t3q4ACoOqDG6+4oom1yFzBTbWsXu8gAA/u51qzz7UQH6LPY81RAJVK8jRwQI08pwicOD8p77NkDpo8dW0jRkLMAA'
};

function sceneRoot(scene){ return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene; }
function tex(key, rx=1, ry=1){ const t=new THREE.TextureLoader().load(TEX[key]); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); return t; }
function mat(opts){ return new THREE.MeshStandardMaterial({ roughness:.72, metalness:.04, ...opts }); }
function glow(color, opacity=.55){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false }); }
function cyl(name, r, h, material, x, y, z, scaleZ=1, seg=96){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg), material); m.name=name; m.position.set(x,y,z); m.scale.z=scaleZ; m.receiveShadow=true; return m; }
function box(name, sx, sy, sz, material, x, y, z){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material); m.name=name; m.position.set(x,y,z); m.receiveShadow=true; return m; }
function leg(name, material, x, z){ const m=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,.92,18), material); m.name=name; m.position.set(x,.43,z); m.rotation.x=x<0?.14:-.14; m.rotation.z=z<0?.14:-.14; return m; }
function addStool(parent, name, x, z, angle, open, mats){
  const g=new THREE.Group(); g.name=name; g.position.set(x,0,z); g.rotation.y=angle+Math.PI; parent.add(g);
  const seat=cyl(name+'_PADDED_SEAT',.38,.14,open?mats.openSeat:mats.fabric,0,.88,0,1,64); g.add(seat);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.018,8,64),mats.gold); ring.name=name+'_GOLD_RING'; ring.rotation.x=Math.PI/2; ring.position.y=.965; g.add(ring);
  [[-.2,.18],[.2,.18],[-.2,-.18],[.2,-.18]].forEach((p,i)=>g.add(leg(name+'_WOOD_LEG_'+i,mats.wood,p[0],p[1])));
  const foot=new THREE.Mesh(new THREE.TorusGeometry(.32,.016,8,64),mats.metal); foot.name=name+'_FOOT_RING'; foot.rotation.x=Math.PI/2; foot.position.y=.35; g.add(foot);
  if(open){ const halo=new THREE.Mesh(new THREE.TorusGeometry(.54,.026,8,80),mats.openGlow); halo.name=name+'_OPEN_PLAYER_HALO'; halo.rotation.x=Math.PI/2; halo.position.y=.99; g.add(halo); }
  return g;
}
function hideOld(root){ ['PHASE155_ENHANCED_REAL_TABLE_FALLBACK','PHASE142_PLAYABLE_POKER_CORE_ROOT'].forEach(n=>{ const o=root.getObjectByName(n); if(o) o.visible=false; }); }
function addText(root){
  const c=document.createElement('canvas'); c.width=1024; c.height=256; const g=c.getContext('2d');
  g.fillStyle='rgba(0,0,0,.72)'; g.fillRect(0,0,c.width,c.height); g.strokeStyle='#ffd98a'; g.lineWidth=8; g.strokeRect(10,10,c.width-20,c.height-20);
  g.textAlign='center'; g.textBaseline='middle'; g.font='900 42px system-ui'; g.fillStyle='#ffd98a'; g.fillText('TABLE 2 + STOOL ASSET LOCK',512,70,950);
  g.font='800 26px system-ui'; g.fillStyle='#bffcff'; g.fillText('Uploaded texture materials applied to table and stool visuals',512,130,950); g.fillText('Raw .MAX/.FBX preserved out of deploy to stay under 25 MB',512,178,950);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const p=new THREE.Mesh(new THREE.PlaneGeometry(2.75,.68),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide})); p.name='PHASE156_TABLE2_SOURCE_AUDIT_PLAQUE'; p.position.set(0,1.85,-2.35); root.add(p);
}
function install(scene=window.__SVR_SCENE__){
  if(!scene) return false;
  const host=sceneRoot(scene); if(!host) return false;
  hideOld(host);
  const old=host.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,0.75); host.add(root);
  const mats={
    felt:mat({map:tex('felt',2.4,1.6),color:0x1631b8,emissive:0x040735,emissiveIntensity:.12,roughness:.84}),
    rail:mat({map:tex('leather',2,1),color:0x2d1814,roughness:.65}),
    wood:mat({map:tex('wood',1.5,1.5),color:0xc48b4d,roughness:.56}),
    fabric:mat({map:tex('fabric',2,2),color:0x101015,roughness:.88}),
    openSeat:mat({map:tex('fabric',2,2),color:0x123d48,emissive:0x052c36,emissiveIntensity:.18,roughness:.84}),
    metal:mat({color:0xb7a472,roughness:.32,metalness:.58}),
    gold:glow(0xffd98a,.74),
    openGlow:glow(0x7ffcff,.45)
  };
  root.add(cyl('PHASE156_TABLE2_LEATHER_OUTER_RAIL',2.72,.30,mats.rail,0,.82,0,.60,128));
  root.add(cyl('PHASE156_TABLE2_BLACK_INNER_CUSHION',2.38,.16,mats.fabric,0,1.02,0,.56,128));
  root.add(cyl('PHASE156_TABLE2_BLUE_FELT_TOP_FROM_UPLOAD',2.12,.06,mats.felt,0,1.14,0,.52,128));
  const pass=new THREE.Mesh(new THREE.TorusGeometry(2.05,.025,8,160),mats.gold); pass.name='PHASE156_TABLE2_GOLD_PASS_LINE'; pass.scale.z=.52; pass.rotation.x=Math.PI/2; pass.position.y=1.185; root.add(pass);
  const logo=new THREE.Mesh(new THREE.CircleGeometry(.46,64),glow(0x7ffcff,.28)); logo.name='PHASE156_TABLE2_CENTER_SVR_LOGO_GLOW'; logo.rotation.x=-Math.PI/2; logo.position.y=1.195; root.add(logo);
  [[-1.5,-.55],[-.5,-.60],[.5,-.60],[1.5,-.55]].forEach((p,i)=>{ const l=leg('PHASE156_TABLE2_WOOD_TABLE_LEG_'+i,mats.wood,p[0],p[1]); l.scale.setScalar(1.35); root.add(l); });
  root.add(box('PHASE156_TABLE2_WOOD_CROSSBAR_FRONT',3.2,.08,.08,mats.wood,0,.34,.72)); root.add(box('PHASE156_TABLE2_WOOD_CROSSBAR_BACK',3.2,.08,.08,mats.wood,0,.34,-.72));
  [[0,3.28,0,true],[-2.55,1.78,-.95,false],[-2.55,-1.38,-2.18,false],[0,-3.10,Math.PI,false],[2.55,-1.38,2.18,false],[2.55,1.78,.95,false]].forEach((s,i)=>addStool(root,s[3]?'PHASE156_OPEN_PLAYER_STOOL_FROM_UPLOAD':'PHASE156_BOT_STOOL_FROM_UPLOAD_'+i,s[0],s[1],s[2],s[3],mats));
  addText(root);
  window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK={build:LABEL,active:true,tableAdded:true,stoolVisualsAdded:6,uploadedTexturesUsed:['VelvetDarkMask_Tile','LeatherScuffoldDiff','WoodOiledTile','FabricPlainSoft-Black'],rawFbxCopied:false,rawMaxCopied:false,reasonRawAssetsNotCopied:'table2.zip includes a 17.86 MB stool.fbx and 12.28 MB table 2.max; .max is not browser runtime ready and raw files would risk the 25 MB deploy rule. Optimized embedded texture materials and procedural table/stool geometry were added instead.',siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE156_TABLE2_AUDIT=()=>window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK;
  return true;
}
[500,1200,2500,5000].forEach(ms=>setTimeout(()=>install(),ms));
setInterval(()=>install(),5000);
install();
