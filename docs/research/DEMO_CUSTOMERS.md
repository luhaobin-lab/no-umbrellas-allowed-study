# 官方 Demo 顾客身份、信念与剧情议价取证

取证日期：2026-09-21。官方来源：[作者 itch.io 的 No Umbrellas Allowed 页面](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)。本地官方包 `reference/research/official-demo-1.0.5-windows.zip`，SHA-256 `026da208cdf7fdec6e09491f1262d271af3dd67a571ce8bf583f73435f9fb602`，版本标识 `1.0.5 Demo`，Unity 2020.3.11f1。录像也显示 1.0.5，但这不能证明 Demo 与完整版的全部分支一致。

## 覆盖结果

从 `resources.assets` 解出 517 个 StoreEvent、54 个 Character、13 个 LineSet、4 个 Level。Level 仅有 day01、day02、day03、triggeredEvents，未获得 DAY6–11 的完整调度表；资源中仍保留这些日期的明确 StoreEvent。匹配条件同时要求：事件 ID 的日期、原生 Item ID、录像的玩家买入方向一致。没有按头像或泛化物品名推断。

53 个视频来访：10 个匹配脚本交易、33 个交易人格未知、10 个剧情/赠送条目不赋交易人格。匹配的 10 个中有 6 个 Active、4 个 WishyWashy。`day7-fixie-bag` 的录像 Fixie 证据与本表独立；本表没有找到原生身份关联，因此仍为 unknown，并不否认已知录像事实。

| 来访 ID | StoreEvent | Item ID | 人格 | 脚本 Hook |
|---|---|---|---|---|
| day6-backpack-soldier | D06_brand_after | EE_02 | Active | D06BrandAfter |
| day7-crabgrass | D07_choi | plantPot | WishyWashy | D07Choi |
| day8-gioconda | D08_art_hue | monalisa | Active | D08ArtHue |
| day8-avac-card | D08_avacCard | AVACcard_01 | Active | 未登记专属 Hook |
| day8-doll | D08_yeongi | YGdoll | Active | D08Yeongi |
| day8-rabbit | D08_art_after | StandingRabbit | WishyWashy | D08ArtAfter |
| day8-fantastic-hoverboard | D08_unwillingHusband | VT_2073_solHan | WishyWashy | UnWilling |
| day9-time-device | D09_timeCinema | tCinema | Active | 未登记专属 Hook |
| day11-meaningful-paper | D11_private_after | presidentSpeech | WishyWashy | D11PrivateAfter |
| day11-hoverboard-display | D11_preAvarice101 | FZ_2076 | Active | 未登记专属 Hook |

完整指针、原生 Character ID、默认顾客卡、所有未知行：[demo-customer-facts.json](demo-customer-facts.json)。可用 API：`src/demo-customer-data.ts` 的 `getDemoCustomer(visitId)`。Character ID `random_female_1020` 等是明确的源模板 ID，并非确定某张随机脸；`yeongi`、`profchoi` 是明确人物 ID。

## 顾客默认估价、初始开价与忙碌状态

`CustomerAttribute.Personality` 的原枚举为 0 WishyWashy、1 Active、2 Cautious、3 Emotional、4 Fixie。源中没有名为 patient 的人格；现项目 patient 是明示的本地兼容策略，不应标为已验证身份。

普通 StoreEvent 购买流程调用 `CreateHaggle.createHaggle`，传入事件人格和 `CustomerDefaultAssumptions`。这组卡是顾客的原始信念，可能是错的。例如 `D09_timeCinema` 顾客默认卡为 `gray_machine, blue_fairlydmg, green_plastic`，物品真实材质为 Glass。不能以真实属性或玩家最后一组卡覆盖默认顾客卡。

`createHaggle` 在初始化时添加 `NewPriceStamp(estimatePrice(customer.info))`；它是顾客估价基准，不能直接当作 `CustomerSuggestPrice` 的开价。本次没有恢复这些 Intro 的完整 Odin 控制流，因此所有 `initialAskingPrice` 保持 null，也不从录像成交价赋值。

初始 modifier 明确为 None。随机 Busy 等 modifier 是 `createHaggleWithIntro` 的另一条生成流程；10 个 StoreEvent 不经过这个随机入口。表中 `initialModifier='none-at-haggle-construction'` 只陈述这个构造点，不声称未解码 Intro/后续事件永远不能修改状态。

7 个在 DeclarativeList 中注册了 Hook 的事件会清空普通人格的 `onTick` 管道。因此不可给这些剧情交易套普通 Active 的催促/离场倒计时。`normalIdleTimers=false` 表达这个已证差异；不是已实现全部剧情。

## 已实现的两组精确数值分支

`src/story-negotiation.ts` 导出 `storyPriceResponse(visitId, { offer, customerValue, priorOffers })`。输入 `customerValue` 必须是顾客当前信念卡估价。返回是否处理、accept/decline-offer/decline-deal、原分支 ID。此辅助函数不产生录制金额，也不把真值当顾客估价。未实现的已知 Hook 明确返回 `implementation='unimplemented-script-hook'`。

