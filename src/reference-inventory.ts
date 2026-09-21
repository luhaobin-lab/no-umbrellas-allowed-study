/** Original inventory cells and observed shelf cards; no counter scenes or generated lettering. */
export interface ReferenceInventoryCell {asset:string;rect:[number,number,number,number];timestamp:number}
export interface ReferenceShelfCard extends ReferenceInventoryCell {price:number}
export const REFERENCE_INVENTORY_BY_TITLE:Record<string,ReferenceInventoryCell> = {
  "Strong Leg for Chippies": {
    "asset": "/assets/inventory/cell-strong-leg.png",
    "rect": [
      1775,
      209,
      132,
      121
    ],
    "timestamp": 285
  },
  "Flawless Shoulder Bag": {
    "asset": "/assets/inventory/cell-flawless-bag.png",
    "rect": [
      1775,
      329,
      132,
      121
    ],
    "timestamp": 285
  },
  "Early Poster of AVAC": {
    "asset": "/assets/inventory/cell-early-poster.png",
    "rect": [
      1645,
      689,
      132,
      121
    ],
    "timestamp": 285
  },
  "Backpack Just Unwrapped": {
    "asset": "/assets/inventory/cell-unwrapped-bag.png",
    "rect": [
      1645,
      329,
      132,
      121
    ],
    "timestamp": 285
  },
  "Taxidermied Butterfly": {
    "asset": "/assets/inventory/cell-butterfly.png",
    "rect": [
      1775,
      449,
      132,
      121
    ],
    "timestamp": 285
  },
  "Plain Sunglasses": {
    "asset": "/assets/inventory/cell-plain-glasses.png",
    "rect": [
      1775,
      569,
      132,
      121
    ],
    "timestamp": 285
  },
  "Backpack of Soldier": {
    "asset": "/assets/inventory/cell-soldier-bag.png",
    "rect": [
      1775,
      329,
      132,
      121
    ],
    "timestamp": 1010
  },
  "Fixie-made Bag": {
    "asset": "/assets/inventory/cell-fixie-bag.png",
    "rect": [
      1645,
      209,
      132,
      121
    ],
    "timestamp": 1010
  },
  "Picked-up Paperbag": {
    "asset": "/assets/inventory/cell-paper-bag.png",
    "rect": [
      1775,
      209,
      132,
      121
    ],
    "timestamp": 1010
  },
  "Triumphant Combat Boots": {
    "asset": "/assets/inventory/cell-boots.png",
    "rect": [
      1645,
      329,
      132,
      121
    ],
    "timestamp": 1010
  },
  "Bookmark": {
    "asset": "/assets/inventory/cell-bookmark.png",
    "rect": [
      1645,
      689,
      132,
      121
    ],
    "timestamp": 2370
  },
  "Doll of Me": {
    "asset": "/assets/inventory/cell-doll.png",
    "rect": [
      1775,
      329,
      132,
      121
    ],
    "timestamp": 2370
  },
  "Wooden Sculpture «My Dear Rabbit»": {
    "asset": "/assets/inventory/cell-rabbit.png",
    "rect": [
      1645,
      329,
      132,
      121
    ],
    "timestamp": 2370
  },
  "Painting «Happy Tears of a Crocodile»": {
    "asset": "/assets/inventory/cell-crocodile.png",
    "rect": [
      1775,
      209,
      132,
      121
    ],
    "timestamp": 2370
  },
  "Masterpiece «La Gioconda»": {
    "asset": "/assets/inventory/cell-gioconda.png",
    "rect": [
      1775,
      449,
      132,
      121
    ],
    "timestamp": 2370
  },
  "AVAC ID Card": {
    "asset": "/assets/inventory/cell-avac-card.png",
    "rect": [
      1645,
      449,
      132,
      121
    ],
    "timestamp": 2370
  },
  "Picked-up Hoverboard": {
    "asset": "/assets/inventory/cell-remote-control.png",
    "rect": [
      1645,
      569,
      132,
      121
    ],
    "timestamp": 2370
  },
  "88' Seoul Olympics Post Stamp": {
    "asset": "/assets/inventory/cell-seoul-stamp.png",
    "rect": [
      1481,
      209,
      132,
      121
    ],
    "timestamp": 2938
  },
  "Prof. Choi's Time... Whatever": {
    "asset": "/assets/inventory/cell-time-whatever.png",
    "rect": [
      1481,
      329,
      132,
      121
    ],
    "timestamp": 2970
  },
  "Seemingly Meaningful Paper": {
    "asset": "/assets/inventory/cell-meaningful-paper.png",
    "rect": [
      1481,
      329,
      132,
      121
    ],
    "timestamp": 3492
  }
};
export const REFERENCE_SHELF_BY_TITLE:Record<string,ReferenceShelfCard> = {
  "Strong Leg for Chippies": {
    "asset": "/assets/inventory/shelf-strong-leg.png",
    "rect": [
      336,
      307,
      212,
      200
    ],
    "price": 295,
    "timestamp": 285
  },
  "Flawless Shoulder Bag": {
    "asset": "/assets/inventory/shelf-flawless-bag.png",
    "rect": [
      1232,
      307,
      212,
      200
    ],
    "price": 500,
    "timestamp": 285
  },
  "Early Poster of AVAC": {
    "asset": "/assets/inventory/shelf-early-poster.png",
    "rect": [
      112,
      517,
      212,
      200
    ],
    "price": 70,
    "timestamp": 285
  },
  "Backpack Just Unwrapped": {
    "asset": "/assets/inventory/shelf-unwrapped-bag.png",
    "rect": [
      336,
      517,
      212,
      200
    ],
    "price": 375,
    "timestamp": 285
  },
  "Taxidermied Butterfly": {
    "asset": "/assets/inventory/shelf-butterfly.png",
    "rect": [
      1008,
      517,
      212,
      200
    ],
    "price": 275,
    "timestamp": 285
  },
  "Plain Sunglasses": {
    "asset": "/assets/inventory/shelf-plain-glasses.png",
    "rect": [
      1232,
      517,
      212,
      200
    ],
    "price": 350,
    "timestamp": 285
  },
  "Backpack of Soldier": {
    "asset": "/assets/inventory/shelf-soldier-bag.png",
    "rect": [
      1008,
      307,
      212,
      200
    ],
    "price": 75,
    "timestamp": 1010
  },
  "Fixie-made Bag": {
    "asset": "/assets/inventory/shelf-fixie-bag.png",
    "rect": [
      336,
      307,
      212,
      200
    ],
    "price": 850,
    "timestamp": 1010
  },
  "Picked-up Paperbag": {
    "asset": "/assets/inventory/shelf-paper-bag.png",
    "rect": [
      112,
      517,
      212,
      200
    ],
    "price": 300,
    "timestamp": 1010
  },
  "Triumphant Combat Boots": {
    "asset": "/assets/inventory/shelf-boots.png",
    "rect": [
      112,
      307,
      212,
      200
    ],
    "price": 275,
    "timestamp": 1010
  },
  "Bookmark": {
    "asset": "/assets/inventory/shelf-bookmark.png",
    "rect": [
      112,
      727,
      212,
      200
    ],
    "price": 900,
    "timestamp": 2370
  },
  "Doll of Me": {
    "asset": "/assets/inventory/shelf-doll.png",
    "rect": [
      112,
      307,
      212,
      200
    ],
    "price": 60,
    "timestamp": 2370
  },
  "Wooden Sculpture «My Dear Rabbit»": {
    "asset": "/assets/inventory/shelf-rabbit.png",
    "rect": [
      1008,
      307,
      212,
      200
    ],
    "price": 4000,
    "timestamp": 2370
  },
  "Painting «Happy Tears of a Crocodile»": {
    "asset": "/assets/inventory/shelf-crocodile.png",
    "rect": [
      1232,
      307,
      212,
      200
    ],
    "price": 700,
    "timestamp": 2370
  },
  "Masterpiece «La Gioconda»": {
    "asset": "/assets/inventory/shelf-gioconda.png",
    "rect": [
      1008,
      517,
      212,
      200
    ],
    "price": 1250,
    "timestamp": 2370
  },
  "Picked-up Hoverboard": {
    "asset": "/assets/inventory/shelf-remote-control.png",
    "rect": [
      336,
      727,
      212,
      200
    ],
    "price": 80,
    "timestamp": 2370
  }
};
/** Cell anchors measured against the original drawer; total cell crops include the frame. */
export const REFERENCE_INVENTORY_GRID={x:1645,y:209,columnStep:130,rowStep:120,width:132,height:121,columns:2,rows:5} as const;
