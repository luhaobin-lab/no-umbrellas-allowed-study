# 原文件中的 NPC 买卖模型：可重建规则与未完成验证

> 2026-09-21 更新：用户已授权将研究结果落入运行时。当前实现、原DLL差分与明确剩余缺口见 [NPC_RUNTIME_UPDATE.md](NPC_RUNTIME_UPDATE.md)。本文后半的“本次不修改src”及初版差异计数是前一研究阶段记录，不能当作当前实现状态。

研究日期：2026-09-21。主证据版本 **Windows 1.0.5 Demo**；对照版 **macOS 0.2.5 Demo**。本报告研究用户提供的原文件，没有修改原文件，也没有把反编译实现复制进游戏。**数据已逐事件枚举、基础数值已直接调用原 DLL；不表示每个完整剧情分支已运行验证。**

机器可读入口：[npc-models.json](npc-models.json)、[逐项运行时差异](npc-parity-gaps.json)。所有下面的主版本结论均指 Windows 1.0.5 Demo，不混用旧 Mac 数值。

## 来源和证据等级

- 主 DLL：`原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data/Managed/HoochooGames.NoUmbrellasAllowed.dll`，SHA-256 `8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3`。
- 旧 Mac DLL：`原文件/No Umbrellas Allowed.app/Contents/Resources/Data/Managed/HoochooGames.NoUmbrellasAllowed.dll`，SHA-256 `72067a2bff6e9b20faf3d092eaea91ee69f50dea77475612694de170e8f229a2`。
- A：从原资源直接读出的数据；B：原 DLL 静态算法及组合顺序；C：直接执行原 DLL 的指定输入探针；D：仍需原运行轨迹/更完整条件覆盖验证。
- 定位采用 **版本 + 完整类型/函数 + 元数据 token/IL 偏移 + 资源 ID**。完整函数与调用定位在 [Windows IL 索引](../../reference/original-study/npc/il-metadata-windows-1.0.5.json)、[Mac IL 索引](../../reference/original-study/npc/il-metadata-mac-0.2.5.json)；不是从攻略猜测参数。
- IL 索引含闭包、辅助方法、常量、字符串和调用，并不是“已理解 NPC 数量”。原 C#/F#反编译临时文件仅用于阅读。

## 每个 NPC 必须绑定来访事件

原作不会给“某张脸”永久绑定一个底价比例。一个交易至少由事件、角色模板、基础人格、顾客默认信念、真实物品、店铺全局状态、随机初始化管线、可选 modifier、剧情 Hook 和报价/卡片历史共同决定。

[Windows 逐事件表](../../reference/original-study/npc/event-models-windows-1.0.5-demo.json)包含全部 **517** StoreEvent：[购买115、Visit254、Blank96、特定物品求购30、标签求购22]。其中 `Purchase && DoHaggle` 共 **96**，人格为 Active36、WishyWashy59、Emotional1。其余记录即使有默认人格字段，也不能当作正在议价的 NPC。

[Mac 逐事件表](../../reference/original-study/npc/event-models-mac-0.2.5-demo.json)包含全部 **284** StoreEvent，购买79，其中开启议价68：Active21、WishyWashy46、Emotional1。所有基础字段的顾客、物品、默认信念卡、LineSet 指针均成功解析；**这不等于完整事件可达性已证明**。两表保存每个事件的 playCondition、重复播放条件、禁止玩家拒绝、从 context 取物、保存角色复用、求购条件等字段。

每条记录同时链接解码后的 Intro/Outtro/CallableChunks，附行为节点及其位置；Branching 的真假分支不能无条件合并执行。`StartingContexts`、被顾客主动提出的卡、手动结束交易、库存/现金副作用均保留。UnityEvent 的 Raise 还需解析其监听者，不能把名字当成其最终逻辑。

**依据 A/B**：原 `StoreEvent.AsPurchaseEvent`、`PurchaseEvent`、`CreateHaggle.createHaggle`；逐条 `sourceId=resources.assets:<pathId>` 和 `sourceJson` 在上述 JSON 中。

## 真正的状态与输入顺序

必须保留：

