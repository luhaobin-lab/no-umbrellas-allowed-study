# Windows 1.0.5 Demo 的流程与经营运行时接入

本文只描述本次新增的程序范围。源资源存在、脚本能够解析、测试通过、真实浏览器完整游玩是不同证据；均不能单独证明原版所有场景与 UI 的 1:1 完成。

## 来源与入口

- 使用用户提供 Windows 1.0.5 Demo。Mac 0.2.5 仅为研究对照，不混用运行时规则。
- `scripts/research/build_runtime_campaign.py` 把解出的原始数据生成 `src/native-campaign-data.ts`：517 个 StoreEvent、4 个 Level、609 个物品的调度元数据。完整物品真值在物品模块。
- `campaign='demo'` 从 DAY 1、1000V 现金、1500V / 每日 1% Darcy 债务、空库存开始；采用包内 DAY 1—3 和 triggeredEvents 的真实事件表。
- `campaign='story'` 保留此前视频 DAY 6—11 对照切片。它不是包内缺失的 DAY 4—40 完整日程。
- `campaign='challenge'` 原起始现金 3000V，DAY 15，30 次收购尝试和 33 次潜在销售，5 次街道休息。原 ChallengeMode 最后另调用一次 `IO.tomorrow`，末尾三次销售在 DAY 31。

## 状态和所有权

`Game` 持有现金总账、库存、交易、原生物品实例、议价状态、剧情解释器、调度器及经营记录。动态交易保存在 `generatedVisits`，真实珠宝抽样结果随 `NativeItemInstance` 保存。恢复存档重建动态 visit 列表；旧视频切换来客会重新建立当前物品实例，不能沿用上一件的真值。

所有买卖与服务通过幂等 cashbook key 结算。双件销售按原物品真实估值比例拆分成交价，先检验两件均可出售，再以不同交易 ID 原子移除；延迟 tick 接受与主动接受共用一次结算。租赁只转移使用权，物品仍属于玩家、锁定到归还。

## 调度和剧情

`native-scheduler.ts` 按 Level 插入四次随机收购、潜在销售/租赁、触发事件、日末事件。损坏商店 >=3 时减为两次收购；触发倒计时对全部候选推进，再按原顺序选首个到期事件。

`native-story.ts` 执行原条件、分支、选择、Switch、随机组、上下文修改、CallableChunk、库存/现金/日志/日历动作及等待。对话、选择和等待可以保存/恢复。百分比余额动作采用原 C# 事件构造时的余额快照，而选择分支内部在选择发生时构造；正反分支的构造时机经独立回归。

原 `StoreEvents` / `LevelEvent` 提供 UseTools|ManageDisplay 基础交互范围，WaitGameplay 的位掩码是额外允许项，不是覆盖范围。特别许可最后 OR，再应用特别禁止。工具使用发送原 GameEvent 名；`PlayerAssertCard` 等字符串事件验证 payload，并消费一次。

呈现层的角色入场、走动、动画、淡入淡出、并发演出目前由主 UI 独立接入；解释器不会把跳过呈现当作完成原演出。

## 经营规则

- 每日顺序接入贷款利息、真实资产破产判断、周利润、物品老化、资产/余额历史、花寿命、租金和服务计数。破产以现金+真实库存资产 <=99 判断，不把债务净额替代原条件。
- 每日修理最多两件、只能使用一次服务；原无价值物品隔夜修好，挑战模式即时修好。修理更新实际物品卡及上架估值，修理中的物品不可出售或再次出租。
- 六种花的价格、寿命与已证 effects 接入；type5 花的文本声称“容易遗忘”，但这两份 Demo 的信念生成调用链没有对应效果，所以未编造额外效果。
- 贷款候选、额度、利率、周期、解锁，房租 200V / DAY31 后270V，举报奖励衰减、低举报周奖励、推荐位带来的客流均有原数据路径。
- 拍卖报名费、周次数、两天等待、锤价随机分支、手续费和取款状态已接入。保留源 `blue_national` 与实际 `blue_nationalhis` 不一致造成的分支差异。
- 租赁现在由实际 `@rental` 调度生成来客，而非街道任意重复点击提款。包括声望/价签门槛、请求概率和上限、最近五日接受率、前3位先嫌购买太贵、2—4天期限、真实租价区间、一次还价和接受/拒绝。完成租赁保留物品并增加租赁历史。

## 仍有明确范围缺口

