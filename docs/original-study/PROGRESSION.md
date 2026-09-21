# 原文件：调度、剧情副作用与经营规则研究

本报告研究用户提供的两个 Demo，不把它们拼成一个虚构的“完整版”。Windows 的内部版本为 **1.0.5 Demo / Unity 2020.3.11f1**；Mac 为 **0.2.5 (Demo) / Unity 2019.3.6f1**。原程序未修改，研究数据和自写探针放在 `reference/original-study/progression/`，本轮未修改产品 `src`。

## 可复查的交付

- [调度与对象目录](progression-catalog.json)：两版本分开；对象 ID 为“序列化文件名:pathId”，不能只按名字或数字匹配。
- [Windows 分支动作/状态依赖图](../../reference/original-study/progression/semantic-actions-windows-1.0.5-demo.json)、[Mac 对应图](../../reference/original-study/progression/semantic-actions-mac-0.2.5-demo.json)：每个动作保留原条件、选择、随机池、CallableChunk、参数及对象位置。
- [Windows 全节点目录](../../reference/original-study/progression/catalog-windows-1.0.5-demo.json)、[Mac 全节点目录](../../reference/original-study/progression/catalog-mac-0.2.5-demo.json)：链接原始字段、完整 Odin 树和外部对象引用。
- [提取完整性与复跑验收](../../reference/original-study/progression/verification.json)：Windows 2668/Mac 779 个研究对象；1262/705 个 Odin 二进制块逐个重解，差异0；187条原 DLL 观察、129个独立断言全部通过。
- [原 DLL 直接调用结果](../../reference/original-study/progression/direct-dll-results.json)：自写 C# 探针调用发布 DLL，验证经营边界；拍卖随机样本与确定性断言分开。
- [经营规则事实表](../../reference/original-study/progression/rules-facts.json)、[与现有游戏的差距](progression-parity-gaps.json)。

“对象解码完整”“分支动作列全”“已理解该分支语义”“原游戏真实游玩验证”“当前复刻已实现”是五种不同状态。本轮完成前两项的主要资产覆盖，并对下列规则完成静态调用链/部分动态数学核验；没有把每条条件都跑成原游戏中的实际路径。

## 1. 两个包实际只能从新游戏进入前三天

两版 `Assembly-CSharp.GameManager.GotoIngame()` 都执行 `Enumerable.Range(Level, 4-Level)`，因此从 DAY1 开始只安排 DAY1、2、3。Windows 随后播放 `gameover_demoend`；Mac 随后切 `DemoFinishThanks 1`。

两版 `Level` 资产均只有 `day01`、`day02`、`day03`、`triggeredEvents`。Windows 有 **517 个 StoreEvent**，Mac 有 **284 个**，但大量后期脚本的存在不等于有后期关卡日程。

| 资产调度分类 | Windows 1.0.5 | Mac 0.2.5 |
| --- | ---: | ---: |
| 被现存 DAY1—3 Level 直接引用的不同 StoreEvent | 34 | 32 |
| 现存 triggeredEvents 候选池 | 92 | 27 |
| 未被上述 Level 资产引用的 StoreEvent | 391 | 225 |

第三行不能直接写成“不可达”：某些资产还可能被硬编码 Resources 路径、场景、UnityEvent 或运行时事件调用。第二行也不能写成“都会播放”：它们还需要条件、计数器、历史和场景状态。

Windows 的全部早期日程已经展开在目录里。例如 DAY3 主序列是材料教程、Bokho、材料教程后续、随机槽、Darcy/Nari、广播、不愿卖物品的儿子、Nari、随机槽、Darcy、随机槽、Cfriend、Stabilizer、随机槽；开店前另有广播，闭店后 Hanja 与广播。每一段引用保留原 pathId，不能凭录像的 53 位访客去生成这些真实日程。

## 2. 一天如何生成顾客

源符号：`LevelEvent.GenerateStoreEvents`、`GenerativeCustomer.todaysCustomer`、`Pawnshop.eyeShopping`、`Pawnshop.shouldSaleEventOccur`、`PotentialTriggeredEvent`、`PotentialRentalEvent`。

