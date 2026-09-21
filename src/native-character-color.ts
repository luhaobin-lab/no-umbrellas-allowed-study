/** Source character color is HSL adjustment, despite the older runtime's `hsv` name.
 * Verified against Windows shader 1338 DXBC; 1340/1344 use the same math, 1343
 * borrows 1338's OpaquePixelUniversal2D pass. This is before URP lights/outlines.
 */
export type NativeRgba=readonly [number,number,number,number];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Values are normalized 0..1. S/L are offsets around .5, not multiplication.
 * Epsilon is a shader uniform; 1e-10 supplies the removable achromatic limit.
 * HLSL fmod preserves a negative remainder; S/L are not clamped before conversion.
 */
export function nativeCharacterHslPixel(rgba:NativeRgba,adjust:readonly number[],epsilon=1e-10):[number,number,number,number]{
 const [r,g,b,a]=rgba;
 // Branches preserve the exact source RGB-to-HSL register ordering.
 const p=g<b?[b,g,-1,2/3]:[g,b,0,-1/3];
 const q=r<p[0]?[p[0],p[1],p[3],r]:[r,p[1],p[2],p[0]];
 const delta=q[0]-Math.min(q[1],q[3]),light=q[0]-.5*delta;
 const hue=(Math.abs(q[2]+(q[3]-q[1])/(6*delta+epsilon))+(adjust[0]??0))%1;
 const saturation=delta/(1-Math.abs(light*2-1)+epsilon)+(adjust[1]??.5)-.5,l=light+(adjust[2]??.5)-.5;
 const chroma=saturation*(1-Math.abs(2*l-1));
 return [(clamp(Math.abs(hue*6-3)-1)-.5)*chroma+l,(clamp(2-Math.abs(hue*6-2))-.5)*chroma+l,(clamp(2-Math.abs(hue*6-4))-.5)*chroma+l,a];
}
/** In-place Canvas ImageData conversion; source alpha is retained. Canvas supplies
 * the final normalized-byte clamp. Caller caches per image + adjustment tuple.
 */
export function applyNativeCharacterHsl(pixels:Uint8ClampedArray,adjust:readonly number[],epsilon=1e-10):Uint8ClampedArray{
 if((adjust[0]??0)===0&&(adjust[1]??.5)===.5&&(adjust[2]??.5)===.5)return pixels;
 for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;const c=nativeCharacterHslPixel([pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255,pixels[i+3]/255],adjust,epsilon);pixels[i]=c[0]*255;pixels[i+1]=c[1]*255;pixels[i+2]=c[2]*255;}
 return pixels;
}