1. **完整正式版日程缺失**：源包只有 DAY1—3 的 Level。517 个事件中存在的后期事件不等于后期 Level 的排序、触发与全局状态可达性已补全。
2. **挑战后期人格难度缺失**：包里没有 DAY15—29 Level 的 customerDifficulty；可运行挑战使用该 Demo 可证的人格池，不将其称为完整正式版挑战难度复刻。
3. **随机序列逐次等价未承诺**：高级高价/假货/强制伞/拍卖中点/挑战排伞等路径已映射并通过513条原DLL观察。原GUID选择用独立持久化均匀随机流替代，不承诺相同seed产生逐次相同序列。缺失的后期人格Level仍未补编。
4. **租赁归还演出**：实际归还/损坏/延迟/赔偿状态已接入；原每一种归还的角色台词与动画演出尚未逐项 UI 验收。
5. **策展UI验收**：原一般规则、9种注册选物、全部17种注册价格函数及2种成功effects已实现，2016条原DLL动作序列通过；engine真实选物/报价/回调/保存接口已接。Demo DAY2主UI选择/报价已通过实际浏览器三天流程；后期特殊场景和角色原池台词仍待验收，见`docs/handoff/engine-progression.md`。
6. **现金表示**：系统总账继续整数 V。估值核心保留 double、源概率/比例需要处保留 float32；包含非整数余额副作用的原版边界不能因此声称逐位等价。
7. **表现等价**：剧情解释器不是 Unity 演出系统；原动效、声音、镜头、台词停顿、场景全部 1:1 不在本次程序测试能够证明的范围。

## 可复跑验证

- `npm test`：核心状态、生成调度、真实 item/card 差分、真实 NPC 管线、现金守恒、保存/恢复、挑战30次和经营回归。
- `npx tsc --noEmit`：跨模块接口检查。
- `scripts/native-demo-browser-playthrough.mjs`：用真正的浏览器按钮、鼠标拖放、工具、公开估值报价、存档再读档走 DAY1—3；不直接调用 `Game` 改状态，不按录屏答案成交。
- 浏览器报告位于 `artifacts/native-update/demo-browser-frozen*/`。早期失败报告保留为缺陷证据，不能只看存在 report.json 便断言验收成功；最终成功必须明确 `completed=true`、无浏览器错误且附截图。

## 街道 29 个购买组件

新增 `scripts/research/build_runtime_street_purchases.py` 从全部 29 个 `StreetStorePurchase` 追踪真实 UnityEvent 目标，并按 GameObject 名解析 StreetEventDirector.Execute 对应的 StreetEventData。输出保留在 `reference/original-study/progression/runtime-street-purchases.json`，运行时为 `native-street-purchases-data.ts`。

`getStreetPurchases(storeId?)` 返回具体价格、动态价格上下文、可用性、已拥有状态和原始路径；`purchaseStreetProduct(id)` 执行购买。修理/拍卖使用 `selectStreetRepairItems(ids)` / `selectStreetAuctionItem(id)` 提供待处理库存，委托现有库存服务结算，避免双重扣款。原购买后的 Branch/Switch/Context/现金与日志动作由 `native-street-purchases.ts` 执行；原讲话文本保存在 `world.lastStreetPurchase.lines` 供 UI 展示。

严格区分 GEM 和 RepairShop。原入口条件：GEM 为早晨且 DAY<=5 或10—15；RepairShop 早晨 DAY>=9；HiddenV 早晨 DAY>=18；BestRoof 早晨 DAY>=12；CityChat 早晨 DAY>=21；服饰、理发、花店早晨开放。挑战模式覆盖其明确提供的维修、花和拍卖服务。

29 项逐件测试包括原价格、真正交易入账、上下文/物品状态、存档后重选造型不重复付费、锁定造型拒绝、现金不足无副作用、升级住房返还旧房半价与取消房租。仅这些购买 callbacks 的逻辑已覆盖；完整街道入店对话、首次入店/再次入店导演的选片时序和动画仍不能据此宣称完全等价。发型/服饰高级造型遵循已有 `.available` 上下文及 DAY34 之后原逐日解锁，而不是无条件开放全部层级。

最新完整浏览器记录：`artifacts/native-update/demo-browser-latest/report.json`，DAY3 completed=true，843 次实际 UI 操作，存档/读档成功，页面和请求错误 0。此记录验证商店内三天主线；后续 29 个街道购买接口由独立集成测试覆盖，不冒充其全部 UI 已逐个浏览器验收。

最新高级生成/策展改动后的控制器与接续验收说明：`docs/handoff/engine-progression.md`。最新实际浏览器三天验收位于`artifacts/native-update/demo-browser-curation-final2/report.json`：852次实际UI动作、22次手册拖卡、真实DAY2策展选择/报价、存档再读档通过，0浏览器错误。此前旧报告不能替代这次证据。
