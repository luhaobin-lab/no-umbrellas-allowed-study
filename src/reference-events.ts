/** Verified financial actions from the supplied video. Amount is signed cash movement.
 * unresolved-change entries have amount:null and MUST NOT trigger synthetic cash adjustments.
 * A source-frame asset is evidence, not an automatically executable action.
 */
export interface ReferenceCashEvent {
 id:string; day:number; timestamp:number;
 kind:'scavenge'|'interest'|'purchase'|'loan'|'repayment'|'registration'|'repair'|'fine'|'rule-change'|'unresolved-change';
 amount:number|null; screen:string;
 hotspot?:{label:string;key?:string;rect:[number,number,number,number]};
 asset?:string;rect?:[number,number,number,number];evidence:string[];
}
export const RECORDED_EVENTS: ReferenceCashEvent[] = [
  {
    "id": "day6-junkjunk-scavenge",
    "day": 6,
    "timestamp": 587,
    "kind": "scavenge",
    "amount": 13,
    "screen": "street-b2-junkjunk",
    "asset": "/assets/reference-events/day6-junkjunk-scavenge.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "587秒B2 JUNKJUNK西侧垃圾桶明确出现E Scavenge。",
      "590秒对白“…13U.”；591秒现金428→441。",
      "金额13是本次实际拾取结果，不代表每次垃圾桶固定产出。"
    ],
    "hotspot": {
      "label": "Scavenge",
      "key": "E",
      "rect": [
        775,
        622,
        70,
        85
      ]
    }
  },
  {
    "id": "day6-street-cut-cash",
    "day": 6,
    "timestamp": 596,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "street-east",
    "asset": "/assets/reference-events/day6-street-cut-cash.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "595秒B2走廊现金441；596秒画面直接转到B1 GEM附近且现金573。",
      "净变化+132，但没有看见这132对应的拾取/售卖操作；不能自动命名为Scavenge或直接发钱。"
    ]
  },
  {
    "id": "day6-darcy-interest",
    "day": 6,
    "timestamp": 704,
    "kind": "interest",
    "amount": -25,
    "screen": "day-summary",
    "asset": "/assets/reference-events/day6-darcy-interest.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "DAY6睡前现金573；DAY7起床704秒现金548，差25。",
      "此前借款面板明确Darcy Indebted500、Interest25U/1days；与每日利息吻合。"
    ],
    "hotspot": {
      "label": "Sleep",
      "rect": [
        1753,
        853,
        103,
        120
      ]
    }
  },
  {
    "id": "day7-horong-purchase",
    "day": 7,
    "timestamp": 738,
    "kind": "purchase",
    "amount": -50,
    "screen": "flower-shop",
    "asset": "/assets/reference-events/day7-horong-purchase.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "736秒花店Horong前显示E Buy(50U)。",
      "738秒红色−50U与余额548→498；744–748秒店主明确未来3天好运。"
    ],
    "hotspot": {
      "label": "Buy Horong (50U)",
      "key": "E",
      "rect": [
        574,
        644,
        90,
        115
      ]
    }
  },
  {
    "id": "day7-morning-cut-cash",
    "day": 7,
    "timestamp": 765,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "shop",
    "asset": "/assets/reference-events/day7-morning-cut-cash.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "764秒店内晨间广播后余额498；765秒直接进入Fixie-made Bag鉴定，余额398。",
      "净变化−100，没有看见给乞丐、缴费或另一笔成交；不把该缺口写成捐赠/税/罚款。"
    ]
  },
  {
    "id": "day7-street-items-cut",
    "day": 7,
    "timestamp": 1685,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "street-east",
    "asset": "/assets/reference-events/day7-street-items-cut.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "1684秒店内日终广播仍400；1685秒直接切到GEM外，余额480。",
      "同时右侧库存显示Picked-up Remote Control、下一帧Picked-up Hoverboard。",
      "发生街道拾物可以直接看到结果，但+80的实际触发动作未出现在已审帧；保留未确认，不能自动凭净差发80。"
    ]
  },
  {
    "id": "day7-darcy-interest",
    "day": 7,
    "timestamp": 1690,
    "kind": "interest",
    "amount": -25,
    "screen": "day-summary",
    "asset": "/assets/reference-events/day7-darcy-interest.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "DAY7夜间街道1685–1689现金480；1690进入DAY8店内现金455。",
      "Darcy500借款未偿清、每日利息25仍有效。"
    ],
    "hotspot": {
      "label": "Sleep",
      "rect": [
        1753,
        853,
        103,
        120
      ]
    }
  },
  {
    "id": "day8-executor-loan",
    "day": 8,
    "timestamp": 2182,
    "kind": "loan",
    "amount": 1500,
    "screen": "loans",
    "asset": "/assets/reference-events/day8-executor-loan.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "2178秒Executor面板Available1500、Interest450U/3days，鼠标在Get Loan。",
      "2182秒余额1225→2725，面板变Indebted1950。",
      "1500本金到账，同时将450期利息计入应付1950；不可误建成旧借款1950再加1500。"
    ],
    "hotspot": {
      "label": "Get Loan (Executor)",
      "rect": [
        1327,
        215,
        215,
        46
      ]
    }
  },
  {
    "id": "day8-darcy-payoff",
    "day": 8,
    "timestamp": 2526,
    "kind": "repayment",
    "amount": -500,
    "screen": "loans",
    "asset": "/assets/reference-events/day8-darcy-payoff.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "2524秒Darcy面板Indebted500，旁边Executor1950。",
      "2526秒出现红色−500；2528余额1851→1351，Darcy卡盖PAID。",
      "Darcy还清后新报价Available4000、Interest200U/1days，不是继续500额度。"
    ],
    "hotspot": {
      "label": "Pay Off (Darcy)",
      "rect": [
        1327,
        215,
        215,
        46
      ]
    }
  },
  {
    "id": "day8-night-cut-cash",
    "day": 8,
    "timestamp": 2538,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "shop",
    "asset": "/assets/reference-events/day8-night-cut-cash.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "2536日终店内现金1351；2538仍见日终广播及打开日历，但余额1584。",
      "净变化+233，已审画面没有对应触发动作，不伪造成拾取收益。"
    ]
  },
  {
    "id": "day9-renunciation-raised",
    "day": 9,
    "timestamp": 2781,
    "kind": "rule-change",
    "amount": 0,
    "screen": "shop",
    "asset": "/assets/reference-events/day9-renunciation-raised.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "2776–2778：I have no choice but to raise your Renunciation rate.",
      "2781：Your Renunciation rate is now 10%.",
      "本对话期间现金1451不变；这是规则变化，不是即时扣款120。"
    ]
  },
  {
    "id": "day9-officer-cut-cash",
    "day": 9,
    "timestamp": 2796,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "shop",
    "asset": "/assets/reference-events/day9-officer-cut-cash.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "2795执法者对白末尾现金1451；2796直接切邮票卖家，现金1331。",
      "净变化−120，没有可见付款或收据。不得标为已确认罚款。"
    ]
  },
  {
    "id": "day9-registration-fee",
    "day": 9,
    "timestamp": 2918,
    "kind": "registration",
    "amount": -1300,
    "screen": "stabilizer-office",
    "asset": "/assets/reference-events/day9-registration-fee.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "DAY6 Darcy要求去Stabilizer办公室取得Blue Plates，预告登记费1300（原前段对话）。",
      "2916秒在Stbl.Office与窗口人物交谈，2918秒红色−1300，现金2420→1120；对白“It is done. You are free to go.”。",
      "展示图改用2918.2秒，保留红色−1300且已完整显示“It's done. You're free to go.”，避免2918秒打字中途截断。"
    ],
    "hotspot": {
      "label": "Talk to Stabilizer",
      "key": "E",
      "rect": [
        883,
        343,
        248,
        233
      ]
    }
  },
  {
    "id": "day9-stamp-repair",
    "day": 9,
    "timestamp": 2962,
    "kind": "repair",
    "amount": -59,
    "screen": "repair-shop",
    "asset": "/assets/reference-events/day9-stamp-repair.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "T REPAIR柜台，选择88 Seoul Olympics Post Stamp。",
      "2958–2961显示Okay, good / I will come back again选择，2962红色−59，1120→1061。",
      "2968后物品条件从Fairly Damaged−60%改善为Slightly Damaged−20%，估值98→196。"
    ],
    "hotspot": {
      "label": "Okay, good.",
      "rect": [
        600,
        541,
        231,
        95
      ]
    }
  },
  {
    "id": "day10-fine-250",
    "day": 10,
    "timestamp": 3007,
    "kind": "fine",
    "amount": -250,
    "screen": "shop",
    "asset": "/assets/reference-events/day10-fine-250.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "3001–3002执法者明确“The fine is 250U.”，3003出现付款/不付选项。",
      "3006对白Great，3007余额1114→864；3008又可见250金额。"
    ],
    "hotspot": {
      "label": "I'll pay.",
      "rect": [
        600,
        541,
        231,
        95
      ]
    }
  },
  {
    "id": "day10-visitor-cut-cash",
    "day": 10,
    "timestamp": 3045,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "shop",
    "asset": "/assets/reference-events/day10-visitor-cut-cash.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "3044上一位时光装置顾客道谢，现金629；3045切换执法者时余额589。",
      "净变化−40，付款动作未显示；下一条罚款威胁后来明确免除，所以这40不是该段已确认罚款。"
    ]
  },
  {
    "id": "day10-fine-waived",
    "day": 10,
    "timestamp": 3055,
    "kind": "rule-change",
    "amount": 0,
    "screen": "shop",
    "asset": "/assets/reference-events/day10-fine-waived.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "3055–3056执法者说“Wait. I changed my mind. Don’t mind the fine.”。",
      "随后要求所有相关对话保密，禁止转售Yujin Oh相关物品并要求扔进垃圾场。",
      "3045–3085余额一直589；没有再次缴纳罚款。"
    ]
  },
  {
    "id": "day11-executor-payoff",
    "day": 11,
    "timestamp": 3398,
    "kind": "repayment",
    "amount": -1500,
    "screen": "loans",
    "asset": "/assets/reference-events/day11-executor-payoff.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "3396面板Executor Indebted1500（已不含前述450利息），玩家点Pay Off。",
      "3397现金4001→2501，3398红色−1500与PAID印章。",
      "还款发生于兔子雕塑卖出3303之后；不能把净增1803当作雕塑卖价。"
    ],
    "hotspot": {
      "label": "Pay Off (Executor)",
      "rect": [
        1327,
        330,
        215,
        46
      ]
    }
  },
  {
    "id": "day10-day11-blackcard-transition",
    "day": 11,
    "timestamp": 3133,
    "kind": "unresolved-change",
    "amount": null,
    "screen": "street",
    "asset": "/assets/reference-events/day10-day11-blackcard-transition.png",
    "rect": [
      0,
      0,
      1920,
      1080
    ],
    "evidence": [
      "3096秒DAY10货架现金840；3097–3132是全黑叙事卡，未显示任何现金动作。",
      "3133恢复DAY11街道现金460，差−380。",
      "Executor在DAY8借1500、利息450/3days；DAY11还款面板债务1500说明450利息已清，但付款时点未显示。",
      "不能凭净差反推不存在于画面里的+70拾取，或把−380全部当利息。"
    ]
  }
];
