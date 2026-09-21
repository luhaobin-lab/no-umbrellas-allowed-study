import {randomUnit} from './native-scheduler';
export interface RentalRequest {id:string;itemId:string;title:string;days:number;startDay:number;fair:number;min:number;max:number;realPrice:number;hope:number;tryPurchaseFirst:boolean;stage:'offer'|'counter'|'accepted'|'declined';counter:number|null;offered:number|null;reportIsFair:boolean;}
const roundEven=(v:number)=>{const n=Math.floor(v),d=v-n;return d===.5?n%2===0?n:n+1:Math.round(v);};
export function rentalHopePrice(min:number,max:number,rng:{rng:number}){const raw=min+Math.floor(randomUnit(rng)*Math.max(1,max-min)),scale=raw>=15000?1000:raw>=5000?500:raw>=500?100:raw>=50?10:5;return Math.min(max,Math.max(min,roundEven(Math.fround(raw/scale))*scale));}
/** RentalStartEvent accepts even a below-range price; high asks get one counter opportunity. */
export function offerRental(request:RentalRequest,amount:number,rng:{rng:number}):{outcome:'accepted'|'counter'|'declined'|'invalid';price:number|null}{
 if(request.stage!=='offer'||!Number.isSafeInteger(amount)||amount<0)return {outcome:'invalid',price:null};request.offered=amount;
 if(amount<=request.max){request.stage='accepted';return {outcome:'accepted',price:amount};}
 const step=Math.fround(Math.fround(request.realPrice-request.max)/5),probability=amount<request.max+step?1:amount<request.max+step*2?.7:amount<request.max+step*3?.5:amount<request.max+step*4?.2:0;
 if(randomUnit(rng)<probability){request.stage='counter';request.counter=request.hope;request.reportIsFair=true;return {outcome:'counter',price:request.hope};}
 request.stage='declined';return {outcome:'declined',price:null};
}