1. 普通收购数在 Windows 1.0.5 核心里是 **4**；`storeBrokenLevel>=3` 时为 **2**。直接 DLL 边界验证通过。它不是“服务越快客人越多”，也不是把声望百分比直接乘来客数。
2. 这几个普通收购按 GUID 随机排列轮次分配到 Level 中的随机槽；一个随机槽可以包含多个收购。
3. 主序列各项之间插入一次潜在出售、一次潜在租赁；这些子序列之间再插入触发事件检查。
4. 末尾刷新未完成的触发倒计时、强制安排当天尚未处理的租赁归还，再执行闭店后事件。
5. `progress` 按事件检查点推进；时钟/画面停留秒数不是买卖访客生成器。

潜在出售使用累计 `visitors`：小于1不来；[1,2)时 `Random.NextDouble()>0.6` 才来；大于等于2必来，入店扣1。普通浏览时累加的基础值 DAY1 为0.2，其他日为0.4；再加合格陈列数量/64、类型多样性奖励0.1（超过8种）、鉴定 tier≥2 的0.1、推荐 tier≥2 的0.1、与推荐位真实类别相同的每件0.05，和花奖励。`storeBrokenLevel>=2` 或最高举报者状态会将增量减半。挑战模式使用另一个固定+1方法。

触发事件按照 `triggeredEvents.Schedule` 的先后选择第一个可播者。所有候选在一次检查中均计算条件/推进计数；被挑中前不是完全静止。`TriggerCountdown=0` 可即时触发；非零计数达到阈值后可播。条件后来为假时，`TriggeredCanCancel` 决定清零取消还是继续倒数。日终还会继续刷新仍在倒数的事件。已经播过且不允许重复的事件跳过。

## 3. 不是只有文本：剧情动作已完整展开

Windows 资产中至少含 2627 个 Odin `SetPersistentContextEventData`、641 个 `AdjustBalanceEventData`、409 个 `StockItemEventData`、20 个 `UnstockItemEventData`、142 个 `ExecuteCommandData`、12 个 `FinishPurchaseHaggleManually`。这里统计动作节点，不是独立可玩剧情数；同一状态可以被多处写入。

每条展开记录包含原条件、条件为真/假、玩家选项 UUID、Switch 优先顺序、随机池下标、CallableChunk 名称和参数。内部引用已经还原检查，没有把 `$ref` 跳过。字符串表达式保留原样，不拿 Python `eval` 猜测游戏表达式语义。

关键解释：

- `BranchingEventData` 在执行到它时求值，而非提前一次求所有条件。前面的动作会改变后面的条件；祖先入口条件与子条件不能当作同一时刻的逻辑合取。
- `SwitchEventData` 只执行第一个真条件；不是同时执行所有真分支。`RandomEventData` 对池做 GUID 排序取第一项，没有资产权重字段。
- `TextChoiceData.onSelect` 才执行选中的后续动作；不能把所有选项奖励都累加。
- `CallableChunk` 是由运行时按名字查找的回调块；存在本身不会自动播放。
- `SetPersistentContextEventData` 的 `Level.*`/`Day.*` 写当前 Level 作用域，`Prefs.*`/`IPrefs.*` 写偏好作用域，其余写持久状态。它和 `SetContext.RunSetContext()` 的**字面字符串**写入不同，后者另有表达式版本方法。
- `AdjustBalanceEventData` 的绝对值可加可减；百分比模式以构造该 GameEvent 时的余额算调整值，不能随意改成成交时的最新余额百分比。
- 命令枚举0—6依次是中止角色事件、取消议价、清鉴定表与议价上下文、修复店面、结束街道漫游、禁止角色自动离开、终止本日店内事件。

先前缺失的拒绝教程块现在可直接查：`D06_brand_after/playerGiveUpWithoutFakeMaterial`、`D08_art_after/playerGiveUpWithoutArt`、`D11_private_after/playerGiveUpWithoutPopHist` 在资产里主要是表情/指导台词；**是否阻止离开由调用该块的特殊议价 Hook 返回行为决定**，不能因为块内没有扣钱就把 Decline 当成普通结束。完整 319 个 Windows CallableChunk 均保留原树；其他块包含持久标志、强制成交/失败和交易后果。