**D07Choi / 花盆**，依次判断，顺序不能交换：

- 报价 ≥ 顾客估价 × 2：第 1 次 `p100_1` 拒价，第 2 次 `p100_2` 拒价，第 3 次 `p100_3` 拒价并离开。注意分支名 p100 不代表固定阈值 100。
- 否则报价 ≥45：接受，分支 `p45`。
- 否则报价 ≥30：接受，分支 `p30`。
- 否则拒价并离开，分支 `low`。
- 独立卡片 Hook：`blue_fakesign` 被接受，触发 `c`。本辅助函数只处理报价，不实现该卡片 Hook。

**D08Yeongi / 玩偶**，依次判断：

- 报价 ≥ 顾客估价 ×2：拒价并清理当前 context，`300ormore`。名字也不代表固定 300。
- 否则 ≥顾客估价 ×0.9：接受，`a`。
- 否则 ≥顾客估价 ×0.65：接受，`b`。
- 否则拒价并离开，`c`。
- 前三条清理 context；引擎集成需要保留这项行为。剧情结尾还读取购买价格（包括 ≥250 的条件），此辅助函数没有把剧情结尾/奖励判定一起实现。

测试涵盖 30/45/2× 边界、第三次过高报价离开、65%/90% 边界、顾客估价变化、同物不同 NPC 不继承人格。`tsx --test src/story-negotiation.test.ts` 5/5 通过；`tsc --noEmit` 通过。

## 剧情鉴定状态机及其覆盖

后续已新增 `src/story-appraisal.ts` 和 14 项序列测试，实现下面列出的 D06BrandAfter、D08ArtHue、D08ArtAfter、D11PrivateAfter、UnWilling 可证实分支，及花盆假签名卡分支。下列路径/行号仍是原始取证入口。引擎/UI 集成须单独验证；辅助函数通过测试不等于所有事件对话和动画已完成。

稳定接口：

- `createStoryContext(visitId)`：创建可保存、可还原的独立剧情状态。
- `onStoryCard(context, { nativeCardId, hidden, correctCard, customerCardIds, playerCardIds })`：返回新 context、handled、acceptBelief、leave、allowHidden、branch、clearContext、partial。
- `onStoryOffer(context, { amount, customerValue, customerCardIds, playerCardIds, playerOffers, customerOffers, missingCount })`：返回新 context、handled、outcome（refuse/leave/null）、branch、clearContext、partial。未拦截的报价继续已实现的 `storyPriceResponse` 或普通人格流程。
- `onStoryDecline(context, { customerCardIds, playerCardIds })`：处理玩家放弃交易的 Hook，`failImmediately=false` 时只是剧情 chunk 分支，后续事件调度仍须继续。

调用顺序经源 `IO` 核验：公开卡先从私槽移除、写入 PlayerSuggestCard context，再调用公开卡 Hook；拒绝不进入顾客信念。隐藏 Hook 在新卡写入前运行，返回 handled=true 时不执行默认隐藏。所以 `playerCardIds` 是操作前私槽，`customerCardIds` 是已被顾客接受的公开卡，不可把被拒标签混入。`allowHidden=false` 必须阻止该次落位。

原作在调用报价 Hook 前写入当前 PlayerSuggestPrice。此 API 接收旧历史数量，在内部加 1；UnWilling 检查整个当前 context 中双方报价数，而非只计算玩家点击，也不是自动按每个 PriceStamp 重置。clearContext=true 才需重置与其对应的外部对话记录。

`missingCount` 对应 `EvaluateInfo.numMissingCard`，它数的是 `EvaluateAppraisal.haggleAppraisalStatus` 中的 MissingCategory 数量，不能按同类别里的多个 missing card 重复计算，也不能使用 unknown 事实数。UnWilling 在正确性或 missingCount 未知、估价非正而未确认 ratioOf 行为时返回 partial=true，不编造原作判定。

背包证明材质错误后，残留的两个 Fake 管道也已实现：笼统 Fake 再次提出会 `materialAfter` 拒绝；重新修改已讨论类别按此前卡是否仍被顾客认可、是否在物品 ReferenceCards 中、当前卡是否真实决定 `ToSuggestedWrongFakeGreedy`。函数保留上次 context clear 后的玩家建议记录；完整引擎如插入额外 CustomerDeclareCard，可用可选 `discussedCardId` 提供原 context 中该类别的最近建议。不能把这种历史依赖简化成“曾看过该工具”。

D11 private hide 的已验证可达初始布尔值为 false/false；原逻辑检查操作前私槽是否已含两张蓝卡。按源调用顺序，第二张刚准备隐藏时还不触发；之后再尝试隐藏时才触发 `onHide` 并移除隐藏 Hook，且该次标签不写入。这个反直觉顺序已作为回归测试保留。

