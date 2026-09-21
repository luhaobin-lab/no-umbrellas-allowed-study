/** Compact runtime contracts for the supplied Windows 1.0.5 Demo. */
export type NativeColor = 0|1|2|3|4|5;
export interface NativeCard {
  id:string; name:string; category:string; tier:number; color:NativeColor;
  multiplier:number; addend:number; shortEffect:string; collectible:boolean;
  sourceId?:string; effectText?:string;
}
export interface NativeSprite {asset:string;sourceId:string;name:string;width:number;height:number;border?:[number,number,number,number];pivot?:[number,number];pixelsPerUnit?:number}
export interface NativeItemDefinition {
  id:string;name:string;content:string;year:number;integrity:number;cardIds:string[];referenceCardIds:string[];
  materialTint:{r:number;g:number;b:number;a:number};hasSignature:boolean;
  signature?:NativeSprite;openSprite?:NativeSprite;sprite?:NativeSprite;zoomSprite?:NativeSprite;hoverSprite?:NativeSprite;
  deprecated:boolean;randomEligible:boolean;randomLine:string;companionComment:string;
  hasTier2JewelryInfo:boolean;generateRandomTier2JewelryInfo:boolean;jewelryCarat:number;jewelryCut:string;
  difficulty:number;sourceId:string;
}
export interface NativeItemInstance {
  instanceId:string;definitionId:string;cardIds:string[];referenceCardIds:string[];integrity:number;
  jewel?:{kind:string;carat:number;cut:string;cardId:string};rngState:number;
}
export interface NativeItemCreationOptions {
  instanceId?:string;seed?:number;integrity?:number;cardIds?:readonly string[];
  /** Use serialized jewel values for source-oracle reproduction; live creation defaults to true. */
  randomizeJewelry?:boolean;
}
export type NativeItemQuery=string|NativeItemInstance|NativeItemDefinition;
export interface NativeRectTransform {anchorMin:[number,number];anchorMax:[number,number];pivot:[number,number];sizeDelta:[number,number];anchoredPosition:[number,number];scale:[number,number];rotation:number}
export interface NativeLayoutGroup {type:'horizontal'|'vertical'|'grid';padding:[number,number,number,number];alignment:number;spacing:number|[number,number];controlWidth?:boolean;controlHeight?:boolean;expandWidth?:boolean;expandHeight?:boolean;scaleWidth?:boolean;scaleHeight?:boolean;reverse?:boolean;cellSize?:[number,number];constraint?:number;constraintCount?:number;startCorner?:number;startAxis?:number}
export interface NativeManualText {text:string;font:string;sourceFont:string;fontSize:number;faceScale:number;color:string;alignment:number;horizontalAlignment:number;verticalAlignment:number;style:number;wordWrap:boolean;overflow:number;lineSpacing:number;characterSpacing:number;wordSpacing:number;margins:[number,number,number,number];autoSize?:{min:number;max:number};localizedFont:boolean;links:{cardId:string;text:string}[]}
export interface NativeManualNode {
  id:string;name:string;active:boolean;rect:NativeRectTransform;children:NativeManualNode[];
  image?:{sprite?:NativeSprite;color:string;type:number;preserveAspect:boolean;fillCenter:boolean;pixelsPerUnitMultiplier?:number};
  text?:NativeManualText;layout?:NativeLayoutGroup;fitter?:{horizontal:number;vertical:number};
  layoutElement?:{ignore:boolean;minWidth:number;minHeight:number;preferredWidth:number;preferredHeight:number;flexibleWidth:number;flexibleHeight:number};
  canvas?:{enabled:boolean;sortingOrder:number};cardId?:string;dragTextLinks?:boolean;linkColors?:string[];mask?:boolean;scroll?:{horizontal:boolean;vertical:boolean;contentId?:string;viewportId?:string;horizontalScrollbarId?:string;verticalScrollbarId?:string;horizontalVisibility?:number;verticalVisibility?:number;scrollSensitivity?:number};
  conditions?:{kind:string;predicate:string;useComplex?:boolean;complex?:Record<string,string>;targets?:{id:string;nodeId:string|null;invert:boolean;type:string;targetClass?:string}[]}[];
  actions?:{event:string;target:string;targetName?:string;targetClass?:string;targetNodeId?:string|null;eventType?:number|null;method:string;stringValue?:string;intValue?:number;boolValue?:boolean}[];
  context?:{key:string;value:string}[];
}
export interface NativeManualPage {id:string;title:string;unlockCondition:string;sourceId:string;root:NativeManualNode}
export interface NativeFontAtlas {id:string;name:string;family:string;atlasSources:string[];atlasAssets:string[];alphaAtlasAssets:string[];face:Record<string,number|string>;characters:{unicode:number;glyphIndex:number;scale:number}[];glyphs:{index:number;rect:[number,number,number,number];metrics:[number,number,number,number,number];scale:number;atlasIndex:number}[];kerning:unknown[];atlasPadding:number;atlasRenderMode:number;atlasWidth:number;atlasHeight:number;normalStyle?:number;boldStyle?:number;boldSpacing?:number;italicStyle?:number;materialId?:string;material?:unknown;alphaConversion:{channel:string;threshold:number}}