1. `item.cards/references`：真实属性与鉴定容差/参考属性。
2. `customer.info`：顾客认可的信念卡。可能自始错误，不能用真值替代。
3. `playerInfoscreen`：玩家私有标签；隐藏不等于公开认可。
4. 按时间排列的完整 `context`：PriceStamp、双方报价/拒价、公开标签、接受/拒绝标签、催促等。
5. 价格/卡片管线的**有序列表**、可被替换/移除的闭包状态、单独的 price/card/hide/tool/tick Hook。
6. 当前累计 ticks、剩余 presentation、成交/离开状态；不能只保存一个 irritation 值。

`IO.onPlayerAssertPrice`：先把本次玩家价写入 context，先尝试专属 price Hook；Hook 返回 None 才进入通用管线。`Pipe.flow` 按序寻找第一个 Some，命中即终止，全部未命中才执行 Stopper。`IO.onPlayerAssertCard` 先把该卡从私槽移除、写入公开建议历史，再调用卡片 Hook/管线；NPC 拒绝不等于把卡加入 `customer.info`。`IO.onPlayerAssumeCard` 的隐藏 Hook 在默认隐藏落位前执行，已处理则不重复写卡。工具输入也要保留：实际宝石工具ID是`jewelscan`，解锁context才是`tool.jewel`；C#`Tool.Use`在`OnUse`之后总调用`PlayerUseTool(toolID)`，所以使用失败的尝试也可能进入NPC的`onToolUse`，不能只记录成功读数（物品/工具研究代理已核对两版实例与调用）。

`createHaggle` 对固定 StoreEvent 构造时 modifier=None，安装人格管线和 PriceStamp，再安装专属 Declarative Hook。注册了专属 Hook 的交易会清空普通 onTick。生成式来访的 `createHaggleWithIntro` 才另外运行 `selectModifier`、生成 Intro，并增加 `Gen_Haggle`；两条入口不能混为一谈。

**依据 B**：`IO.onPlayerAssertPrice/onPlayerAssertCard/onPlayerAssumeCard`，`Pipe.flow`，`CreateHaggle.createHaggle/createHaggleWithIntro`。

## 生成式顾客怎样先形成错误认知

`GeneratedPurchaseEvent.generatePurchaseEvent`先调用`GenerativeInfoscreen.generateInfo`，再构造议价。该流程与固定StoreEvent的`CustomerDefaultAssumptions`不同。

- 普通非Fixie起始只保留Gray、tier0且非art的Green，以及tier0且category=condition的Blue；红/黄/粉等不作为这条默认知识来源。
- Fixie只保留Gray与tier0且非art的Green，不默认保留Blue状况卡。上述五人格筛选已用31张不同颜色/tier/category合成输入直接调用原DLL确认。
- 日期1或Fixie跳过`mistaken`替换。其余顾客对表内每张卡独立抽U，U<.3保留原卡，U≥.3从该卡的替代列表随机选一项；列表内部用Guid排序选取。
- 原`mistaken`共**55**个原卡条目，已[直接导出完整替换表](../../reference/original-study/npc/generated-belief-mistakes.json)。例如Perfect可误认为SlightlyDamaged；FairlyDamaged可误认为SlightlyDamaged或NoValue。不能把误判统一理解为“顾客一律夸大自己的东西”。
- 之后对material/jewel类别，若`item.references`有同类卡，则用其覆盖。这解释为什么默认眼见属性可能与真实物品不同，不能把参考卡都当垃圾字段丢掉。
- 此函数未读Flower.type5；文案的“遗忘”并不构成这条程序链已实现该效果的证据。

依据B/C：`GenerativeInfoscreen.generateInfo/replaceCard/replaceMaterial/replaceJewel/mistaken`，[完整核心IL索引](../../reference/original-study/windows-1.0.5-demo/il-HoochooGames.NoUmbrellasAllowed.dll.json)，探针`generated-belief-filter/generated-belief-mistakes`。55条各自的70%替换分布及ReferenceCard全部组合未穷举，不能把导出55条称为55条已全面验证。

## 基础人格的真实管线