运行时 message 是简短英文意图转述；branch 是原分支 ID。尚未声称原对话逐字还原，Odin Intro/Outtro、chunk 内副作用与动画仍需要外层事件调度。14/14 新测试覆盖真假材质证明、独立拒绝次数、隐藏证据不自动变成公开估价、隐藏前拦截、连续报价、放弃交易分支；与此前 5 项报价测试合计 19 项。

## 源分支清单

以下依据静态算法整理，独立表达事实；没有将反编译代码放入项目。它们要求独立状态机，不能用“顾客讨价还价系数”替代。

**D06BrandAfter / 士兵背包**：第一次、第二次直接报价分别触发 `price`、`price2` 并拒绝，第二次之后移除该初始报价 Hook。`green_fakeBrand` 先被反驳，进入需要理由的状态；`green_fakeBrandText` 进入错误理由状态；`green_fakeBrandMaterial` 被接受，移除报价/卡片 Hook，并替换 Fake 管道；`green_canvas` 是否接受取决于前述状态。笼统标 Fake 不等同于已举证 Wrong Material。源临时文件 `/tmp/nua-D06BrandAfter.cs`：`price` 368、`ch` 390、`dh` 476、`customize` 485。

**D08ArtHue / 蒙娜丽莎**：未给出通过的艺术品质前，报价全部 `hueStop` 拒绝；`green_art_good` 被接受后移除报价 Hook；`green_art_worst/bad` 的前两次为 `low/twice`，第三次愤怒离开；`green_art_artist/best/deceased` 被反驳为 `high`。源 `/tmp/nua-D08ArtHue.cs`。

**D08ArtAfter / 兔雕**：顾客信念里没有 `green_art_best` 或 `green_art_deceased` 时所有报价被拒，触发 `art` 并清 context。`green_art_worst/bad/good` 共用次数，前两次反驳，第三次离开；`green_art_artist` 另有计数，第三次离开；`green_art_best` 前两次被反驳，第三次接受并移除卡 Hook；`green_art_deceased` 直接接受。玩家直接放弃时还区分是否讨论过 art。源 `/tmp/nua-D08ArtAfter.cs`：`ph` 211、`ch` 223、`dh` 305、`customize` 314。

**D11PrivateAfter / 有意义的纸**：若玩家尚不知道 National History 或 Popularity，初始报价前两次被反驳为 `more`，其后交回普通议价。两个蓝卡的公开与隐藏均有 Hook，第一次可能遭 Hue 打断，后续分支接受；原逻辑针对 `blue_pop` 分支读取 x（不是按直觉读 y），应逐步验证原行为，不能自行“修正”成对称的两套计数。隐藏两张卡时还有 `onHide` 分支；放弃交易也检查顾客/玩家两侧对两张卡的认识。源 `/tmp/nua-D11PrivateAfter.cs`：`ph` 233、`hh` 256、`ch` 297、`dh` 351、`customize` 360。

**UnWilling / Fantastic Hoverboard**：一张 `EvaluateAppraisal.isTrueCard` 为 false 的卡直接拒绝并质疑专业能力后离开。报价时顺序检查 `HaggleContextPrice.timeOfferedEachOther(context)>1`、`EvaluateInfo.numMissingCard(h)>=2`、`EvaluatePrice.ratioOf(p, customer.info)>1.5`，满足任一均拒价并离开，否则交回普通人格流程。不能把其中的双方报价上下文计数替换成单纯玩家点击次数，也不能把专用 missing-card 检查直接等同于当前审计 unknown 项目数。源 `/tmp/nua-UnWilling.cs`。

## 明确排除的错误关联

- `D09_umbrellaForFree` 指向 `umbrella_05_04`，但它是玩家购买事件；录像 `day9-black-umbrella-sale` 是玩家出售，不可只因同物就赋 Active。
- `D07_avacCard` 指向 AVACcard，`D08_avacCard` 指向 AVACcard_01，是不同定义；不能只按 AVAC Card 名称合并。
- `D10_yeongi` 指向 YGdoll_01 且是 Visit；不能借来反推 DAY8 YGdoll 的卖家后续交易。
- 销售同一件库存物品时，顾客与之前带来物品的人独立；所有 resale 不继承原卖家人格。
- 未解出 DAY6–11 完整 Level schedule，也未重现 process-wide Random 状态；未知人格、忙碌 modifier、初始开价仍是数据缺口。

## 临时原始取证位置

`/tmp/nua-customer-assets/{StoreEvent,Character,LineSet,Level}` 保存原始解码 JSON（含 Odin bytes）；产品只使用自己的规范数据。枚举见 `/tmp/nua-domain-types.cs`，构造流程见 `/tmp/nua-createhaggle-customer.cs`，事件到 Hook 的精确映射见 `/tmp/nua-declaratives-map.cs`。这些临时文件不属于发行物，也不是完成实现的证明。