实例：`afterBroke`（resources.assets:23874）先调用 `Run.estateIgnoringLoans` 更新判定，再复核 `failByBroke`，有中止角色事件分支和 `gameover_broke`；`afterFailToPayRent`（24238）在前置条件成立时按日期增加400/540并设 `darcyRentHelp`；第二次对应事件24239可进入破产结局。不能把它们简化成统一负余额即死。

## 4. 库存、推荐位和出售资格

源符号：`ItemForSale.isForSale/itemForSaleMap`、`Pawnshop.insertItemInDisplay/removeItemFromDisplayById/setItemPrice`、`Reputation.*`。

实例必须真的在库存中，且非出租、非拍卖、非锁定，`forSale.<itemID>` 未明确禁售，才通过普通出售资格。价签和货架位置与物品归属分开。当前日新买物品还有一层生成候选过滤：当货架当天新进货少于 DAY1 的3件、其他日的4件时，优先过滤到至少放过一天的物品；达到数量阈值才放开今天新货。此处是原潜在出售候选规则，不表示玩家 UI 禁止当天上架。

Expertness/Attractiveness/Wittiness 的原始值范围、分段百分比、首次检查、推荐评分详见已核验的 [DEMO_REPUTATION_FACTS.md](../research/DEMO_REPUTATION_FACTS.md)。复核后仍有效：raw不等于显示百分比；Fixie 跳过通用收购满意评分；买家的首次鉴定评价可能发生在成交前；推荐评分看真实卡，修复品是−2而非必定禁放。

每日 `IO.tomorrow` 还会改变 `junkpotential`、`superstitious`、`reput_hurt` 等卡状态以及已有库存声望卡。自写探针保留合成卡试验，但这些合成卡不能代替所有原生卡的实际老化测试。不能把买入时估值永远冻住，也不能把玩家鉴定表当真实物品事实。

## 5. 贷款、破产与跨日顺序

核心贷款、提前还款、逾期、产品阶梯已经在 [DEMO_ECONOMY_FACTS.md](../research/DEMO_ECONOMY_FACTS.md) 中用 DLL 验证。本轮补充以下结论：

- Windows 再借 Darcy：`max(500,trunc(净资产/200)*100)`，5%/1天；**Mac 同公式但2.5%/1天**。
- Windows Bluebird capital 后续额度8000/12000/17000/23000，10%/2天；**Mac 对应2%/1天**。不得混用。
- Windows 净资产达到10000会尝试开启 capital；至少5个资产记录、最近5个资产变化平均≥300时尝试开启 central。均由 `IO.tomorrow` 调用，不是按录像DAY11强制出现。
- `CheckBroke.checkBroke` 用**忽略贷款的资产**：`trunc(现金+真实库存价值) <=99` 标 `failByBroke=true`。现金0而库存真实值100不会因此破产；现金99.9且无货仍失败。原 DLL 边界已验证。
- `IO.tomorrow` 的顺序是先当日贷款付息，再破产/周收益/逾期检查，再库存变化/当日资产记录，再日期+1，再报告/花/房租/周重置/新贷款等。把日期先加1再按旧的到期逻辑扣息会偏一天。
- 房租：`Home.type<1 && payingRent` 才收，日期<31为200，此后270。核心 `checkRent` 在付不起时设 `failToPay` 并把余额置200/270，后续剧情再救助/失败；这是原DLL实测行为，不是建议复刻任意补钱。完整实现必须连接后续事件，不能单独拿这一段运行。
- 多笔利息用初始现金重复判断可能产生负余额，是原作已确认缺陷。当前产品用了剩余现金逐笔判断；这属于有意修复，不能计作1:1。

## 6. 维修是两件一批加一次服务状态

`RepairShop.fixable` 看玩家卡是否为 Fairly/Valueless 且未修复/全毁。`getCase/repairPrice` 则看真实卡：Fairly 为 `trunc(50+真实现值×0.1)`；Valueless 为 `trunc(50+真实现值×0.2)`；真实不属这两类为50元纠正卡。维修完成为 Slightly Damaged + Repaired。