五个原枚举在两版都存在：0 WishyWashy、1 Active、2 Cautious、3 Emotional、4 Fixie。1.0.5 中 **Emotional 共享 Active 价格管线，Cautious 共享 WishyWashy**，不等于每次表现完全相同。

| 基础家族 | 执行顺序，先命中者优先 |
|---|---|
| Active / Emotional | 初始化时50%概率前置 FeelSorry；然后 Minus → Cheap → RepeatedSuggests → OnChangedGuideline → InitialSuggest（Flower.type1时换flower版本）→ PlayerCurtail → PlayerInsists（依店铺状态选版本）→ CompromisedSuggest → CounterSuggest → 通用Stopper |
| WishyWashy / Cautious | Minus → Cheap → RepeatedSuggests → InitialSuggest（可换flower）→ OnHesitate → PlayerCurtail → PlayerInsists → CompromisedSuggest → CounterSuggest → PlayerResuggest → 通用Stopper |
| Fixie | RepeatedSuggest → FixieStopper |

**陷阱**：原程序的管线标签不是唯一语义ID。Minus 的字符串也叫 `InitialSuggest`，Cheap 也叫 `CompromisedSuggest`；两种 OnDiscussedCategory 标签也重名。执行顺序、实际函数和列表位置都要保存，不能根据名称去重。`replacePipe` 的影响也需要遵循原列表函数。

**依据 B/C**：`Personality.OnPriceSuggest.generate`、`Active.PriceSuggest.Pipes.pipes`、`WishyWashy.PriceSuggest.Pipes.pipes`；原 DLL `personality-pipeline` 记录。

设 V=当前顾客信念估价，p=本次报价，c=上一顾客报价，q=上一玩家报价：

| 分支 | 可确认规则与数值 |
|---|---|
| 常规Active初价 | p≥V惊喜接受；p≥0.7V接受；p≤0.3V拒价要求解释；中间通常反报0.7V。只在上下文确为首次报价时适用。 |
| 常规Wishy初价 | p≥V接受；p≥0.8V接受；p≤0.3V要求解释；中间要求更慷慨但可能不给数字。 |
| Flower.type1 | Active 0.65V到0.7V按线性概率接受。Wishy flower版本另有p≥0.7V守卫，不能把所有0.65V都赋予同样概率。 |
| Cheap | V<4且0<p<V的专用接受分支先于常规初价；不是所有低价值物品通用七折。 |
| Active CompromisedSuggest | 满足原历史谓词后，t=(p−q)/(c−q)；<0.1要求认真；0.35–0.5存在接受概率梯度；≥0.5接受。前置旧报价等资格条件必须保留。 |
| Wishy CompromisedSuggest | t<0.1要求认真；<0.2坚持原价；<0.48要求中点；0.48–0.65接受让步；≥0.65赞赏接受。 |
| Active固定RepeatedSuggests | 双方报价总数>5后，p/V在0.6–0.7之间线性决定接受/放弃。不是统一的“玩家第三次”。 |
| Active随机FeelSorry | 50%初始化存在；玩家恰好第3次报价且有顾客前价时触发。读取整个报价序列的平均相邻比例变化，0–0.1梯度；执行后移除此管线。 |
| Wishy RepeatedSuggests | 双方报价总数>3，0.65V分段。 |
| PlayerInsists | Active普通版本p/V在0.55–0.67间梯度；另有由店铺全局状态选择的punish版本，不能每个NPC统一套普通梯度。 |
| CounterSuggest | 先识别“玩家在回应对方报价”的历史形态；V、0.7V、0.3V分段，余下用历史中点，不能随便取最新任意两个数。 |
| Wishy PlayerResuggest | p≥0.64V接受；0.55V≤p<0.64V先进入犹豫，再等20–39ticks：40%接受，30%反报p+0.05V，30%拒绝离开。不是按点击立即开奖。 |
| Fixie | 基准0.8V；双方报价总数>3时不足基准可离开。蓝/红/绿卡有独立判断，不是“所有主观卡一律拒绝”这么简单。 |

