/** Video-observed data. Null means not observable; sample ranges are not frame-precise. */
export type PixelBox = { x: number; y: number; width: number; height: number };
export type RecordedTag = {
  id: string; text: string; rawText: string; value: number | null;
  operation: 'base' | 'add' | 'percent' | 'multiply' | 'none';
  group: string; asset: string; bbox: PixelBox; timestamp: number;
};
export type RecordedDialogue = { timestamp: number; speaker: 'npc' | 'player' | 'assistant' | 'unknown'; text: string; partial: boolean; asset: string | null; bbox: PixelBox | null };
export type RecordedTransaction = {
 id: string; day: number | null; start: number; end: number; duration: number;
 saleType: 'buy' | 'sell' | 'gift' | 'story' | 'unknown';
 attractiveness?: number | null; expertness?: number | null;
 npc: { name: string | null; appearance: string; asset: string | null; bbox: PixelBox | null; assetKind: 'scene-patch' | 'transparent' | null };
 item: { name: string; baseValue: number | null; asset: string | null; bbox: PixelBox | null; assetKind: 'scene-patch' | 'transparent' | null; titleAsset: string | null } | null;
 initialTags: string[]; discoveredTags: string[];
 states: { timestamp: number; tags: string[]; appraisedValue: number | null; cash: number | null; ledgerAsset: string | null }[];
 quotes: { timestamp: number; speaker: 'npc' | 'player' | 'unknown'; amount: number; accepted: boolean | null }[];
 dialogues: RecordedDialogue[];
 result: 'bought' | 'sold' | 'declined' | 'gifted' | 'story' | 'unknown';
 cashDelta: number | null; finalPrice: number | null; notes: string[];
};
export type RecordedStock = { id: string; name: string; askPrice: number | null; appraisedValue: number | null; boughtAt: number | null; timestamp: number; asset: string | null; bbox: PixelBox | null };
export const RECORDED_TAGS: RecordedTag[] = [
  {
    "id": "backpack",
    "text": "Backpack",
    "rawText": "Backpack",
    "value": 70,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/backpack.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 50
  },
  {
    "id": "brand-easy-enough",
    "text": "Brand <Easy Enough>",
    "rawText": "Brand <Easy Enough>",
    "value": 80,
    "operation": "add",
    "group": "material-brand",
    "asset": "/assets/reference-tags/brand-easy-enough.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 50
  },
  {
    "id": "slightly-damaged",
    "text": "Slightly Damaged",
    "rawText": "Slightly Damaged",
    "value": -20,
    "operation": "percent",
    "group": "condition",
    "asset": "/assets/reference-tags/slightly-damaged.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 50
  },
  {
    "id": "canvas",
    "text": "Canvas",
    "rawText": "Canvas",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/canvas.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 250
  },
  {
    "id": "wrong-material",
    "text": "Wrong Material",
    "rawText": "Wrong Material",
    "value": null,
    "operation": "none",
    "group": "question",
    "asset": "/assets/reference-tags/wrong-material.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 250
  },
  {
    "id": "attractiveness-minus-1",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −1%",
    "value": -1,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-1.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 50
  },
  {
    "id": "shoes",
    "text": "Shoes",
    "rawText": "Shoes",
    "value": 89,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/shoes.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 370
  },
  {
    "id": "ee-military-pvc",
    "text": "EE Military Grade PVC",
    "rawText": "EE Military Grade PVC",
    "value": 100,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/ee-military-pvc.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 370
  },
  {
    "id": "perfect",
    "text": "In Perfect Condition",
    "rawText": "In Perfect Condition",
    "value": 10,
    "operation": "percent",
    "group": "condition",
    "asset": "/assets/reference-tags/perfect.png",
    "bbox": {
      "x": 103,
      "y": 555,
      "width": 276,
      "height": 44
    },
    "timestamp": 370
  },
  {
    "id": "ee-pvc-premium",
    "text": "EE PVC Premium",
    "rawText": "EE PVC Premium",
    "value": 20,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/ee-pvc-premium.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 450
  },
  {
    "id": "shoulder-bag",
    "text": "Shoulder Bag",
    "rawText": "Shoulder Bag",
    "value": 300,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/shoulder-bag.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 770
  },
  {
    "id": "brand-fimm-fimm",
    "text": "Brand <Fxxx Fxxx>",
    "rawText": "Brand <Fxxx Fxxx>",
    "value": -40,
    "operation": "add",
    "group": "material-brand",
    "asset": "/assets/reference-tags/brand-fimm-fimm.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 770
  },
  {
    "id": "ff-pvc",
    "text": "FF PVC",
    "rawText": "FF PVC",
    "value": -5,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/ff-pvc.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 770
  },
  {
    "id": "ff-fabric",
    "text": "FF Fabric",
    "rawText": "FF Fabric",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/ff-fabric.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 850
  },
  {
    "id": "artist-signature",
    "text": "Signature of an Artist",
    "rawText": "Signature of an Artist",
    "value": 2,
    "operation": "multiply",
    "group": "signature",
    "asset": "/assets/reference-tags/artist-signature.png",
    "bbox": {
      "x": 103,
      "y": 603,
      "width": 276,
      "height": 44
    },
    "timestamp": 930
  },
  {
    "id": "poster",
    "text": "Poster",
    "rawText": "Poster",
    "value": 56,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/poster.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1050
  },
  {
    "id": "paper",
    "text": "Paper",
    "rawText": "Paper",
    "value": 5,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/paper.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1050
  },
  {
    "id": "national-historic",
    "text": "National Historical Value",
    "rawText": "National Historical Value",
    "value": 2,
    "operation": "multiply",
    "group": "history",
    "asset": "/assets/reference-tags/national-historic.png",
    "bbox": {
      "x": 103,
      "y": 555,
      "width": 276,
      "height": 44
    },
    "timestamp": 1090
  },
  {
    "id": "potted-plant",
    "text": "Potted Plant",
    "rawText": "Potted Plant",
    "value": 65,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/potted-plant.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1270
  },
  {
    "id": "clay",
    "text": "Clay",
    "rawText": "Clay",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/clay.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1270
  },
  {
    "id": "unidentified-signature",
    "text": "Signature Unidentified",
    "rawText": "Signature Unidentified",
    "value": -20,
    "operation": "percent",
    "group": "signature",
    "asset": "/assets/reference-tags/unidentified-signature.png",
    "bbox": {
      "x": 103,
      "y": 555,
      "width": 276,
      "height": 44
    },
    "timestamp": 1310
  },
  {
    "id": "tiny-trash",
    "text": "Tiny Pretty Trash",
    "rawText": "Tiny Pretty Trash",
    "value": 48,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/tiny-trash.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1390
  },
  {
    "id": "platinum",
    "text": "Platinum",
    "rawText": "Platinum",
    "value": 200,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/platinum.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1390
  },
  {
    "id": "gold-24k",
    "text": "24K Gold",
    "rawText": "24K Gold",
    "value": 500,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/gold-24k.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1430
  },
  {
    "id": "eyewear",
    "text": "Eyewear",
    "rawText": "Eyewear",
    "value": 210,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/eyewear.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1550
  },
  {
    "id": "fairly-damaged",
    "text": "Fairly Damaged",
    "rawText": "Fairly Damaged",
    "value": -60,
    "operation": "percent",
    "group": "condition",
    "asset": "/assets/reference-tags/fairly-damaged.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 1550
  },
  {
    "id": "artwork-2d",
    "text": "2D Artwork",
    "rawText": "2D Artwork",
    "value": 300,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/artwork-2d.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1690
  },
  {
    "id": "great-piece",
    "text": "Great Piece",
    "rawText": "Great Piece",
    "value": 150,
    "operation": "add",
    "group": "artwork",
    "asset": "/assets/reference-tags/great-piece.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1710
  },
  {
    "id": "fine-piece",
    "text": "Fine Piece",
    "rawText": "Fine Piece",
    "value": 50,
    "operation": "add",
    "group": "artwork",
    "asset": "/assets/reference-tags/fine-piece.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1770
  },
  {
    "id": "archaeological",
    "text": "Archaeological Value",
    "rawText": "Archaeological Value",
    "value": 3,
    "operation": "multiply",
    "group": "history",
    "asset": "/assets/reference-tags/archaeological.png",
    "bbox": {
      "x": 103,
      "y": 603,
      "width": 276,
      "height": 44
    },
    "timestamp": 1770
  },
  {
    "id": "id-card",
    "text": "ID Card",
    "rawText": "ID Card",
    "value": 80,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/id-card.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1830
  },
  {
    "id": "plastic",
    "text": "Plastic",
    "rawText": "Plastic",
    "value": 5,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/plastic.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1830
  },
  {
    "id": "doll",
    "text": "Doll",
    "rawText": "Doll",
    "value": 52,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/doll.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 1930
  },
  {
    "id": "velvet",
    "text": "Velvet",
    "rawText": "Velvet",
    "value": 65,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/velvet.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1930
  },
  {
    "id": "popular",
    "text": "Popular Item",
    "rawText": "Popular Item",
    "value": 20,
    "operation": "percent",
    "group": "popularity",
    "asset": "/assets/reference-tags/popular.png",
    "bbox": {
      "x": 103,
      "y": 603,
      "width": 276,
      "height": 44
    },
    "timestamp": 1930
  },
  {
    "id": "cotton",
    "text": "Cotton",
    "rawText": "Cotton",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/cotton.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 1990
  },
  {
    "id": "popular-youth",
    "text": "Popular Item among Youth",
    "rawText": "Popular Item among Youth",
    "value": 10,
    "operation": "percent",
    "group": "popularity",
    "asset": "/assets/reference-tags/popular-youth.png",
    "bbox": {
      "x": 103,
      "y": 603,
      "width": 276,
      "height": 44
    },
    "timestamp": 2010
  },
  {
    "id": "artwork-3d",
    "text": "3D Artwork",
    "rawText": "3D Artwork",
    "value": 310,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/artwork-3d.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 2050
  },
  {
    "id": "wooden",
    "text": "Wooden",
    "rawText": "Wooden",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/wooden.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 2050
  },
  {
    "id": "deceased-artist",
    "text": "Work by a deceased artist",
    "rawText": "Work by a deceased artist",
    "value": 1500,
    "operation": "add",
    "group": "artwork",
    "asset": "/assets/reference-tags/deceased-artist.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 2170
  },
  {
    "id": "poor-piece",
    "text": "Poor Piece",
    "rawText": "Poor Piece",
    "value": -200,
    "operation": "add",
    "group": "artwork",
    "asset": "/assets/reference-tags/poor-piece.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 2350
  },
  {
    "id": "hoverboard",
    "text": "Hoverboard",
    "rawText": "Hoverboard",
    "value": 200,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/hoverboard.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 2410
  },
  {
    "id": "brand-vertivo",
    "text": "Brand <Vertivo>",
    "rawText": "Brand <Vertivo>",
    "value": 500,
    "operation": "add",
    "group": "material-brand",
    "asset": "/assets/reference-tags/brand-vertivo.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 2410
  },
  {
    "id": "vtv-steel",
    "text": "VTV Steel",
    "rawText": "VTV Steel",
    "value": 0,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/vtv-steel.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 2410
  },
  {
    "id": "device",
    "text": "Device",
    "rawText": "Device",
    "value": 400,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/device.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 2690
  },
  {
    "id": "postage-stamp",
    "text": "Postage Stamp",
    "rawText": "Postage Stamp",
    "value": 73,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/postage-stamp.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 2810
  },
  {
    "id": "piece-paper",
    "text": "Piece of Paper",
    "rawText": "Piece of Paper",
    "value": 23,
    "operation": "base",
    "group": "type",
    "asset": "/assets/reference-tags/piece-paper.png",
    "bbox": {
      "x": 103,
      "y": 411,
      "width": 276,
      "height": 44
    },
    "timestamp": 3230
  },
  {
    "id": "politician-signature",
    "text": "Signature of a Politician",
    "rawText": "Signature of a Politician",
    "value": -30,
    "operation": "percent",
    "group": "signature",
    "asset": "/assets/reference-tags/politician-signature.png",
    "bbox": {
      "x": 103,
      "y": 555,
      "width": 276,
      "height": 44
    },
    "timestamp": 3350
  },
  {
    "id": "brand-fuzzfly",
    "text": "Brand <FuzzFly>",
    "rawText": "Brand <FuzzFly>",
    "value": -120,
    "operation": "add",
    "group": "material-brand",
    "asset": "/assets/reference-tags/brand-fuzzfly.png",
    "bbox": {
      "x": 103,
      "y": 459,
      "width": 276,
      "height": 44
    },
    "timestamp": 3410
  },
  {
    "id": "carbon-fiber",
    "text": "Carbon Fiber",
    "rawText": "Carbon Fiber",
    "value": 20,
    "operation": "add",
    "group": "material",
    "asset": "/assets/reference-tags/carbon-fiber.png",
    "bbox": {
      "x": 103,
      "y": 507,
      "width": 276,
      "height": 44
    },
    "timestamp": 3410
  },
  {
    "id": "unpopular",
    "text": "Unpopular Item",
    "rawText": "Unpopular Item",
    "value": -30,
    "operation": "percent",
    "group": "popularity",
    "asset": "/assets/reference-tags/unpopular.png",
    "bbox": {
      "x": 103,
      "y": 603,
      "width": 276,
      "height": 44
    },
    "timestamp": 3450
  },
  {
    "id": "attractiveness-minus-2",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −2%",
    "value": -2,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-2.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 370
  },
  {
    "id": "attractiveness-minus-3",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −3%",
    "value": -3,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-3.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 1050
  },
  {
    "id": "attractiveness-minus-4",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −4%",
    "value": -4,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-4.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 1930
  },
  {
    "id": "attractiveness-minus-5",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −5%",
    "value": -5,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-5.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 2270
  },
  {
    "id": "attractiveness-minus-6",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −6%",
    "value": -6,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-6.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 2690
  },
  {
    "id": "attractiveness-minus-7",
    "text": "Attractiveness of Darcy's",
    "rawText": "Attractiveness of Darcy's −7%",
    "value": -7,
    "operation": "percent",
    "group": "shop",
    "asset": "/assets/reference-tags/attractiveness-minus-7.png",
    "bbox": {
      "x": 103,
      "y": 714,
      "width": 276,
      "height": 48
    },
    "timestamp": 3230
  }
];
export const RECORDED_TRANSACTIONS: RecordedTransaction[] = [
  {
    "id": "day6-backpack-soldier",
    "day": 6,
    "start": 38,
    "end": 282,
    "duration": 244,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "短红发、蓝色上衣、粉紫嘴唇的顾客",
      "asset": "/assets/reference-visitors/visitor-50.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Backpack of Soldier",
      "baseValue": 70,
      "asset": "/assets/reference-items/item-50.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-50.png"
    },
    "initialTags": [
      "backpack",
      "brand-easy-enough",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "canvas",
      "wrong-material"
    ],
    "states": [
      {
        "timestamp": 50,
        "tags": [
          "backpack",
          "brand-easy-enough",
          "slightly-damaged"
        ],
        "appraisedValue": 118,
        "cash": 258,
        "ledgerAsset": "/assets/reference-tags/ledger-50.png"
      },
      {
        "timestamp": 210,
        "tags": [
          "backpack",
          "brand-easy-enough",
          "canvas",
          "slightly-damaged"
        ],
        "appraisedValue": 118,
        "cash": 258,
        "ledgerAsset": "/assets/reference-tags/ledger-210.png"
      },
      {
        "timestamp": 250,
        "tags": [
          "backpack",
          "wrong-material",
          "canvas",
          "slightly-damaged"
        ],
        "appraisedValue": 55,
        "cash": 258,
        "ledgerAsset": "/assets/reference-tags/ledger-250.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 265,
        "speaker": "player",
        "amount": 45,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 210,
        "speaker": "npc",
        "text": "Erm, that's weird... but, okay.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-210-0.png",
        "bbox": {
          "x": 794,
          "y": 201,
          "width": 335,
          "height": 107
        }
      },
      {
        "timestamp": 273,
        "speaker": "npc",
        "text": "Phew. So it turned out I got scared for nothing!",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-273.0.png",
        "bbox": {
          "x": 711,
          "y": 173,
          "width": 500,
          "height": 135
        }
      },
      {
        "timestamp": 277,
        "speaker": "npc",
        "text": "What else is there to say! Deal!",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-277.0.png",
        "bbox": {
          "x": 780,
          "y": 197,
          "width": 363,
          "height": 110
        }
      }
    ],
    "result": "bought",
    "cashDelta": -45,
    "finalPrice": 45,
    "notes": [
      "录像从此笔鉴定中途载入；此前来访和初始问候不可见。",
      "店铺吸引力 −1% 单独乘算；(70+80)×0.8×0.99=118.8，显示118。",
      "修正材料后错误品牌变成 Wrong Material，估值55。",
      "人物和物品资产为原位场景patch，不是独立透明sprite。",
      "年代工具原帧读数2068；初始video在DAY6中途载入。"
    ],
    "attractiveness": -1,
    "expertness": null
  },
  {
    "id": "day6-strong-leg",
    "day": 6,
    "start": 330,
    "end": 350,
    "duration": 20,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "短棕发、蓝色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-335.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Strong Leg for Chippies",
      "baseValue": null,
      "asset": "/assets/reference-items/item-335.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-335.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 345,
        "speaker": "unknown",
        "amount": 295,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 335,
        "speaker": "npc",
        "text": "The Strong Leg for Chippies on the showcase, how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-335-3.png",
        "bbox": {
          "x": 711,
          "y": 179,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "sold",
    "cashDelta": 295,
    "finalPrice": 295,
    "notes": [
      "货架标价295；成交后余额213→508。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day6-combat-boots",
    "day": 6,
    "start": 350,
    "end": 495,
    "duration": 145,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕色偏分头发、蓝色圆领上衣的年轻顾客",
      "asset": "/assets/reference-visitors/visitor-370.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Triumphant Combat Boots",
      "baseValue": 89,
      "asset": "/assets/reference-items/item-370.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-370.png"
    },
    "initialTags": [
      "shoes",
      "brand-easy-enough",
      "ee-military-pvc",
      "perfect"
    ],
    "discoveredTags": [
      "ee-pvc-premium"
    ],
    "states": [
      {
        "timestamp": 370,
        "tags": [
          "shoes",
          "brand-easy-enough",
          "ee-military-pvc",
          "perfect"
        ],
        "appraisedValue": 289,
        "cash": 508,
        "ledgerAsset": "/assets/reference-tags/ledger-370.png"
      },
      {
        "timestamp": 450,
        "tags": [
          "shoes",
          "brand-easy-enough",
          "ee-pvc-premium",
          "perfect"
        ],
        "appraisedValue": 203,
        "cash": 508,
        "ledgerAsset": "/assets/reference-tags/ledger-450.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 490,
        "speaker": "unknown",
        "amount": 150,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 358,
        "speaker": "npc",
        "text": "Er, my ears are still ringing. I had to pass by the demonstration to come here.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-358.0.png",
        "bbox": {
          "x": 710,
          "y": 161,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 430,
        "speaker": "npc",
        "text": "Guess you're very careful while appraising.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-430-5.png",
        "bbox": {
          "x": 718,
          "y": 191,
          "width": 484,
          "height": 103
        }
      },
      {
        "timestamp": 450,
        "speaker": "npc",
        "text": "Oh, I got it wrong then.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-450-6.png",
        "bbox": {
          "x": 822,
          "y": 191,
          "width": 276,
          "height": 103
        }
      },
      {
        "timestamp": 480,
        "speaker": "npc",
        "text": "Well, it's taking longer than I expected. There must be something about it.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-480-7.png",
        "bbox": {
          "x": 710,
          "y": 161,
          "width": 500,
          "height": 136
        }
      }
    ],
    "result": "bought",
    "cashDelta": -150,
    "finalPrice": 150,
    "notes": [
      "年份检测读数2070（见470秒）。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -2,
    "expertness": null
  },
  {
    "id": "day6-early-poster",
    "day": 6,
    "start": 500,
    "end": 525,
    "duration": 25,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色盘发、无袖紫灰上衣顾客",
      "asset": "/assets/reference-visitors/visitor-510.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Early Poster of AVAC",
      "baseValue": null,
      "asset": "/assets/reference-items/item-510.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-510.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 520,
        "speaker": "unknown",
        "amount": 70,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 510,
        "speaker": "npc",
        "text": "The Early Poster of AVAC on the showcase, how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-510-8.png",
        "bbox": {
          "x": 711,
          "y": 179,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 520,
        "speaker": "npc",
        "text": "It's more expensive than new ones. But, I'll take it, I've been looking for this.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-520-9.png",
        "bbox": {
          "x": 711,
          "y": 185,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "sold",
    "cashDelta": 70,
    "finalPrice": 70,
    "notes": [
      "货架70；余额358→428。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day6-darcy-task",
    "day": 6,
    "start": 525,
    "end": 570,
    "duration": 45,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "秃头、浓密胡须、棕色敞怀外套的年长顾客",
      "asset": "/assets/reference-visitors/visitor-530.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 530,
        "speaker": "npc",
        "text": "You did great job with the fake ID.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-530-10.png",
        "bbox": {
          "x": 766,
          "y": 223,
          "width": 394,
          "height": 107
        }
      },
      {
        "timestamp": 541,
        "speaker": "npc",
        "text": "And here's another task waiting for you.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-541.0.png",
        "bbox": {
          "x": 739,
          "y": 224,
          "width": 448,
          "height": 109
        }
      },
      {
        "timestamp": 550,
        "speaker": "npc",
        "text": "The Stabilizer's not there in the evening. so make sure to visit him in the morning.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-550-12.png",
        "bbox": {
          "x": 713,
          "y": 194,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "肯定fake ID任务；要求早晨去Stabilizer办公室。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day7-fixie-bag",
    "day": 7,
    "start": 760,
    "end": 963,
    "duration": 203,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕色偏分短发、灰色长袖、脸颊圆的顾客",
      "asset": "/assets/reference-visitors/visitor-770.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Fixie-made Bag",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-770.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-770.png"
    },
    "initialTags": [
      "shoulder-bag",
      "brand-fimm-fimm",
      "ff-pvc",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "perfect",
      "ff-fabric",
      "artist-signature"
    ],
    "states": [
      {
        "timestamp": 770,
        "tags": [
          "shoulder-bag",
          "brand-fimm-fimm",
          "ff-pvc",
          "slightly-damaged"
        ],
        "appraisedValue": 199,
        "cash": 398,
        "ledgerAsset": "/assets/reference-tags/ledger-770.png"
      },
      {
        "timestamp": 810,
        "tags": [
          "shoulder-bag",
          "brand-fimm-fimm",
          "ff-pvc",
          "perfect"
        ],
        "appraisedValue": 274,
        "cash": 398,
        "ledgerAsset": "/assets/reference-tags/ledger-810.png"
      },
      {
        "timestamp": 850,
        "tags": [
          "shoulder-bag",
          "brand-fimm-fimm",
          "ff-fabric",
          "perfect"
        ],
        "appraisedValue": 280,
        "cash": 398,
        "ledgerAsset": "/assets/reference-tags/ledger-850.png"
      },
      {
        "timestamp": 930,
        "tags": [
          "shoulder-bag",
          "brand-fimm-fimm",
          "ff-fabric",
          "perfect",
          "artist-signature"
        ],
        "appraisedValue": 560,
        "cash": 398,
        "ledgerAsset": "/assets/reference-tags/ledger-930.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 958,
        "speaker": "unknown",
        "amount": 360,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 873,
        "speaker": "npc",
        "text": "Did you check who the owner of the autograph written on it is?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-873.0.png",
        "bbox": {
          "x": 711,
          "y": 212,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 950,
        "speaker": "npc",
        "text": "It seems you're busy cheoking carefully. I'll be waiting, don't worry.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-950-14.png",
        "bbox": {
          "x": 711,
          "y": 188,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "bought",
    "cashDelta": -360,
    "finalPrice": 360,
    "notes": [
      "签名对应LEE,Eunjeong，书页2040。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。",
      "物品年代读数2080，与名录中的艺术家签名年份2040为不同数据。"
    ],
    "attractiveness": -2,
    "expertness": null
  },
  {
    "id": "day7-research-poster",
    "day": 7,
    "start": 1020,
    "end": 1230,
    "duration": 210,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕发往后梳、紫色翻领衬衫、笑脸细眼顾客",
      "asset": "/assets/reference-visitors/visitor-1050.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Poster from Citizens Alliance Research Institute",
      "baseValue": 56,
      "asset": "/assets/reference-items/item-1050.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1050.png"
    },
    "initialTags": [
      "poster",
      "paper",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "national-historic"
    ],
    "states": [
      {
        "timestamp": 1050,
        "tags": [
          "poster",
          "paper",
          "slightly-damaged"
        ],
        "appraisedValue": 47,
        "cash": 38,
        "ledgerAsset": "/assets/reference-tags/ledger-1050.png"
      },
      {
        "timestamp": 1090,
        "tags": [
          "poster",
          "paper",
          "slightly-damaged",
          "national-historic"
        ],
        "appraisedValue": 94,
        "cash": 38,
        "ledgerAsset": "/assets/reference-tags/ledger-1090.png"
      }
    ],
    "quotes": [],
    "dialogues": [],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "年份2077；作者/署名检索MOO,Manjo（2046），公开保留National Historical Value。",
      "播放器可见报价框38，但需精查拒绝原因；现金不足不是已证实的NPC机制。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -3,
    "expertness": null
  },
  {
    "id": "day7-backpack-resale",
    "day": 7,
    "start": 1230,
    "end": 1250,
    "duration": 20,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "顾客在20秒主采样中未完整停留",
      "asset": "/assets/reference-visitors/visitor-1250.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Backpack of Soldier",
      "baseValue": 70,
      "asset": "/assets/reference-items/item-1250.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1250.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1245,
        "speaker": "unknown",
        "amount": 75,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1245,
        "speaker": "npc",
        "text": "It's more empensive than new ones. But. I'lI take it. I've beenlooking for this.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1245-15.png",
        "bbox": {
          "x": 711,
          "y": 200,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "sold",
    "cashDelta": 75,
    "finalPrice": 75,
    "notes": [
      "现金38→113，初次买入45，陈列标价75。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 4
  },
  {
    "id": "day7-crabgrass",
    "day": 7,
    "start": 1260,
    "end": 1325,
    "duration": 65,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "戴眼镜、秃顶灰发、淡绿外套领带的年长顾客",
      "asset": "/assets/reference-visitors/visitor-1270.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "The World's Best Crabgrass",
      "baseValue": 65,
      "asset": "/assets/reference-items/item-1270.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1270.png"
    },
    "initialTags": [
      "potted-plant",
      "clay",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "unidentified-signature"
    ],
    "states": [
      {
        "timestamp": 1270,
        "tags": [
          "potted-plant",
          "clay",
          "slightly-damaged"
        ],
        "appraisedValue": 50,
        "cash": 113,
        "ledgerAsset": "/assets/reference-tags/ledger-1270.png"
      },
      {
        "timestamp": 1310,
        "tags": [
          "potted-plant",
          "clay",
          "slightly-damaged",
          "unidentified-signature"
        ],
        "appraisedValue": 40,
        "cash": 113,
        "ledgerAsset": "/assets/reference-tags/ledger-1310.png"
      }
    ],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 1311.5,
        "speaker": "npc",
        "text": "But that's too little... Are you meaning to say you don't want this, Bob?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1311.5.png",
        "bbox": {
          "x": 713,
          "y": 176,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "末段报价35可见；对方反应“太少”，余额未变。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -2,
    "expertness": null
  },
  {
    "id": "day7-flawless-bag-resale",
    "day": 7,
    "start": 1330,
    "end": 1365,
    "duration": 35,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕红短发、灰色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-1350.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Flawless Shoulder Bag",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-1350.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1350.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1360,
        "speaker": "unknown",
        "amount": 412,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "sold",
    "cashDelta": 412,
    "finalPrice": 412,
    "notes": [
      "右侧估值卡400；现金113→525。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day7-bookmark",
    "day": 7,
    "start": 1365,
    "end": 1465,
    "duration": 100,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "戴红色针织帽、短胡子、橄榄色上衣的顾客",
      "asset": "/assets/reference-visitors/visitor-1390.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Bookmark",
      "baseValue": 48,
      "asset": "/assets/reference-items/item-1390.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1390.png"
    },
    "initialTags": [
      "tiny-trash",
      "platinum",
      "perfect"
    ],
    "discoveredTags": [
      "gold-24k"
    ],
    "states": [
      {
        "timestamp": 1390,
        "tags": [
          "tiny-trash",
          "platinum",
          "perfect"
        ],
        "appraisedValue": 267,
        "cash": 525,
        "ledgerAsset": "/assets/reference-tags/ledger-1390.png"
      },
      {
        "timestamp": 1430,
        "tags": [
          "tiny-trash",
          "gold-24k",
          "perfect"
        ],
        "appraisedValue": 590,
        "cash": 525,
        "ledgerAsset": "/assets/reference-tags/ledger-1430.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 1460,
        "speaker": "unknown",
        "amount": 350,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1412,
        "speaker": "npc",
        "text": "This is making me feel like it's a waste of time.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1412.0.png",
        "bbox": {
          "x": 714,
          "y": 198,
          "width": 492,
          "height": 110
        }
      }
    ],
    "result": "bought",
    "cashDelta": -350,
    "finalPrice": 350,
    "notes": [
      "报价1450秒显示NPC413与玩家350，成交现金525→175。",
      "1390之前的一帧是公开234、隐藏267的切换状态，不能作为物品基础价格。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -2,
    "expertness": null
  },
  {
    "id": "day7-avac-secretary",
    "day": 7,
    "start": 1465,
    "end": 1520,
    "duration": 55,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "棕发、棕色上衣、携AVAC证件的顾客",
      "asset": "/assets/reference-visitors/visitor-1470.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 1473,
        "speaker": "npc",
        "text": "It's just something I found, you want it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1473.0.png",
        "bbox": {
          "x": 742,
          "y": 198,
          "width": 436,
          "height": 110
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "画面卡片写Name:Jinmin Cha，Position:Secretary；“No thanks/Thank you”选项。",
      "随后打开Missing/Wanted通缉栏，奖励15000/8000/5000/1000。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day7-boots-refused-sale",
    "day": 7,
    "start": 1520,
    "end": 1540,
    "duration": 20,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "红帽、绿色上衣、红色短发顾客",
      "asset": "/assets/reference-visitors/visitor-1530.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Triumphant Combat Boots",
      "baseValue": 89,
      "asset": "/assets/reference-items/item-1530.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1530.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 1530,
        "speaker": "npc",
        "text": "How nuch is the Triumohant Combat Boots?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1530-19.png",
        "bbox": {
          "x": 719,
          "y": 208,
          "width": 485,
          "height": 110
        }
      }
    ],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "询问标价后离开，余额175未变。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day7-golden-glasses",
    "day": 7,
    "start": 1540,
    "end": 1625,
    "duration": 85,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "红棕色齐刘海、深灰上衣年轻顾客",
      "asset": "/assets/reference-visitors/visitor-1550.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Golden Glasses",
      "baseValue": 210,
      "asset": "/assets/reference-items/item-1550.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1550.png"
    },
    "initialTags": [
      "eyewear",
      "platinum",
      "fairly-damaged"
    ],
    "discoveredTags": [
      "unidentified-signature"
    ],
    "states": [
      {
        "timestamp": 1550,
        "tags": [
          "eyewear",
          "platinum",
          "fairly-damaged"
        ],
        "appraisedValue": 159,
        "cash": 175,
        "ledgerAsset": "/assets/reference-tags/ledger-1550.png"
      },
      {
        "timestamp": 1590,
        "tags": [
          "eyewear",
          "platinum",
          "fairly-damaged",
          "unidentified-signature"
        ],
        "appraisedValue": 127,
        "cash": 175,
        "ledgerAsset": "/assets/reference-tags/ledger-1590.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 1620,
        "speaker": "unknown",
        "amount": 75,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1572,
        "speaker": "npc",
        "text": "Bu the way, Isaw something like an autograph written on it. Can you tell me whose",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-1572.0.png",
        "bbox": {
          "x": 711,
          "y": 144,
          "width": 500,
          "height": 163
        }
      },
      {
        "timestamp": 1610,
        "speaker": "npc",
        "text": "Want a 30% margin? Then let's stop wasting our time and settle on 89U.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1610-21.png",
        "bbox": {
          "x": 711,
          "y": 172,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "bought",
    "cashDelta": -75,
    "finalPrice": 75,
    "notes": [
      "1610秒NPC明确要求89以留30%利润，最终现金175→100，实际付75。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -3,
    "expertness": null
  },
  {
    "id": "day7-finer-warning",
    "day": 7,
    "start": 1640,
    "end": 1668,
    "duration": 28,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "蓝色连帽衣、苍白长发顾客",
      "asset": "/assets/reference-visitors/visitor-1650.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 1650,
        "speaker": "npc",
        "text": "Were you trwing to avoid Finer?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1650-22.png",
        "bbox": {
          "x": 769,
          "y": 175,
          "width": 382,
          "height": 107
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "对白询问是否逃避Finer；后续商店正常来访。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day7-paperbag-sale",
    "day": 7,
    "start": 1660,
    "end": 1680,
    "duration": 20,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色短发、棕色立领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-1670.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Picked-up Paperbag",
      "baseValue": null,
      "asset": "/assets/reference-items/item-1670.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1670.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1671,
        "speaker": "unknown",
        "amount": 300,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1663,
        "speaker": "npc",
        "text": "Finer is the onls salvation left for me. You understand that, right?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1663.0.png",
        "bbox": {
          "x": 710,
          "y": 147,
          "width": 500,
          "height": 137
        }
      },
      {
        "timestamp": 1664,
        "speaker": "npc",
        "text": "Fimer is the only salvation left for me. You understand that, right?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1664-27.png",
        "bbox": {
          "x": 710,
          "y": 147,
          "width": 500,
          "height": 137
        }
      },
      {
        "timestamp": 1668.5,
        "speaker": "npc",
        "text": "Anyway, it's good to have you back, Bob. I'll drop by agai",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-1668.5.png",
        "bbox": {
          "x": 710,
          "y": 146,
          "width": 500,
          "height": 133
        }
      },
      {
        "timestamp": 1669,
        "speaker": "npc",
        "text": "That's good. Ill take it.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1669-30.png",
        "bbox": {
          "x": 821,
          "y": 218,
          "width": 280,
          "height": 104
        }
      }
    ],
    "result": "sold",
    "cashDelta": 300,
    "finalPrice": 300,
    "notes": [
      "1671秒现金100→400，成交300。之后街道捡物+80、隔日利息−25，进入DAY8时455。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day8-gioconda",
    "day": 8,
    "start": 1680,
    "end": 1800,
    "duration": 120,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "紫红色短发、深色衬衫顾客",
      "asset": "/assets/reference-visitors/visitor-1690.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Masterpiece «La Gioconda»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-1690.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1690.png"
    },
    "initialTags": [
      "artwork-2d",
      "canvas",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "great-piece",
      "fine-piece",
      "archaeological"
    ],
    "states": [
      {
        "timestamp": 1690,
        "tags": [
          "artwork-2d",
          "canvas",
          "slightly-damaged"
        ],
        "appraisedValue": 232,
        "cash": 455,
        "ledgerAsset": "/assets/reference-tags/ledger-1690.png"
      },
      {
        "timestamp": 1710,
        "tags": [
          "artwork-2d",
          "great-piece",
          "canvas",
          "slightly-damaged"
        ],
        "appraisedValue": 349,
        "cash": 455,
        "ledgerAsset": "/assets/reference-tags/ledger-1710.png"
      },
      {
        "timestamp": 1770,
        "tags": [
          "artwork-2d",
          "fine-piece",
          "canvas",
          "slightly-damaged",
          "archaeological"
        ],
        "appraisedValue": 814,
        "cash": 455,
        "ledgerAsset": "/assets/reference-tags/ledger-1770.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 1795,
        "speaker": "unknown",
        "amount": 450,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1772,
        "speaker": "npc",
        "text": "So that I can get more money? Thanks!",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1772.0.png",
        "bbox": {
          "x": 743,
          "y": 212,
          "width": 437,
          "height": 110
        }
      },
      {
        "timestamp": 1791,
        "speaker": "npc",
        "text": "I can't complain! It's you who figured out its actual price, which is even higher than I expected.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1791.0.png",
        "bbox": {
          "x": 711,
          "y": 159,
          "width": 500,
          "height": 169
        }
      }
    ],
    "result": "bought",
    "cashDelta": -450,
    "finalPrice": 450,
    "notes": [
      "年份1503；无签名找到。机器人提示不能依据签名名录认作已知艺术家，随后Great Piece改Fine Piece。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -3,
    "expertness": null
  },
  {
    "id": "day8-fixie-bag-sale",
    "day": 8,
    "start": 1800,
    "end": 1820,
    "duration": 20,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色齐耳短发、深灰圆领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-1810.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Fixie-made Bag",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-1810.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1810.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1815,
        "speaker": "unknown",
        "amount": 850,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1810,
        "speaker": "npc",
        "text": "l'dlike to buy the Fixie-made Bag over there. How much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1810-34.png",
        "bbox": {
          "x": 711,
          "y": 179,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "sold",
    "cashDelta": 850,
    "finalPrice": 850,
    "notes": [
      "货架标价850；余额5→855。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day8-avac-card",
    "day": 8,
    "start": 1820,
    "end": 1870,
    "duration": 50,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕色齐耳短发、深灰圆领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-1830.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "AVAC ID Card",
      "baseValue": 80,
      "asset": "/assets/reference-items/item-1830.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1830.png"
    },
    "initialTags": [
      "id-card",
      "plastic",
      "slightly-damaged"
    ],
    "discoveredTags": [],
    "states": [
      {
        "timestamp": 1830,
        "tags": [
          "id-card",
          "plastic",
          "slightly-damaged"
        ],
        "appraisedValue": 65,
        "cash": 855,
        "ledgerAsset": "/assets/reference-tags/ledger-1830.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 1865,
        "speaker": "unknown",
        "amount": 50,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1830,
        "speaker": "npc",
        "text": "How much can wou offer me for it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1830-35.png",
        "bbox": {
          "x": 768,
          "y": 210,
          "width": 387,
          "height": 110
        }
      }
    ],
    "result": "bought",
    "cashDelta": -50,
    "finalPrice": 50,
    "notes": [
      "年份2079；余额855→805。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -4,
    "expertness": null
  },
  {
    "id": "day8-taxidermied-butterfly-sale",
    "day": 8,
    "start": 1870,
    "end": 1876,
    "duration": 6,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "青绿色上衣、卷曲棕短发顾客",
      "asset": "/assets/reference-visitors/visitor-1875.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Taxidermied Butterfly",
      "baseValue": 280,
      "asset": "/assets/reference-items/item-1875.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1875.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1871,
        "speaker": "unknown",
        "amount": 275,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1875,
        "speaker": "npc",
        "text": "Alright. There's no way gou're overpricing your items.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1875.0.png",
        "bbox": {
          "x": 711,
          "y": 188,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "sold",
    "cashDelta": 275,
    "finalPrice": 275,
    "notes": [
      "1876秒现金805→1080；右卡估值232、买入180。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 4
  },
  {
    "id": "day8-golden-glasses-sale",
    "day": 8,
    "start": 1876,
    "end": 1888,
    "duration": 12,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色短发、圆脸灰色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-1885.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Golden Glasses",
      "baseValue": 210,
      "asset": "/assets/reference-items/item-1885.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1885.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 1883,
        "speaker": "unknown",
        "amount": 180,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1878,
        "speaker": "npc",
        "text": "The Golden Glasses on the showoase, how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1878-41.png",
        "bbox": {
          "x": 710,
          "y": 167,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 1885,
        "speaker": "npc",
        "text": "Ite herd That's too much for a used one. But, okay.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1885-45.png",
        "bbox": {
          "x": 710,
          "y": 173,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 1886,
        "speaker": "npc",
        "text": "That's too much for a used one. But, okay. It's hard to get new things these",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-1886.0.png",
        "bbox": {
          "x": 710,
          "y": 173,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 1886,
        "speaker": "npc",
        "text": "It's hard to get new things these That's too much for a used one. But, okay.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-1886-46.png",
        "bbox": {
          "x": 710,
          "y": 173,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "sold",
    "cashDelta": 180,
    "finalPrice": 180,
    "notes": [
      "1887秒+180；右卡估值137、买入75。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 5
  },
  {
    "id": "day8-doll",
    "day": 8,
    "start": 1920,
    "end": 2033,
    "duration": 113,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "金色偏分短发、浅灰外套、黑色深V内搭顾客",
      "asset": "/assets/reference-visitors/visitor-1930.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Doll of Me",
      "baseValue": 52,
      "asset": "/assets/reference-items/item-1930.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-1930.png"
    },
    "initialTags": [
      "doll",
      "velvet",
      "slightly-damaged",
      "artist-signature",
      "popular"
    ],
    "discoveredTags": [
      "fairly-damaged",
      "cotton",
      "popular-youth"
    ],
    "states": [
      {
        "timestamp": 1930,
        "tags": [
          "doll",
          "velvet",
          "slightly-damaged",
          "artist-signature",
          "popular"
        ],
        "appraisedValue": 215,
        "cash": 1260,
        "ledgerAsset": "/assets/reference-tags/ledger-1930.png"
      },
      {
        "timestamp": 1970,
        "tags": [
          "doll",
          "velvet",
          "fairly-damaged",
          "artist-signature",
          "popular"
        ],
        "appraisedValue": 107,
        "cash": 1260,
        "ledgerAsset": "/assets/reference-tags/ledger-1970.png"
      },
      {
        "timestamp": 1990,
        "tags": [
          "doll",
          "cotton",
          "fairly-damaged",
          "artist-signature",
          "popular"
        ],
        "appraisedValue": 47,
        "cash": 1260,
        "ledgerAsset": "/assets/reference-tags/ledger-1990.png"
      },
      {
        "timestamp": 2010,
        "tags": [
          "doll",
          "cotton",
          "fairly-damaged",
          "artist-signature",
          "popular-youth"
        ],
        "appraisedValue": 43,
        "cash": 1260,
        "ledgerAsset": "/assets/reference-tags/ledger-2010.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2035,
        "speaker": "unknown",
        "amount": 35,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 1933,
        "speaker": "npc",
        "text": "But I'm here as a mere customer, so treat me like you would do to others.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-1933.0.png",
        "bbox": {
          "x": 710,
          "y": 140,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 2031,
        "speaker": "npc",
        "text": "lunderstand if you want me to stay here longer, but",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-2031.0.png",
        "bbox": {
          "x": 710,
          "y": 146,
          "width": 500,
          "height": 136
        }
      }
    ],
    "result": "bought",
    "cashDelta": -35,
    "finalPrice": 35,
    "notes": [
      "签名对应MO,Yeon-gy，名录2046。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -4,
    "expertness": null
  },
  {
    "id": "day8-rabbit",
    "day": 8,
    "start": 2033,
    "end": 2245,
    "duration": 212,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "深棕后梳发、青绿色长袖顾客",
      "asset": "/assets/reference-visitors/visitor-2050.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Wooden Sculpture «My Dear Rabbit»",
      "baseValue": 310,
      "asset": "/assets/reference-items/item-2050.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2050.png"
    },
    "initialTags": [
      "artwork-3d",
      "wooden",
      "slightly-damaged",
      "artist-signature"
    ],
    "discoveredTags": [
      "deceased-artist"
    ],
    "states": [
      {
        "timestamp": 2050,
        "tags": [
          "artwork-3d",
          "wooden",
          "slightly-damaged",
          "artist-signature"
        ],
        "appraisedValue": 476,
        "cash": 1225,
        "ledgerAsset": "/assets/reference-tags/ledger-2050.png"
      },
      {
        "timestamp": 2170,
        "tags": [
          "artwork-3d",
          "deceased-artist",
          "wooden",
          "slightly-damaged",
          "artist-signature"
        ],
        "appraisedValue": 2780,
        "cash": 1225,
        "ledgerAsset": "/assets/reference-tags/ledger-2170.png"
      },
      {
        "timestamp": 2210,
        "tags": [
          "artwork-3d",
          "deceased-artist",
          "wooden",
          "slightly-damaged",
          "artist-signature"
        ],
        "appraisedValue": 2780,
        "cash": 2725,
        "ledgerAsset": "/assets/reference-tags/ledger-2210.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2240,
        "speaker": "unknown",
        "amount": 1789,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "bought",
    "cashDelta": -1789,
    "finalPrice": 1789,
    "notes": [
      "年份2064，LEE,Dongjun签名2032；查书后加已故艺术家+1500。",
      "鉴定中贷款1500，现金1225→2725；报价玩家1650，对方1789，最后付1789。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -4,
    "expertness": null
  },
  {
    "id": "day8-crocodile",
    "day": 8,
    "start": 2260,
    "end": 2330,
    "duration": 70,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "红色中分头发、褐色V领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2270.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «Happy Tears of a Crocodile»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-2270.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2270.png"
    },
    "initialTags": [
      "artwork-2d",
      "paper",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "artist-signature"
    ],
    "states": [
      {
        "timestamp": 2270,
        "tags": [
          "artwork-2d",
          "paper",
          "slightly-damaged"
        ],
        "appraisedValue": 231,
        "cash": 936,
        "ledgerAsset": "/assets/reference-tags/ledger-2270.png"
      },
      {
        "timestamp": 2310,
        "tags": [
          "artwork-2d",
          "paper",
          "slightly-damaged",
          "artist-signature"
        ],
        "appraisedValue": 463,
        "cash": 936,
        "ledgerAsset": "/assets/reference-tags/ledger-2310.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2325,
        "speaker": "unknown",
        "amount": 325,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "bought",
    "cashDelta": -325,
    "finalPrice": 325,
    "notes": [
      "签名LEE,Eunjeong；实际付款后936→611。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -5,
    "expertness": null
  },
  {
    "id": "day8-picked-hoverboard-sale",
    "day": 8,
    "start": 2334,
    "end": 2340,
    "duration": 6,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕发紫色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2335.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Picked-up Hoverboard",
      "baseValue": 200,
      "asset": "/assets/reference-items/item-2335.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2335.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2335,
        "speaker": "unknown",
        "amount": 30,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2335,
        "speaker": "npc",
        "text": "How much is the Picked-up Hoverboard?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2335-49.png",
        "bbox": {
          "x": 727,
          "y": 196,
          "width": 466,
          "height": 110
        }
      }
    ],
    "result": "sold",
    "cashDelta": 30,
    "finalPrice": 30,
    "notes": [
      "2335秒询问，2340秒现金611→641。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day8-my-mom",
    "day": 8,
    "start": 2340,
    "end": 2370,
    "duration": 30,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕色短发、紫色上衣年轻顾客",
      "asset": "/assets/reference-visitors/visitor-2350.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «My Mom is Very Pretty»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-2350.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2350.png"
    },
    "initialTags": [
      "artwork-2d"
    ],
    "discoveredTags": [
      "poor-piece",
      "canvas",
      "slightly-damaged"
    ],
    "states": [
      {
        "timestamp": 2340,
        "tags": [
          "artwork-2d"
        ],
        "appraisedValue": 285,
        "cash": 641,
        "ledgerAsset": "/assets/reference-tags/ledger-2340.png"
      },
      {
        "timestamp": 2350,
        "tags": [
          "artwork-2d",
          "poor-piece",
          "canvas",
          "slightly-damaged"
        ],
        "appraisedValue": 76,
        "cash": 641,
        "ledgerAsset": "/assets/reference-tags/ledger-2350.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2365,
        "speaker": "unknown",
        "amount": 50,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2340,
        "speaker": "npc",
        "text": "This is my mom!Ipainted it muself!",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2340-50.png",
        "bbox": {
          "x": 771,
          "y": 185,
          "width": 378,
          "height": 104
        }
      },
      {
        "timestamp": 2345,
        "speaker": "npc",
        "text": "Mu mom's a little sick latelu and she staus in bed all day, but she used to smile like this.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2345-51.png",
        "bbox": {
          "x": 710,
          "y": 138,
          "width": 500,
          "height": 169
        }
      }
    ],
    "result": "bought",
    "cashDelta": -50,
    "finalPrice": 50,
    "notes": [
      "报价框曾45；最终现金641→591，成交50。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -5,
    "expertness": null
  },
  {
    "id": "day8-vermeer-acquired",
    "day": 8,
    "start": 2380,
    "end": 2400,
    "duration": 20,
    "saleType": "gift",
    "npc": {
      "name": null,
      "appearance": "棕色短发、灰色翻领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2390.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «Girl with a Pearl Earring»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-2390.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2390.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2395,
        "speaker": "unknown",
        "amount": 0,
        "accepted": false
      }
    ],
    "dialogues": [
      {
        "timestamp": 2385,
        "speaker": "npc",
        "text": "It doesn't seemto be worth that much.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2385-52.png",
        "bbox": {
          "x": 743,
          "y": 230,
          "width": 437,
          "height": 106
        }
      },
      {
        "timestamp": 2393,
        "speaker": "npc",
        "text": "I've picked it up somewhere, it looks really old... but there's no space for this painting in my apartment.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2393.0.png",
        "bbox": {
          "x": 710,
          "y": 126,
          "width": 500,
          "height": 168
        }
      }
    ],
    "result": "gifted",
    "cashDelta": 0,
    "finalPrice": 0,
    "notes": [
      "只观察到进店带此画与之后库存存在、现金591不变；获得路径需逐秒核查。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day8-doll-declined-sale",
    "day": 8,
    "start": 2380,
    "end": 2388,
    "duration": 8,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色短发、灰色立领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2385.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Doll of Me",
      "baseValue": 52,
      "asset": "/assets/reference-items/item-2385.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2385.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "2385秒：It does not seem to be worth that much；余额591保持不变。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day8-fantastic-hoverboard",
    "day": 8,
    "start": 2400,
    "end": 2440,
    "duration": 40,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "秃顶、八字胡、灰棕长袖的年长顾客",
      "asset": "/assets/reference-visitors/visitor-2410.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Fantastic Hoverboard",
      "baseValue": 200,
      "asset": "/assets/reference-items/item-2410.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2410.png"
    },
    "initialTags": [
      "hoverboard",
      "brand-vertivo",
      "vtv-steel",
      "perfect",
      "popular"
    ],
    "discoveredTags": [],
    "states": [
      {
        "timestamp": 2410,
        "tags": [
          "hoverboard",
          "brand-vertivo",
          "vtv-steel",
          "perfect",
          "popular"
        ],
        "appraisedValue": 877,
        "cash": 591,
        "ledgerAsset": "/assets/reference-tags/ledger-2410.png"
      }
    ],
    "quotes": [],
    "dialogues": [],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "未见付款，余额591不变。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -5,
    "expertness": null
  },
  {
    "id": "day8-avac-card-sale",
    "day": 8,
    "start": 2440,
    "end": 2480,
    "duration": 40,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "眼镜、秃顶、淡绿外套领带顾客",
      "asset": "/assets/reference-visitors/visitor-2450.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "AVAC ID Card",
      "baseValue": 80,
      "asset": "/assets/reference-items/item-2450.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2450.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2475,
        "speaker": "unknown",
        "amount": 68,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2450,
        "speaker": "npc",
        "text": "Yeah, enactly! How much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2450-54.png",
        "bbox": {
          "x": 783,
          "y": 188,
          "width": 360,
          "height": 104
        }
      },
      {
        "timestamp": 2471.5,
        "speaker": "npc",
        "text": "Let's wish us the best of luck, Bob!",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2471.5.png",
        "bbox": {
          "x": 763,
          "y": 188,
          "width": 400,
          "height": 104
        }
      }
    ],
    "result": "sold",
    "cashDelta": 68,
    "finalPrice": 68,
    "notes": [
      "右卡估值68；余额591→659。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。",
      "右卡Bought at 0且没有Expertness标签；不可自动与同名购买实例合并。"
    ],
    "attractiveness": null,
    "expertness": 0
  },
  {
    "id": "day8-vermeer-sale",
    "day": 8,
    "start": 2480,
    "end": 2510,
    "duration": 30,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色短发、灰色圆领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2490.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «Girl with a Pearl Earring»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-2490.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2490.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2495,
        "speaker": "unknown",
        "amount": 852,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2488,
        "speaker": "npc",
        "text": "I'll buy it right away if it's 852U.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2488-56.png",
        "bbox": {
          "x": 782,
          "y": 203,
          "width": 356,
          "height": 110
        }
      },
      {
        "timestamp": 2498,
        "speaker": "npc",
        "text": "Iwasn't sure you'd accept my offer. Thanks.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2498-58.png",
        "bbox": {
          "x": 717,
          "y": 185,
          "width": 486,
          "height": 103
        }
      }
    ],
    "result": "sold",
    "cashDelta": 852,
    "finalPrice": 852,
    "notes": [
      "2488秒NPC出价852，2495秒+852到账；另一次太阳镜销售见独立条目。",
      "右卡Bought at 0且没有Expertness标签；不可自动与同名购买实例合并。"
    ],
    "attractiveness": null,
    "expertness": 0
  },
  {
    "id": "day8-plain-sunglasses-sale",
    "day": 8,
    "start": 2506,
    "end": 2509,
    "duration": 3,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "短棕发顾客（交易切换极快）",
      "asset": "/assets/reference-visitors/visitor-2507.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Plain Sunglasses",
      "baseValue": null,
      "asset": "/assets/reference-items/item-2507.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2507.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2504,
        "speaker": "unknown",
        "amount": 350,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2507,
        "speaker": "npc",
        "text": "Good. lewpected as much. I'lltake it",
        "partial": true,
        "asset": "/assets/reference-dialogue/dialogue-2507-60.png",
        "bbox": {
          "x": 753,
          "y": 203,
          "width": 417,
          "height": 105
        }
      }
    ],
    "result": "sold",
    "cashDelta": 350,
    "finalPrice": 350,
    "notes": [
      "2507秒现金1501；2508秒+350到账。之前1511→1501另有10下降。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-boots-declined-sale",
    "day": 9,
    "start": 2553,
    "end": 2574,
    "duration": 21,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "橙棕色偏分短发、浅绿上衣年轻顾客",
      "asset": "/assets/reference-visitors/visitor-2555.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Triumphant Combat Boots",
      "baseValue": 89,
      "asset": "/assets/reference-items/item-2555.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2555.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 2560,
        "speaker": "npc",
        "text": "What? This is crazy. Who pays 275V for this?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2560-61.png",
        "bbox": {
          "x": 711,
          "y": 174,
          "width": 500,
          "height": 134
        }
      },
      {
        "timestamp": 2570,
        "speaker": "npc",
        "text": "Youll soon realize it was not a bad offer.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2570-62.png",
        "bbox": {
          "x": 733,
          "y": 215,
          "width": 457,
          "height": 109
        }
      }
    ],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "报价275，对方还价146，未成交；余额1221不变。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 5
  },
  {
    "id": "day9-black-umbrella-sale",
    "day": 9,
    "start": 2580,
    "end": 2640,
    "duration": 60,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "浅棕短发、紫色圆领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2610.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Black Umbrella",
      "baseValue": null,
      "asset": "/assets/reference-items/item-2610.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2610.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2635,
        "speaker": "unknown",
        "amount": 200,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "sold",
    "cashDelta": 200,
    "finalPrice": 200,
    "notes": [
      "右卡估值80；余额1221→1421。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-umbrella-side-deal",
    "day": 9,
    "start": 2640,
    "end": 2674,
    "duration": 34,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕红短发、紫色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2657.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Umbrella (side deal)",
      "baseValue": null,
      "asset": "/assets/reference-items/item-2657.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2657.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2669,
        "speaker": "unknown",
        "amount": 150,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2655,
        "speaker": "npc",
        "text": "Iwontuse the umbrellas nor talk about anything that happened between us.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2655-63.png",
        "bbox": {
          "x": 710,
          "y": 161,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 2657,
        "speaker": "npc",
        "text": "Andlcan pau you 150V for each.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2657-65.png",
        "bbox": {
          "x": 710,
          "y": 161,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 2659,
        "speaker": "npc",
        "text": "Andlcan pauvou 150V for each. It's even more than AVAC pays you, right?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2659.0.png",
        "bbox": {
          "x": 710,
          "y": 161,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 2673,
        "speaker": "npc",
        "text": "I appreciate wour bold decision!",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2673-71.png",
        "bbox": {
          "x": 773,
          "y": 191,
          "width": 374,
          "height": 103
        }
      }
    ],
    "result": "sold",
    "cashDelta": 150,
    "finalPrice": 150,
    "notes": [
      "2657秒顾客承诺每把150，2671秒+150到账。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-doll-sale",
    "day": 9,
    "start": 2677,
    "end": 2681,
    "duration": 4,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "新到访顾客（短时间过渡）",
      "asset": "/assets/reference-visitors/visitor-2680.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Doll of Me",
      "baseValue": 52,
      "asset": "/assets/reference-items/item-2680.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2680.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2676,
        "speaker": "unknown",
        "amount": 60,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "sold",
    "cashDelta": 60,
    "finalPrice": 60,
    "notes": [
      "2680.5秒补帧对白显示“How much is the Doll of”，2681秒+60；根据该唯一同名前缀识别为Doll of Me。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-time-device",
    "day": 9,
    "start": 2680,
    "end": 2730,
    "duration": 50,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "浅棕上翘短发、绿色上衣年轻顾客",
      "asset": "/assets/reference-visitors/visitor-2690.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Prof. Choi's Time... Whatever",
      "baseValue": 400,
      "asset": "/assets/reference-items/item-2690.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2690.png"
    },
    "initialTags": [
      "device",
      "plastic",
      "fairly-damaged"
    ],
    "discoveredTags": [
      "slightly-damaged"
    ],
    "states": [
      {
        "timestamp": 2690,
        "tags": [
          "device",
          "plastic",
          "fairly-damaged"
        ],
        "appraisedValue": 152,
        "cash": 1631,
        "ledgerAsset": "/assets/reference-tags/ledger-2690.png"
      },
      {
        "timestamp": 2710,
        "tags": [
          "device",
          "plastic",
          "slightly-damaged"
        ],
        "appraisedValue": 304,
        "cash": 1631,
        "ledgerAsset": "/assets/reference-tags/ledger-2710.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2725,
        "speaker": "unknown",
        "amount": 180,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2680.5,
        "speaker": "npc",
        "text": "How nuch is the Doll of",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-2680.5.png",
        "bbox": {
          "x": 795,
          "y": 208,
          "width": 333,
          "height": 110
        }
      },
      {
        "timestamp": 2683,
        "speaker": "npc",
        "text": "Iwanted to see what his living conditions security was so bad were like so l went to his house and the",
        "partial": true,
        "asset": "/assets/reference-dialogue/dialogue-2683-75.png",
        "bbox": {
          "x": 711,
          "y": 144,
          "width": 500,
          "height": 169
        }
      },
      {
        "timestamp": 2684.5,
        "speaker": "npc",
        "text": "Iwanted to see what his living conditions were like so l went to his house and the security was so bad",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-2684.5.png",
        "bbox": {
          "x": 711,
          "y": 144,
          "width": 500,
          "height": 169
        }
      },
      {
        "timestamp": 2687,
        "speaker": "npc",
        "text": "Ifound this was just luing on the ground.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2687-78.png",
        "bbox": {
          "x": 736,
          "y": 203,
          "width": 451,
          "height": 105
        }
      }
    ],
    "result": "bought",
    "cashDelta": -180,
    "finalPrice": 180,
    "notes": [
      "同为塑料装置，损坏程度修正后152→304。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -6,
    "expertness": null
  },
  {
    "id": "day9-my-mom-declined-sale",
    "day": 9,
    "start": 2734,
    "end": 2758,
    "duration": 24,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "红棕齐刘海、灰黑上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2735.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «My Mom is Very Pretty»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-2735.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2735.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 2743,
        "speaker": "npc",
        "text": "Haven't you checked if it has an autograph of a celebrity, by the way? I oan see something like an autograph on this.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2743.0.png",
        "bbox": {
          "x": 711,
          "y": 144,
          "width": 500,
          "height": 169
        }
      },
      {
        "timestamp": 2745,
        "speaker": "npc",
        "text": "Haven't you checked if it has an autograph something like an autograph on this. of a celebrity, by the way? I oan see",
        "partial": true,
        "asset": "/assets/reference-dialogue/dialogue-2745-80.png",
        "bbox": {
          "x": 711,
          "y": 144,
          "width": 500,
          "height": 168
        }
      }
    ],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "右卡84、买入50；顾客要求检查疑似签名，未见成交。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 5
  },
  {
    "id": "day9-officer-visit",
    "day": 9,
    "start": 2760,
    "end": 2800,
    "duration": 40,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "黑色制服、黑发的Stabilizer人物",
      "asset": "/assets/reference-visitors/visitor-2770.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 2772.5,
        "speaker": "npc",
        "text": "You must've been aware that Finerain would come down soon, am I wrong?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2772.5.png",
        "bbox": {
          "x": 710,
          "y": 175,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 2790,
        "speaker": "npc",
        "text": "...How did vou make it to Bluebird ten we ars аgo?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2790-82.png",
        "bbox": {
          "x": 710,
          "y": 167,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "谈到Finer以及Bluebird十年前；期间现金1451→1331，具体款项须核查。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-seoul-stamp",
    "day": 9,
    "start": 2800,
    "end": 2850,
    "duration": 50,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "棕红头发与络腮胡、蓝色长袖顾客",
      "asset": "/assets/reference-visitors/visitor-2810.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "88' Seoul Olympics Post Stamp",
      "baseValue": 73,
      "asset": "/assets/reference-items/item-2810.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2810.png"
    },
    "initialTags": [
      "postage-stamp",
      "paper",
      "fairly-damaged"
    ],
    "discoveredTags": [
      "archaeological"
    ],
    "states": [
      {
        "timestamp": 2810,
        "tags": [
          "postage-stamp",
          "paper",
          "fairly-damaged"
        ],
        "appraisedValue": 29,
        "cash": 1331,
        "ledgerAsset": "/assets/reference-tags/ledger-2810.png"
      },
      {
        "timestamp": 2830,
        "tags": [
          "postage-stamp",
          "paper",
          "fairly-damaged",
          "archaeological"
        ],
        "appraisedValue": 87,
        "cash": 1331,
        "ledgerAsset": "/assets/reference-tags/ledger-2830.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 2845,
        "speaker": "unknown",
        "amount": 60,
        "accepted": true
      }
    ],
    "dialogues": [],
    "result": "bought",
    "cashDelta": -60,
    "finalPrice": 60,
    "notes": [
      "1988年代物品；付60。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -6,
    "expertness": 5
  },
  {
    "id": "day9-chippie-sculpture-sale",
    "day": 9,
    "start": 2845,
    "end": 2870,
    "duration": 25,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "棕色短发、胡子、橄榄上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2850.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Sculpture «Chippie Gazes»",
      "baseValue": null,
      "asset": "/assets/reference-items/item-2850.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2850.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2865,
        "speaker": "unknown",
        "amount": 571,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2850,
        "speaker": "npc",
        "text": "The Sculpture «Chippie Gazes* on the showcase, how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2850-83.png",
        "bbox": {
          "x": 710,
          "y": 170,
          "width": 500,
          "height": 138
        }
      }
    ],
    "result": "sold",
    "cashDelta": 571,
    "finalPrice": 571,
    "notes": [
      "现金1271→1842。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day9-bookmark-sale",
    "day": 9,
    "start": 2870,
    "end": 2910,
    "duration": 40,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "红帽、短胡子、绿色上衣顾客",
      "asset": "/assets/reference-visitors/visitor-2890.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Bookmark",
      "baseValue": 48,
      "asset": "/assets/reference-items/item-2890.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-2890.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 2905,
        "speaker": "unknown",
        "amount": 551,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 2873,
        "speaker": "npc",
        "text": "Something must be wrong. Who buys this for 900U?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-2873.0.png",
        "bbox": {
          "x": 710,
          "y": 165,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "sold",
    "cashDelta": 551,
    "finalPrice": 551,
    "notes": [
      "右卡估值632、买入350，报价气泡551；余额1842→2393。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": 5
  },
  {
    "id": "day10-fine-visit",
    "day": 10,
    "start": 2995,
    "end": 3013,
    "duration": 18,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "制服执法来客",
      "asset": "/assets/reference-visitors/visitor-2995.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 2995,
        "speaker": "npc",
        "text": "So. Mr. Bob Jo, wou must pay wour fine right now.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-2995-85.png",
        "bbox": {
          "x": 710,
          "y": 209,
          "width": 500,
          "height": 139
        }
      },
      {
        "timestamp": 3000,
        "speaker": "npc",
        "text": "Orelse. Illarrest you on the spot",
        "partial": true,
        "asset": "/assets/reference-dialogue/dialogue-3000-86.png",
        "bbox": {
          "x": 750,
          "y": 238,
          "width": 420,
          "height": 111
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "必须缴罚款，否则arrest you on the spot；3010现金1114→864，罚款250。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day10-crocodile-sale",
    "day": 10,
    "start": 3014,
    "end": 3018,
    "duration": 4,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "切换极快的到访顾客",
      "asset": "/assets/reference-visitors/visitor-3016.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Painting «Happy Tears of a Crocodile»",
      "baseValue": 300,
      "asset": "/assets/reference-items/item-3016.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3016.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 3016,
        "speaker": "npc",
        "text": "The Painting «Happy Tears of a Crocodiles on the showsase, how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3016-88.png",
        "bbox": {
          "x": 710,
          "y": 173,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 3017,
        "speaker": "npc",
        "text": "Have you found my Time cinema?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3017-89.png",
        "bbox": {
          "x": 760,
          "y": 188,
          "width": 406,
          "height": 110
        }
      }
    ],
    "result": "unknown",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "3016秒明确询问；3017秒直接跳到下一NPC且余额864→329。可能含视频剪辑或独立现金动作，真实成交额不可由净额判断。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day10-time-device-sale",
    "day": 10,
    "start": 3020,
    "end": 3050,
    "duration": 30,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "眼镜、淡绿外套、秃顶年长顾客",
      "asset": "/assets/reference-visitors/visitor-3030.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Prof. Choi's Time... Whatever",
      "baseValue": 400,
      "asset": "/assets/reference-items/item-3030.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3030.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 3040,
        "speaker": "unknown",
        "amount": 300,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 3020,
        "speaker": "npc",
        "text": "Youhelped me a lot by getting me the ID card, but...",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3020-92.png",
        "bbox": {
          "x": 713,
          "y": 164,
          "width": 500,
          "height": 134
        }
      },
      {
        "timestamp": 3025,
        "speaker": "npc",
        "text": "whatIreally need for mu plan is the Time cinema.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3025.0.png",
        "bbox": {
          "x": 713,
          "y": 152,
          "width": 500,
          "height": 152
        }
      },
      {
        "timestamp": 3035,
        "speaker": "npc",
        "text": "That's good!",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3035-96.png",
        "bbox": {
          "x": 869,
          "y": 194,
          "width": 188,
          "height": 90
        }
      },
      {
        "timestamp": 3040,
        "speaker": "npc",
        "text": "So, you eventually helped me get all the rwo items!",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3040-97.png",
        "bbox": {
          "x": 713,
          "y": 158,
          "width": 500,
          "height": 138
        }
      }
    ],
    "result": "sold",
    "cashDelta": 300,
    "finalPrice": 300,
    "notes": [
      "3030秒输入300，3040秒现金329→629；3045秒独立−40，不能算入本笔成交。"
    ],
    "attractiveness": null,
    "expertness": 4
  },
  {
    "id": "day10-stabilizer-warning",
    "day": 10,
    "start": 3045,
    "end": 3084,
    "duration": 39,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "棕色长发、深绿制服执法来客",
      "asset": "/assets/reference-visitors/visitor-3045.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 3045,
        "speaker": "npc",
        "text": "Striotly speaking, you are an Avarice Criminal. too. You helped a dangerous figure.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3045-98.png",
        "bbox": {
          "x": 710,
          "y": 118,
          "width": 500,
          "height": 168
        }
      },
      {
        "timestamp": 3050,
        "speaker": "npc",
        "text": "So, you must pay your fine right now to prove vour non-Dossegsion soirit.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3050-99.png",
        "bbox": {
          "x": 710,
          "y": 148,
          "width": 500,
          "height": 136
        }
      },
      {
        "timestamp": 3070,
        "speaker": "npc",
        "text": "ust do as lsau.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3070-100.png",
        "bbox": {
          "x": 851,
          "y": 177,
          "width": 218,
          "height": 104
        }
      },
      {
        "timestamp": 3075,
        "speaker": "npc",
        "text": "wou'll never see the light of day again.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3075-101.png",
        "bbox": {
          "x": 744,
          "y": 177,
          "width": 432,
          "height": 107
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "指责帮助危险人物，要求立即罚款以证明non-possession spirit。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day10-sweet-pocket-sale",
    "day": 10,
    "start": 3085,
    "end": 3088,
    "duration": 3,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "当日最后到访顾客",
      "asset": "/assets/reference-visitors/visitor-3085.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Sweet Pocket Mommy",
      "baseValue": null,
      "asset": "/assets/reference-items/item-3085.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3085.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 3085,
        "speaker": "unknown",
        "amount": 250,
        "accepted": null
      }
    ],
    "dialogues": [
      {
        "timestamp": 3085,
        "speaker": "npc",
        "text": "The Sweet Pocket Mommy on the showease. how much is it?",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3085-102.png",
        "bbox": {
          "x": 710,
          "y": 167,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "sold",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "货架Sweet Pocket Mommy标价250；3085询问，3086现金589→840。接受金额没有在已审阅帧中显示，不能从跨帧净差251推出成交价。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day11-reporting-setup",
    "day": 11,
    "start": 3140,
    "end": 3174,
    "duration": 34,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "棕色长发、深绿制服执法来客",
      "asset": "/assets/reference-visitors/visitor-3150.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 3153,
        "speaker": "npc",
        "text": "Here will be the total number of criminal arrests of the week throughout the city.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3153.0.png",
        "bbox": {
          "x": 710,
          "y": 155,
          "width": 500,
          "height": 139
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "每周追查90名Avarice criminals；出现红黄00/00和REPORT按钮。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day11-private-slot-tutorial",
    "day": 11,
    "start": 3174,
    "end": 3220,
    "duration": 46,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "秃头、浓密胡须、敞怀外套的Darcy",
      "asset": "/assets/reference-visitors/visitor-3185.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 3185,
        "speaker": "npc",
        "text": "Try find the card VERTIWO from the Manual and put it in the Private Slot.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3185-104.png",
        "bbox": {
          "x": 713,
          "y": 187,
          "width": 500,
          "height": 138
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "Good-looking Hoverboard教程：将VERTIVO品牌卡拖入Private Slot。",
      "公开基本价200，店铺−7%→186；私人槽位有独立价值合计。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day11-meaningful-paper",
    "day": 11,
    "start": 3220,
    "end": 3380,
    "duration": 160,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "红棕色长发、蓝色V领上衣顾客",
      "asset": "/assets/reference-visitors/visitor-3230.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Seemingly Meaningful Paper",
      "baseValue": 23,
      "asset": "/assets/reference-items/item-3230.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3230.png"
    },
    "initialTags": [
      "piece-paper",
      "paper",
      "fairly-damaged"
    ],
    "discoveredTags": [
      "politician-signature"
    ],
    "states": [
      {
        "timestamp": 3230,
        "tags": [
          "piece-paper",
          "paper",
          "fairly-damaged"
        ],
        "appraisedValue": 10,
        "cash": 703,
        "ledgerAsset": "/assets/reference-tags/ledger-3230.png"
      },
      {
        "timestamp": 3350,
        "tags": [
          "piece-paper",
          "paper",
          "fairly-damaged",
          "politician-signature"
        ],
        "appraisedValue": 7,
        "cash": 703,
        "ledgerAsset": "/assets/reference-tags/ledger-3350.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 3375,
        "speaker": "unknown",
        "amount": 5,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 3351.5,
        "speaker": "npc",
        "text": "Hmm, I didn't know that... Tsk, okay.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3351.5.png",
        "bbox": {
          "x": 765,
          "y": 215,
          "width": 393,
          "height": 105
        }
      },
      {
        "timestamp": 3371,
        "speaker": "npc",
        "text": "Are you sure? Thanks!",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3371.0.png",
        "bbox": {
          "x": 819,
          "y": 203,
          "width": 285,
          "height": 103
        }
      }
    ],
    "result": "bought",
    "cashDelta": -5,
    "finalPrice": 5,
    "notes": [
      "字条内容Anti-Chippie Act（2060），签名HAN,Sol（1999/2077）。",
      "新增私人槽，公开10→7；隐藏 National Historical Value×2 与 Popular Item+20%，私下显示24/20/14/17各阶段，具体取决于拖入顺序。",
      "起止范围按采样定位，报价时间未逐帧校准。",
      "scene-patch资产必须按bbox原位叠放；包含该区域原背景。"
    ],
    "attractiveness": -7,
    "expertness": null
  },
  {
    "id": "day11-rabbit-sale",
    "day": 11,
    "start": 3380,
    "end": 3410,
    "duration": 30,
    "saleType": "sell",
    "npc": {
      "name": null,
      "appearance": "紫红短发、棕褐色衬衫顾客",
      "asset": "/assets/reference-visitors/visitor-3390.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Wooden Sculpture «My Dear Rabbit»",
      "baseValue": 310,
      "asset": "/assets/reference-items/item-3390.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3390.png"
    },
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [
      {
        "timestamp": 3394,
        "speaker": "unknown",
        "amount": 3303,
        "accepted": true
      }
    ],
    "dialogues": [
      {
        "timestamp": 3390,
        "speaker": "npc",
        "text": "In my opinion, 3303U is right.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3390-107.png",
        "bbox": {
          "x": 794,
          "y": 230,
          "width": 335,
          "height": 110
        }
      },
      {
        "timestamp": 3396,
        "speaker": "npc",
        "text": "Thanks. What a good buy!",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3396-109.png",
        "bbox": {
          "x": 801,
          "y": 212,
          "width": 321,
          "height": 109
        }
      }
    ],
    "result": "sold",
    "cashDelta": 3303,
    "finalPrice": 3303,
    "notes": [
      "3394秒+3303，现金698→4001；3397秒放贷面板还贷−1500，现金2501。",
      "3011与+4%数学吻合，但Expertness行在当前右卡下方折叠未直接看到；expertness保留null。"
    ],
    "attractiveness": null,
    "expertness": null
  },
  {
    "id": "day11-hoverboard-display",
    "day": 11,
    "start": 3405,
    "end": 3466,
    "duration": 61,
    "saleType": "buy",
    "npc": {
      "name": null,
      "appearance": "橘红短发、芥末黄立领、胸口圆章顾客",
      "asset": "/assets/reference-visitors/visitor-3410.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": {
      "name": "Hoverboard for Display",
      "baseValue": 200,
      "asset": "/assets/reference-items/item-3410.png",
      "bbox": {
        "x": 785,
        "y": 684,
        "width": 345,
        "height": 278
      },
      "assetKind": "scene-patch",
      "titleAsset": "/assets/reference-titles/title-3410.png"
    },
    "initialTags": [
      "hoverboard",
      "brand-fuzzfly",
      "carbon-fiber",
      "slightly-damaged"
    ],
    "discoveredTags": [
      "fairly-damaged",
      "unpopular"
    ],
    "states": [
      {
        "timestamp": 3410,
        "tags": [
          "hoverboard",
          "brand-fuzzfly",
          "carbon-fiber",
          "slightly-damaged"
        ],
        "appraisedValue": 74,
        "cash": 2501,
        "ledgerAsset": "/assets/reference-tags/ledger-3410.png"
      },
      {
        "timestamp": 3450,
        "tags": [
          "hoverboard",
          "brand-fuzzfly",
          "carbon-fiber",
          "fairly-damaged",
          "unpopular"
        ],
        "appraisedValue": 26,
        "cash": 2501,
        "ledgerAsset": "/assets/reference-tags/ledger-3450.png"
      },
      {
        "timestamp": 3462,
        "tags": [
          "hoverboard",
          "brand-fuzzfly",
          "carbon-fiber",
          "fairly-damaged",
          "unidentified-signature",
          "unpopular"
        ],
        "appraisedValue": 20,
        "cash": 2501,
        "ledgerAsset": "/assets/reference-tags/ledger-3462.png"
      }
    ],
    "quotes": [
      {
        "timestamp": 3462,
        "speaker": "player",
        "amount": 0,
        "accepted": false
      }
    ],
    "dialogues": [
      {
        "timestamp": 3412,
        "speaker": "npc",
        "text": "That doesn't mean you can't buy it, right?",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3412.0.png",
        "bbox": {
          "x": 729,
          "y": 203,
          "width": 465,
          "height": 103
        }
      },
      {
        "timestamp": 3463,
        "speaker": "npc",
        "text": "So it turned out coming in here was nothing but a waste of time.",
        "partial": false,
        "asset": "/assets/reference-dialogue/dialogue-3463-114.png",
        "bbox": {
          "x": 711,
          "y": 172,
          "width": 500,
          "height": 134
        }
      }
    ],
    "result": "declined",
    "cashDelta": 0,
    "finalPrice": null,
    "notes": [
      "3462秒完整6标签估值20，报价为0，对方离开未付款。3467秒另有94现金下降，不属于此交易。",
      "举报器01/01；第二次举报后02/02。"
    ],
    "attractiveness": -7,
    "expertness": null
  },
  {
    "id": "day11-darcy-close",
    "day": 11,
    "start": 3467,
    "end": 3490,
    "duration": 23,
    "saleType": "story",
    "npc": {
      "name": null,
      "appearance": "秃头、浓密胡须、敞怀外套的Darcy",
      "asset": "/assets/reference-visitors/visitor-3470.png",
      "bbox": {
        "x": 815,
        "y": 318,
        "width": 290,
        "height": 431
      },
      "assetKind": "scene-patch"
    },
    "item": null,
    "initialTags": [],
    "discoveredTags": [],
    "states": [],
    "quotes": [],
    "dialogues": [
      {
        "timestamp": 3470,
        "speaker": "npc",
        "text": "She got so upset after she found out that I've been letting you live in that room t",
        "partial": true,
        "asset": "/assets/reference-dialogue/refined-3470.0.png",
        "bbox": {
          "x": 713,
          "y": 200,
          "width": 500,
          "height": 140
        }
      },
      {
        "timestamp": 3471,
        "speaker": "npc",
        "text": "She got so upset after she found out that I've been letting you live in that room for free.",
        "partial": false,
        "asset": "/assets/reference-dialogue/refined-3471.0.png",
        "bbox": {
          "x": 713,
          "y": 200,
          "width": 500,
          "height": 140
        }
      }
    ],
    "result": "story",
    "cashDelta": null,
    "finalPrice": null,
    "notes": [
      "谈到偷偷让Bob住在那个房间。"
    ],
    "attractiveness": null,
    "expertness": null
  }
];
export const RECORDED_INITIAL_STOCK: RecordedStock[] = [
  {
    "id": "strong-leg",
    "name": "Strong Leg for Chippies",
    "askPrice": 295,
    "appraisedValue": null,
    "boughtAt": null,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-strong-leg.png",
    "bbox": {
      "x": 336,
      "y": 307,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "backpack-soldier",
    "name": "Backpack of Soldier",
    "askPrice": 0,
    "appraisedValue": 58,
    "boughtAt": 45,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-backpack-soldier.png",
    "bbox": {
      "x": 1008,
      "y": 307,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "flawless-bag",
    "name": "Flawless Shoulder Bag",
    "askPrice": 500,
    "appraisedValue": null,
    "boughtAt": null,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-flawless-bag.png",
    "bbox": {
      "x": 1232,
      "y": 307,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "early-poster",
    "name": "Early Poster of AVAC",
    "askPrice": 70,
    "appraisedValue": null,
    "boughtAt": null,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-early-poster.png",
    "bbox": {
      "x": 112,
      "y": 517,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "backpack-unwrapped",
    "name": "Backpack Just Unwrapped",
    "askPrice": 375,
    "appraisedValue": null,
    "boughtAt": null,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-backpack-unwrapped.png",
    "bbox": {
      "x": 336,
      "y": 517,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "butterfly",
    "name": "Taxidermied Butterfly",
    "askPrice": 275,
    "appraisedValue": null,
    "boughtAt": 180,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-butterfly.png",
    "bbox": {
      "x": 1008,
      "y": 517,
      "width": 212,
      "height": 200
    }
  },
  {
    "id": "plain-sunglasses",
    "name": "Plain Sunglasses",
    "askPrice": 350,
    "appraisedValue": null,
    "boughtAt": null,
    "timestamp": 295,
    "asset": "/assets/reference-items/stock-plain-sunglasses.png",
    "bbox": {
      "x": 1232,
      "y": 517,
      "width": 212,
      "height": 200
    }
  }
];