UI 每次最多选择2件。原场景 `level58:2362` 在成功委托后设 `Repair.boughtToday=true`、`Repair.availableToday=false`，调用 `RepairShopManager.TryRepair`；`level58:2269` 的进入条件要求 `Repair.availableToday`，可先领取隔夜货。因此“两件一批”和“该服务访问后的禁用状态”均已找到。每天/每次场景载入如何重置必须遵循 `Initialization`（2535）与街道加载，不能只在报价函数中写一个全局每天2件常数。

隔夜槽从货架移除、申请时保存原实例，取回才 resolve。挑战模式直接 resolve 隔夜项目。费用由街道购买组件先付，维修状态函数不能再扣一次。

## 7. 花店：价格、期限与实际效果

原场景提供六个购买组件，通常随机供货只从1—5选且排除现有槽位/持有花。第6种的组件存在不代表普通随机花池会抽到。

| type | 名称/静态价格 | 已定位规则 |
| --- | --- | --- |
| 1 | Horong / 50 | Active/WishyWashy 首次报价流程插入 flowerPipe；具体概率顺序见NPC研究，不能理解为所有客人固定打折 |
| 2 | Bomi / 60 | `Flower.active` 时普通浏览 visitors 增量+0.3 |
| 3 | Dora / 50 | 非Fixie使用花版本的四类催促分支；ByTime窗口600—799 ticks，普通450—599 |
| 4 | Adam / 80 | 有匹配的一级真实损伤与顾客认知时，在成交路径改变真实物品与鉴定表 |
| 5 | Hoochoo / 70 | 购买/3日期限/外观存在；完整IL与所有Odin引用复核未找到文案所说的遗忘收益，当前包强烈支持文案与实现失配，详见下文 |
| 6 | Hari / 130 | 浏览+0.3和花催促分支都识别type6；普通供货池不含6，解锁路径须另查 |

买花把 `Flower.life` **设为3**，不是加3；日检查递减，到0清type。购买后场景设 `Flower.boughtToday=true`，当次可购买事件禁用。

Adam已确定的一级条件变换：Valueless→Fairly；Fairly→60% Slightly /40% Valueless；Slightly→60% Perfect /40% Fairly；Perfect→Slightly。前置要求只有一级损伤且顾客所知损伤与真实损伤相同；不能把效果用到所有赝品/特殊损伤。

### Hoochoo 查漏结论（本轮追加）

[完整跨层证据与复跑脚本](../../reference/original-study/progression/hoochoo-audit.json) 沿购买、全局状态、信念生成、议价管线、顾客介绍和场景回调复核了两版全部游戏程序集 IL；Windows 1881/Mac 946 个 Odin 所有者文件全部检查，其中1275/718个非空二进制块完整解码，0错误。没有只在一个函数里搜索名字就判定无效果。

- 原英文只说“Hoochoo会玩弄人的记忆，让人至少忘记一件事”，没有给出NPC删卡概率/数量公式。不能自行补成每客人随机少一张卡。
- Windows购买链实际是 `level58:2408 → StreetStorePurchase 2436（70）→ success Execute → 2196 browsingItem==5分支 → SetFlowers.BuyFlower(5) → Scented.buyFlower`；整数参数确为5。结果是type=5、life=3、购买记录和售罄标志。这部分有实现，并非整个花对象都属死代码。
- 所有直接读取 `Flower.type` 的游戏逻辑已经列全：1进入Active/Wishy报价特例；2/6增加浏览；3/6改变催促；4改变损伤；其余是供货排除/补货、购买和寿命。**没有type5遗忘分支**。C#层没有直接读取该状态的额外数值逻辑；它的额外消费通过场景表达式完成。
- 全场景对type5的读取只有 `level9:2367/2368` 的寿命阶段显示，控制的是renderer；行为数组和事件回调均为空。其他type5引用是商店购买/售罄显示，没有接到NPC信念修改。
- `GeneratedPurchaseEvent → GenerativeInfoscreen.generateInfo → CreateHaggle.createHaggleWithIntro → modifier/intro` 链也没有另一条花5读写入口。Mac旧版各游戏程序集没有任何Flower上下文字面量，不能用旧包补出该收益。
- 正常供货在DAY6前固定为1/2/3，而提供的Demo只调度DAY1—3。因此Hoochoo组件的存在也不等于能从这个Demo的新游戏普通流程买到它。