以上依据 B；初价五人格、6个估值×18个比例的540条边界探针为 C。每个具体记录保存 context、presentation、status 和完整管线。概率样本只验证有无该分布，不证明随机序列与原进程一致。每种modifier的静态模块/enum路由/资格探针/应用探针/证据序列覆盖与未覆盖维度逐项列在`npc-models.json.modifierModuleCoverage`。

### 原作还有两个通用的“差一点就成交”收口

- `Haggle.customerSuggestPrice` 先向下取整顾客反价；若最新价格行为为玩家报价，且 `abs(floor(counter)−p)<1`，立即以该整数成交，而非显示一个相同反价再让玩家点接受。
- `Haggle.customerDeclinePrice` 在无 price/card Hook 时，若 `abs(p−V)<2`，原拒价会改成成交。这个规则发生在通用行为 helper 层，并非 `EvaluatePrice.isAbove` 改成整型比较。

实例：Active V101、报价70，原 DLL直接成交；Wishy V1、报价0，原 DLL直接成交。当前本地模型在这些输入曾分别反价/拒绝。**这是实际差分发现，不能靠“158项本地测试通过”排除。**

依据 B/C：`Haggle.customerSuggestPrice/customerDeclinePrice`；[原 DLL vs 本地差分](../../reference/original-study/npc/local-differential.json)。本次540条参数样本431条匹配、109条不同；后者去重为14组 `(personality,V,p)` 输入，不能说有109个独立bug。

### 估值大幅变化不能只清空反报价

Active `OnChangedGuideline` 在价卡改变后第一次报价、`0.51<p/V<0.8` 且升值Δ满足3Δ≥V或降值满足|Δ|≥V时可抢先处理：

- 升值时计算 `(V−Δ)/Δ`，>0.3接受；0.1–0.2梯度；0–0.1拒价；非正时可反报0.7V。
- 降值时计算 `r=V/(V−Δ)`。r<0.2时依当前V在20–100间的梯度选择“物品贬得太多，离开”或“就给你”；否则r在0.3–0.5间决定拒价/补偿反价V。

这些是源函数的表达式，不能按直觉改成“价格涨了NPC必高兴”。完整连续鉴定+报价轨迹仍为D；当前本地未完整覆盖。

## 卡片博弈与隐瞒证据

普通卡片顺序：`OnRepeatedFalseCards(3)` → 已讨论同卡 → 已讨论同类别 → 精确匹配卡 →（openRedCard存在时）红卡六分支 → Fake → Rare → Popularity → Condition → FigureJewel → Figure → Jewel → Stopper。Fixie改走 FixieOnBlue → FixieOnRed → FixieOnGreen → FixieStopper。

源里虽构造 `yellowCardPipe`，当前普通 `onPlayerSuggestCard` 返回拼接式没有把该局部 yellow 列表接进去；不能因为文件有 BuyBack.pipe 就断言它通过这条入口可达。

- 重复假卡检查的是**历史里建议的错误卡次数** `suggestedFalseCards`，长度>3才处理；不是当前公开栏错误卡总数≥3。移除一张错误卡不自动清掉历史。
- 已讨论同卡、同类别、精确真卡的分支先于一般材质/状况规则。重复试探、推翻自己前述证据会引发不同反应。
- Fake需区分物品实际是否假、顾客已知什么、提出的是笼统假货还是错误材质/标语/年份/签名证据；不能将“看过工具”作为所有真假反驳的统一开关。
- 红卡顺序：Once → AvacTarget → ShopBalance → ShopPlenty → Last → Report。余额、库存、首次让步、最后报价、举报威胁均需真实店铺状态和上下文。
- Condition有原鉴定容差；Rare/Popularity/Figure/Jewel各有独立知识与真假分支。当前程序只有错误卡数量的 aggregate 输入，不能完整表达这些管线。

依据 B：`Personality.Personalities.onPlayerSuggestCard`、各`General.On*`类型；相关全部常量、卡ID、动作调用列于 IL 索引。**普通卡片全部真假/已知/重提排列尚未做穷举DLL差分**，不能把索引完整当成语义验证完整。剧情卡片另见下文。

## modifier 的选择与实际作用

