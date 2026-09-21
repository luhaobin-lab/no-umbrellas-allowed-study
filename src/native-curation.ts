/** Exact pure rules from Curation and all entries of CurationDeclarativeList (Windows 1.0.5). */
import {getNativeCard} from './native-rules';
import {isNativeFake} from './native-generation';
import type {Contexts} from './native-scheduler';
export type CurationAction={type:'say'|'chunk';id:string}|{type:'acceptItem'|'declineItem'|'leave'}|{type:'acceptPrice'|'declinePrice'|'suggestPrice';price:number};
export interface CurationState {eventId:string;mode:'item'|'and'|'or';requirements:string[];skipHaggle:boolean;stage:'select'|'price'|'counter'|'settled';selectedItemId:string|null;declines:number;counter:number|null;pending:CurationAction[];history:CurationAction[];waitingLine?:boolean;lastLineId?:string;}
export interface CurationItem {definitionId:string;cardIds:readonly string[];appraisalIds:readonly string[];saleValue:number;}
export function createCuration(eventId:string,mode:CurationState['mode'],requirements:string[],skipHaggle=false):CurationState{return {eventId,mode,requirements:[...requirements],skipHaggle,stage:'select',selectedItemId:null,declines:0,counter:null,pending:[],history:[]};}
const special1=['artCuration','thrillCuration','politicsCuration','historyCuration','archaeCuration'];
const special2=['giftForDadCuration','giftForMomCuration','giftForAnnivCuration','giftForYoungCuration','giftForMoneyCuration'];
const clubRatios:Record<string,[number,number,number]>={graphologyCuration:[1,1.3,1.5],historyCuration2:[1.1,1.4,1.6],artCuration2:[1.2,1.5,1.7],archaeCuration2:[1.3,1.6,2]};
const say=(id:string):CurationAction=>({type:'say',id}),chunk=(id:string):CurationAction=>({type:'chunk',id});
export function curateNativeItem(c:CurationState,item:CurationItem):CurationAction[]{
 const ids=item.cardIds,id=c.eventId,out:CurationAction[]=[];const accept=(message?:CurationAction)=>[...(message?[message]:[]),{type:'acceptItem'} as CurationAction];const decline=(message:CurationAction,check=true,limit=2,silentLeave=false)=>{out.push(message,{type:'declineItem'});if(check&&c.declines>=limit){if(!silentLeave)out.push(say('CurationInputFailed'));out.push({type:'leave'});}return out;};
 if(id==='D18_jane'){if(ids.some(x=>getNativeCard(x)?.category==='jewel'||['gray_bracelet','gray_necklace','gray_ankle','gray_ring','gray_earrings'].includes(x)))return decline(chunk('noJewel'),true,4,true);if(ids.includes('blue_fairlydmg')||ids.includes('blue_novalue'))return decline(chunk('betterCondition'),false);if(ids.includes('blue_junkpotential'))return decline(chunk('potentialJunk'),true,4,true);if(item.saleValue>800)return decline(chunk('expensive'),true,4,true);if(item.saleValue<400)return decline(chunk('cheap'),true,4,true);return accept();}
 if(['D14_preAvarice201','D17_preAvarice202'].includes(id))return item.saleValue<1500?decline(chunk('under'),false):accept(chunk('success'));
 if(id==='D06_avac_quest')return item.definitionId==='diaryWithPassport_01'?[chunk('passport')]:decline(say('CurationInputReject'));
 if(id==='halfBrandCuration1'){const brand=item.appraisalIds.map(x=>getNativeCard(x)).find(x=>x?.category==='brand');return brand?.tier===3?accept(chunk('halfBrand')):decline(chunk(!brand?'noBrand':brand.tier===2||brand.tier>3?'fake':'brand'));}
 if(clubRatios[id]){if(c.mode!=='or')throw Error('Source club curation requires OR cards');const actual=c.requirements.some(x=>ids.includes(x)),appraised=c.requirements.some(x=>item.appraisalIds.includes(x));if(actual)return accept(item.definitionId.endsWith('_d')?chunk('e'):say(appraised?'CurationInputAccept':id+'Success'));return decline(say(appraised?id:'CurationInputReject'));}
 const matches=c.mode==='item'?c.requirements.includes(item.definitionId):c.mode==='and'?c.requirements.every(x=>ids.includes(x)):c.requirements.some(x=>ids.includes(x));
 if(c.mode==='item')return matches?accept(say('CurationInputAccept')):decline(say('CurationInputReject'));
 if(matches){if(ids.includes('blue_totallyWrecked'))return decline(say('CurationRejectTotallyWrecked'));if(isNativeFake(ids))return decline(say('CurationRejectFake'),false);return accept(say('CurationInputAccept'));}
 return decline(say(c.mode==='or'&&ids.includes('blue_totallyWrecked')?'CurationRejectTotallyWrecked':'CurationInputReject'));
}
export function priceNativeCuration(c:CurationState,item:CurationItem,price:number):CurationAction[]{
 const id=c.eventId,value=item.saleValue,accept=(a:CurationAction):CurationAction[]=>[a,{type:'acceptPrice',price}],counter=(amount:number,a:CurationAction):CurationAction[]=>[{type:'suggestPrice',price:amount},a];
 if(id==='D08_choi')return price>68?counter(68,chunk('a')):accept(say('CurationHaggleCustomerAccept'));
 if(['D14_preAvarice201','D17_preAvarice202'].includes(id))return price>value*2?counter(value*1.5,chunk('onHigh')):accept(say('CurationHaggleCustomerAccept'));
 if(special1.includes(id)||special2.includes(id)){const ratios=special1.includes(id)?[1.3,2,3]:[1.1,1.5,2];for(let i=0;i<ratios.length;i++)if(price<=value*ratios[i])return accept(chunk('abc'[i]));return counter(value*2,chunk('d'));}
 if(clubRatios[id]){const [a,b,d]=clubRatios[id],repaired=item.cardIds.includes('blue_repaired'),v=value*(repaired?.8:1),duplicate=item.definitionId.endsWith('_d');for(const [ratio,letter] of [[a,'a'],[b,'b'],[d,'c']] as const)if(price<=v*ratio)return accept(chunk(duplicate?letter+letter:letter));return counter(v*(b+d)/2,chunk(duplicate?'dd':repaired?'r':'d'));}
 if(price>value*1.9)return [say('CurationHaggleCustomerGiveUp'),{type:'declinePrice',price}];if(price>value*1.4)return counter(value*1.2,say('CurationHaggleCustomerOffer'));return accept(say('CurationHaggleCustomerAccept'));
}
export function curationSuccessContexts(c:CurationState,definitionId:string):Contexts{return c.eventId==='D14_preAvarice201'?{ItemForFixieWannabe1:definitionId}:c.eventId==='D17_preAvarice202'?{ItemForFixieWannabe2:definitionId}:{};}
/** UI fallback only; source line-pool IDs remain available as lastLineId. */
export function curationLine(id:string){return ({CurationInputAccept:'This is the item I need.',CurationInputReject:'That is not what I am looking for.',CurationInputFailed:'I have to go.',CurationRejectTotallyWrecked:'This is completely broken.',CurationRejectFake:'I am not buying a counterfeit.',CurationHaggleCustomerGiveUp:'That price is too high.',CurationHaggleCustomerOffer:'Would you accept my offer?',CurationHaggleCustomerAccept:'Agreed.'} as Record<string,string>)[id]??'Let us discuss this item.';}