结论：**对这两个提供的包，最符合已检查证据的解释是Hoochoo的购买/外观系统存在，但所描述的遗忘收益没有接入已扫描的托管逻辑与资产回调，属于文案/实现失配证据；不是一条已经证实有效、只是尚不知道概率的机制。** 我们没有运行原Unity完整场景，没有穷尽证明反射拼接状态字符串或原生插件不可能参与，也不将此推到后续零售版。未采用“一次测试没差别所以没有效果”的论证；这条生成链还用 `Guid.NewGuid` 排序，仅重置 `GeneralUtils.rnd` 不能控制全部随机。

## 8. 租赁的全部主分支

源符号：`Rental`、`RentalStartEvent`、`RentalReturnEvent`、`RentalHistory`、`PotentialRentalEvent`、核心 `Rent`。

- 开始资格为 `AppraisedTier+TrustedTier>=8`，不是两个显示百分比相加。物品在货架、有价、未出租/维修/拍卖/锁定、玩家判断至少Fairly或更好，并满足当前最低价。
- 默认每日至多2次租赁请求，单次潜在检查概率0.6，最低价500。首次请求已过3天后：近期接受率≥0.3时上限3；≥0.55时上限4、概率0.7、最低价350；≥0.8时上限5、最低价250。
- 初次请求已过3天、记录≥8且总接受率≤0.1时永久设 deactivated；记录≥5且≤0.2会设 inactive（它的进一步叙事效果不能等同直接停系统）。
- 2/3/4天租金系数分别 **0.34/0.50/0.67**，乘“当前展示估值和价签中的较小者”并截断；接受区间为公平租金的85%—115%各截断，希望价在该整数区间抽样后 prettify 并夹紧。不是精确1/3、1/2、2/3。
- 通常20%先尝试买走；前3次租赁记录都先尝试购买。日期≥38最长3天，≥39最长2天。
- 首次到期90%进入归还分支：2—3天有30%损坏一级；4天有50%损坏一级、25%损坏二级、25%正常。已租≥3次或玩家卡有Potential Junk时，这个分支会被全毁归还覆盖。
- 剩余10%：真实估值≥400 **或** 玩家卡优于Fairly时，立即丢失并返还一份租金作补偿；否则延期1天，下一次归还事件丢失、无补偿且可合理举报。这里的条件是OR，不能抄成AND。
- 当天进度>0.666，潜在检查50%安排一个到期归还；日终强制安排所有剩余到期货，防止物品永远不回来。

## 9. 拍卖与街道消费

原 `HiddenV.isValuable` 的受理资格看玩家卡，排除Repaired/TotallyWrecked；考古/国家历史/世界历史伟人可收，或有figure且非假签名/首饰。真实资格另用真实卡复核，可能给假货警告。

落槌算法 `HiddenV.hammerItem`：5%直接以真实估值落槌并记low；其余95%先按真实属性乘随机系数，再90%记mid、10%再乘5记high。因此整体high分支为9.5%，不是10%。考古倍率[2,3)；普通正面人物[1,1.6)；世界历史伟人[2,3.2)；四类负面人物[0.75,1.25)。不同因素按调用顺序相乘。

已通过原DLL发现关键失配：`hasNational` 检查 **blue_national**，受理资格使用 **blue_nationalhis**。原生常用的后者不会得到前者[1.5,2.5)倍率。研究数据分别保留两种合成卡的10000次抽样；不擅自替原作纠正拼写。

`AuctionHistory.UpdateWithTodayDate` 在提交后第2天标OpensToday，超过2天为LateResult。拍卖费 `level58:2293/2214` 分别为第5周前300、此后450；名字仍叫“Purchase 80/120”是旧命名，**不能拿GameObject名字当价格**。佣金5%/8%，实际到手为 `soldPrice-trunc(float32(soldPrice)*rate)`。每周默认2次名额，提交减1；租赁高接受率剧情可能加额。挑战街游每次重新给1次。

全部29个 `StreetStorePurchase` 已保存原价与成功/失败回调。主要价格序列：