`Modifier.selectModifier` 对正常候选列表按原列表顺序执行各条件（其中会抽取随机数），筛出候选后按 `Guid.NewGuid()`随机排序，再取第一项。不是列表固定优先级，也不是独立最终出现概率。Fixie直接None。正常候选14个，Challenge候选6个；代码命名空间共有16个PipeModifiers模块，但其中一些是空壳或未路由。

| 候选 | 入选条件/路由；确认作用 |
|---|---|
| AddedCustomerToday | `Gen_Haggle+1==addCustomerToday1`；替换放弃/失败对白回调。 |
| AddedCustomerTomorrow | 对应`addCustomerTomorrow1`；实际路由到同一个AddedCustomerToday.modifier，不能据名字虚构新性格。 |
| DeceivingAsBusy | 真实假货且U>0.9；开价0.7V、删FeelSorry、加LowImpact卡规则和BusyNagging，冒充忙人。 |
| Rain | 候选列表存在，但mapper路由返回false、应用返回None；单独rain日期谓词存在并不意味着该modifier真的被应用。 |
| Busy | Active/Emotional且非假货，U>0.9；开价floor[V(0.7+U/3)]；删FeelSorry；双方报价≥4时0.6–0.7梯度；正确卡影响绝对值≤20%可接受，正确降值≥40%可离开。 |
| Easy | 原`appraiseProportion>0.7`且Active/Emotional；开价floor[V(0.7+U/5)]。这个比例来自原鉴定状态，不是玩家工具点击率。 |
| FrightenedReported | 日期≥11、非假货、U>reportedProb；初报0.6V；公开升值保持旧开价、降值更新0.6V；加三条价格管线和AcceptCard。 |
| ConfusedReported | 日期≥11、非假货、U>reportedProb×0.9；65%估值触发犹豫/反复更改想法，动态替换onGoodPrice/OnHesitate；120–149、80–99、80–99ticks三段讲话。 |
| AngryReported | 日期≥11、U>reportedProb×0.9²；开价0.7V；价格和负面公开卡优先Angry管线，玩家放弃有单独回调。 |
| FrustratedReported | 日期≥11、U>reportedProb×0.9³；比较trunc(p)与trunc(0.2V)，不足反报0.2V；卡反应还能替换自身状态。 |
| Enthusiast | `haggleAppraisalStatus`非正确条目≤2时第一次U>0.9可入选；否则≤3时第二次U>0.6。完全正确时p≥0.53V接受；非正确条目>2先警告再离开；隐藏计数初始1，第三次隐藏离开；180–219ticks鉴定提示。 |
| Junuk | U>0.8再按AzikGrade1/2/3/4附加概率1/.75/.5/.25；修改接受回调，以初始物品真值70%判断满意对白，低于70%并非因此拒绝成交；成功失败影响AzikScore与JunukFailed。 |
| SingSing | 待鉴定卡中有正增值、真值≥500、U>0.5，再按grade2/3/4/5附加概率.25/.5/.75/1；对缺失>2先警告再离开；成交满意依完整鉴定，不等于另一个固定底价。 |
| DarcyFriend | 日期≥11、U>0.95可入候选，但通用haggleModifiers路由返回None；独立DarcyFriend.modifier中0.9V开价函数存在，不能假设候选已实际调用。 |

`reportedProb`：topReporter为true时.97；否则Report.week≤2为.9，之后.95。因候选还要竞争，上表的U阈值不是最终顾客出现占比。

Challenge只候选 DeceivingAsBusy、Busy、FrightenedReported、ConfusedReported、Easy、Enthusiast。Precise、CDDRecording、CDDBlocked、独立SingSing、Rain存在的空模块/辅助谓词不等于可玩人格。

依据 B/C：`Modifier.modifiers/modifiersForChallenge/mapper/haggleModifiers/selectModifier`、各`PipeModifiers`；探针逐个调用14候选的应用函数，12个返回状态、Rain和DarcyFriend返回None；对可应用的12个做108条初价测试。随后按实际适用条件各运行200次mapper：13种均出现过eligible，Rain始终false；其中DarcyFriend eligible后应用仍返回None。Deceiving使用被原ItemFunctions确认为假货的输入，SingSing使用原估值1000且未公开正增值卡的输入。**并未证明它们每个卡、tick、剧情组合都运行等价。** 另做公开/隐藏三张合成真证据的序列：11个modifier可执行，原DLL实测Busy在第二张明显降值卡后离开、Enthusiast第三次隐藏离开；Easy在该多缺失类别构造中按其原条件返回None，因此单列未进入该序列，不当成通过。

