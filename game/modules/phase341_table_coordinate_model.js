export const BUILD='PHASE-341-CANONICAL-TABLE-GEOMETRY-CARD-MOTION-LOCK';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function dealOrder(dealer,count=6){return Array.from({length:count},(_,i)=>(dealer+i+1+count)%count)}
export function buildTableLayout(input={}){
 const center={x:Number(input.center?.x)||0,y:Number(input.center?.y)||0,z:Number(input.center?.z)||0};
 const sx=Math.abs(Number(input.size?.x)||3.4),sz=Math.abs(Number(input.size?.z)||1.9),top=Number(input.top)||1;
 const width=clamp(sx*.94,2.2,4.1),depth=clamp(sz*.92,1.18,2.25),seatCount=Math.max(2,Number(input.seatCount)||6);
 const seats=Array.from({length:seatCount},(_,id)=>{const angle=Math.PI/2+id*Math.PI*2/seatCount;return{id,angle,x:center.x+Math.cos(angle)*width*.43,y:top+.025,z:center.z+Math.sin(angle)*depth*.43,yaw:-angle+Math.PI/2}});
 const cardW=clamp(width*.052,.16,.215),cardH=cardW*1.46,spacing=clamp(width*.067,.215,.27);
 const community=Array.from({length:5},(_,i)=>({x:center.x+(i-2)*spacing,y:top+.034,z:center.z,rot:0}));
 const holes=seats.map(s=>Array.from({length:2},(_,i)=>({x:center.x+(s.x-center.x)*.76+Math.cos(s.angle+Math.PI/2)*(i-.5)*cardW*.84,y:top+.036,z:center.z+(s.z-center.z)*.76+Math.sin(s.angle+Math.PI/2)*(i-.5)*cardW*.84,rot:s.yaw})));
 return{build:BUILD,center,size:{x:width,z:depth},top,seatCount,seats,card:{w:cardW,h:cardH},community,holes,dealerSource:{x:center.x,y:top+.20,z:center.z-depth*.58},burn:{x:center.x-width*.23,y:top+.037,z:center.z-depth*.05},muck:{x:center.x+width*.25,y:top+.04,z:center.z-depth*.10},logo:{x:center.x,y:top+.014,z:center.z,w:Math.min(.82,width*.22)},passLine:{outerW:width*.475,outerD:depth*.455,inset:.0508}};
}
export function validateLayout(layout){
 const errors=[];if(!layout||layout.seatCount!==6)errors.push('seat-count');if(!(layout.seats[0].z>layout.center.z))errors.push('south-seat');if(Math.abs(layout.logo.w/layout.size.x-.22)>.03)errors.push('logo-ratio');if(Math.abs(layout.passLine.inset-.0508)>.0001)errors.push('pass-inset');for(const p of layout.community){if(Math.abs(p.x-layout.center.x)>layout.size.x*.45||Math.abs(p.z-layout.center.z)>layout.size.z*.45)errors.push('community-outside')};return{build:BUILD,pass:errors.length===0,errors}}
export function selfTest(){const l=buildTableLayout({center:{x:0,z:0},size:{x:3.8,z:2},top:1,seatCount:6}),order=dealOrder(2,6),v=validateLayout(l);return{pass:v.pass&&order.join(',')==='3,4,5,0,1,2'&&l.holes.length===6&&l.community.length===5,layout:v,order,logoRatio:l.logo.w/l.size.x}}