- Hair 0—6：450、840、1590、2850、4980、7890、14400。
- Clothes 0—6：650、1050、1850、2950、4450、8650、16250。
- Housing 1—3：4400、18500、50500；2级需要Clothes≥2，3级需要Hair与Clothes均≥4，购买后可能结束租房状态。
- CityChat 1—3：210、320、420；购买事件还有 `renunLevel<=3` 与本周已买状态，周开始重置。
- Repair 组件的basePrice=20是无效回退字段，实际启用了 `UseBasePriceFromContext`，读取 `Repair.fixPrice`。不能再实现成20元修理。

## 10. 挑战模式、举报和结局

原挑战不是30个任意来访：`ChallengeMode.Generate` 先推进到DAY15，清初始贷款并设现金3000，解锁46个工具/手册状态，然后DAY15—29每天2次**收购**，每次后一次潜在出售；收购5/10/15/20/25次后允许街游；结束再推进并追加3次潜在出售，剩余库存按真实价值半价清算。它依赖 `Level/day15`—`day29`，而本Demo没有这些Level资产。可以静态研究其代码，不能宣称已在这个Demo成功跑通原挑战。

计分：正确鉴定/低价收购/高价出售各条50分；买全/卖光乘2，鉴定大师/议价大师乘3；现金与半价库存计入底分。源代码存在两处必须保留的实际问题：`successfulSell40` 调的是 `successfulBought(p,1.4)`；结果界面动画中逐个累计50才形成每条50，不能只看某一次 `CountToScore(1)` 就漏乘数量。这些需在完整版/完整Challenge环境动态复核后决定是保留缺陷还是明确修复。

举报核心 `Report.addBy` 使用当日/本周次数递减收益：当日既有次数t>4为0，否则 `trunc((14+8t-2*(day mod5))/2^t)+trunc((10+8w)/2^w)`。原DLL90组边界验证通过。每周目标/当日报告会关联最高举报者、店面被破坏、天气/雨、罚款与结局；例如日末最高举报者条件为 `today>=target/30 || week>=target/8`，店面被举报条件为 `todayPre>=target/40 || weekPre>=target/15`。不应只显示一个“举报次数”而不连后续状态。

22个Windows资产 `PlayCutsceneEvent` 调用已保留条件和选项，涉及破产、逾期、被固定、雨、重新工作、固定国家、揭露、SAS、商人、漂浮者等。`LevelLogic.OnDayEnd` 的DAY40退休判定包括 `Pension.paidAll`、`Home.type==3` 或净现金≥20000。实际结局入口还依赖后期Level/场景激活和动态状态，完整结局集合不能只数这22个调用，也不能把10种cutscene名字当10条已验证可玩结局。

## 11. 提取质量、复跑和剩余问题

独立Odin二进制解码器保留类型、数组长度、节点offset、内部引用和Unity外部引用，要求字节完全消费。字符串数组的生成schema错误与Unity旧managed-reference registry问题分别修复；我范围内初次失败的Windows300/Mac2对象全部严格恢复。最终目录还读取主任务恢复后的 `final-index.json`。

复跑顺序：

```bash
/tmp/nua-unitypy-env/bin/python reference/original-study/progression/recover_objects.py
python3 reference/original-study/progression/build_catalog.py
python3 reference/original-study/progression/build_semantics.py
python3 reference/original-study/progression/run_probe.py
python3 reference/original-study/progression/verify_research.py
```

前两步需要主任务原始对象提取完成；`run_probe.py` 指向用户提供的Windows DLL，构建临时文件放/tmp，不将原作反编译源码加入产品。数学探针用明确标记的合成物品测试孤立规则，拍卖随机频率只作实测样本；它不证明所有原生物品、所有场景与所有随机种子都已验证。

仍未解决：后期完整日程缺失；Hoochoo文案与实现失配的原Unity端到端复核及动态/原生隐藏路径排除；所有UnityEvent的场景对象生命周期/按钮触发顺序；所有剧情约束是否可满足；两版后期叙事分歧的逐条语义解释；原生应用端到端验证。数据已经比录像样本完整得多，但上述缺口仍不能写成“整个系统研究透彻并且1:1完成”。