## 时间、随机与显示队列

引擎tick间隔0.2秒。普通非Fixie随机选择四种催促模式各25%，不是统一耐心值：nagging、naggingEt、naggingByTime、naggingUpDown。Flower.type3/6会替换花版本。ByTime普通450–599ticks、花600–799ticks；分阶段nagging还会插入后续建议与催促，不能只保留deadline。

Busy三段40–59ticks；Wishy重报价可能等待20–39ticks才接受/反价/离开；Enthusiast有鉴定提示时钟。onTickHook、presentation尚未播放、当前待答要价、重估和context变化都会影响实际可运行管线。存档必须同时恢复等待中的行为和闭包阶段。

随机源至少有 `GeneralUtils.rnd/System.Random` 与 `Guid.NewGuid`；本地可存档种子生成器不是原随机序列。即使统计概率相同，也不能说某seed会复现原NPC全部行为。

依据 B：`Personality.Personalities.onTick`、`General.OnTick`、`PipeModifiers.Busy/Enthusiast/ConfusedReported`、`WishyWashy.PriceSuggest.PlayerResuggest`。

## 玩家出售：另一套系统与多件购买

普通展柜销售由 `Sale` 控制，不应把玩家买入的Active/Wishy底价取反。先决定该买哪件展柜物品并评价鉴定，然后按以下短路顺序判定：

`mendatoryFeedback → byDarcyD → byFree(100%) → ifCheap(100%) → ifTrash(40%) → ifTrash20(40%) → byCondition(50%) → byPrice`。

- `mendatoryFeedback`包含逐物品/卡片、剧情反馈，有自己的接受/拒绝结果；不是纯装饰对白。
- `ifCheap`：以实际销售估值W计算挂牌利润率m，m≤−0.1直接接受（≤−0.2换更欣喜对白）。前面强制反馈仍可拦截。
- `_t`垃圾物品且m>0在相应40%门命中时拒绝；收垃圾次数≥20还有独立40%门。
- 最后`byPrice`：若 `U−0.3+(appraisedTier≥2 ? .1 : 0) ≥ m`接受。此前所有分支都应保留，不能只实现这条。
- 普通反价：挂牌/公开估值≤1.1时，`W×(挂牌比例−.01−.1U)`；否则W>1000围绕W±10%，其余±20%。生成反价≥挂牌则直接成交。
- `additionalSaleNeeded`要求是本次初始销售、visitors≥2、还有其他未售且可卖的展柜物品。第二件不得与首件的**定义ID**相同，候选按随机数排序选。
- 满足加购条件且原挂牌未接受时，50%直接提两件总价：`W1+W2×[1+(U−.5)×.4]`。另50%先反报首件，再在接受回调返回`AdditionalSaleEvent`进入第二件的额外销售。
- 加购路线先谈首件时，挂牌比例≤1.2用`W1×(比例−.01−.2U)`，否则围绕W1±20%。这与普通单件1.1阈值/.1随机幅不同。
- 接受双件后须同一次结算转移两件、扣减visitors、分别处理鉴定/推荐/历史；拒绝走本次回调，不可凭空出售第二件。

依据 B/C：`Sale.playerSuggests/chooseSecondDisplay/additionalSaleNeeded/successDoubleSale`。原 DLL 12组×200次销售探针证实80%和90%估价在无强制特殊反馈的合成物品上每组200/200接受，visitors=2时真实返回`DeclineAndAddItemOnDeal`和`DeclineAndCounterSuggest`两类，visitors=0未返回加购。详情在原DLL JSONL的`sale-monte-carlo`。

尚未逐条运行所有`mendatoryFeedback`物品/鉴定错误分支、加购回调后第二件的完整交易与剧情副作用，因此这些部分为B而不是全量C。

