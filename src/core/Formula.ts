/**
 * @fileoverview Proprietary Core Engine
 * DO NOT DISTRIBUTE.
 */
const _K=[0x1,0x2,0x1E,0x1F40,0x3C,0x64,0xEA60,0x0,0x3];export const _0xF=(()=>{let e=_K[0],r=_K[7],b=_K[7];return(x1:number,y1:number,x2:number,y2:number,t:number,dt:number)=>{const dx=x2-x1,dy=y2-y1,d=Math.sqrt(dx*dx+dy*dy);let ce=d*_K[1];if(ce>_K[0])ce=_K[0];const ds=ce-e,i=dt>_K[7]?-(ds/dt):_K[7],ir=d<(_K[0]*_K[8])/_K[2];if(ir){ce=_K[7];if(r===_K[7])r=t;}else{r=_K[7];}let a=_K[7],ib=false;if(ir&&r>_K[7]){a=(t-r)/_K[3];if(a>_K[0])a=_K[0];const bpm=_K[4]+a*_K[5],bi=_K[6]/bpm;if(t-b>bi){ib=true;b=t;}}e=ce;return{_e:ce,_i:i,_ir:ir,_a:a,_ib:ib};}})();