## 专属脚本不是泛化人格的参数

1.0.5原注册表共32个自定义交易Hook，31个在该Demo的StoreEvent资源中匹配到，`forVid`是注册存在但未匹配资源的例子。另有2个独立onSuccess Hook。完整ID→函数→资源→Odin分支见JSON，不用头像或玩家叫法猜测。

| 脚本组 | 原行为要点；覆盖状态 |
|---|---|
| D01/D02/D03/D04/D05教学、D06_2_brand_hue、D11_privateslot_darcy | 强制教学、卡片顺序、工具或私槽等待；已映射完整函数与Odin节点，未全部做独立交互序列验证。 |
| D06_brand_after | 前两次直接报价被阻止；Fake/错误标语/错误材质三者分支不同；正确材质证据会卸下初始Hook并换Fake管线。已有研究和本地序列实现，但不代表所有chunk副作用完工。 |
| D07_choi | 顺序为p≥2V：第一次/第二次拒价、第三次离开；否则p≥45接受；否则p≥30接受；更低离开。高价条件必须先于固定30/45。 |
| D08_art_hue | 好艺术品质确认前拒绝报价；低艺术品质第三次可离开；通过指定艺术卡后卸下priceHook。 |
| D08_art_after | 未公开认可masterpiece或deceased前拒价并清context；低品质、artist、masterpiece独立计数，不是所有错误共用一计数。 |
| D08_yeongi | p≥2V拒价清context；否则≥.9V或≥.65V接受，低于离开；Outtro还有购买价≥250的条件，应另外执行。 |
| D11_private_after | 两种蓝卡公开/隐藏的状态以及操作前私槽均参与分支；隐藏Hook先于新卡落位。不能用最终标签集合替代过程。 |
| D03/D08/D13/D18 UnWilling | 错卡可质疑专业离开；双方报价>1、缺失类别≥2、p/V>1.5按顺序拦截；家属事件共享模块不等于台词和结果相同。 |
| D20_preAvarice301/D21_preAvarice302 | 注册共享PreAvarice3.customize，并分别注册onSuccess；需连同成功后的Pawnshop变化一起处理。已索引、未完整动态证明。 |
| driver_after/begToBuy2/begToBuyAndWait5_1/cityChat_angbuilgu | 自定义拦截、时间/放弃和chunk路径，已映射原入口与参数/动作；未完整动态证明。 |
| kanasian1/2/3、junar1/2/3 | Tumblbugs模块独立函数，不能当普通无名来访。已索引并关联事件动作；未完整动态证明。 |

依据 A/B：`DeclarativesList.DeclarativeList/onSuccess`、对应`Declaratives.*`、`D08ArtHue`，以及每条记录链接的Odin解码源。早期已验证七个录像脚本的详细序列参见 [DEMO_CUSTOMERS.md](../research/DEMO_CUSTOMERS.md)，本报告以原DLL补足注册范围而非重复声称全部完成。

## 验证能证明什么

本轮直接原DLL探针有：五人格管线、540条初价边界、25段报价序列、28组各400次花卉概率样本、14候选应用检查/108条报价、14组各200次modifier资格检查、12组各200次单/多件销售样本。无调用异常。原DLL模拟物品`gray_probe`是特意构造的数值隔离输入，不冒充原609个物品全面回归。

本地差分暴露的14组不同输入、缺失的随机FeelSorry、Wishy延迟决策、错误卡历史、完整modifier、销售前置门和bundle，均记为未完成对齐。**本次不修改src，避免把还未交叉验证的发现直接变成新的猜测实现。**

下一轮可按以下顺序建立同输入对照：通用收口→真实context序列→卡片分类/真假/重复→modifier+隐藏/时间→销售强制反馈/bundle→全部剧情Hook及其Odin副作用。每项都应保留原DLL答案与本地结果，不能只写“新实现自己通过的测试”。

复跑入口：[run-probes.sh](../../reference/original-study/npc/run-probes.sh)、[build_npc_registry.py](../../reference/original-study/npc/build_npc_registry.py)、[compare_local.ts](../../reference/original-study/npc/compare_local.ts)。
