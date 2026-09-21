# 官方 Demo 的议价规则静态核对

日期：2026-09-21。以下事实在公开攻略研究之后取得，优先级高于未复现的玩家经验。**官方 Demo 不是已确认完全同算法的正式版；只读分析与模块测试也不等于完整原作验收。**

## 来源与校验

- 官方作者下载页：[Hoochoo Game Studios / No Umbrellas Allowed](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)
- 文件名：`No Umbrellas Allowed - 1.0.5 Demo Windows.zip`；216,684,694 bytes。
- ZIP SHA-256：`026da208cdf7fdec6e09491f1262d271af3dd67a571ce8bf583f73435f9fb602`。
- `globalgamemanagers` 的版本字符串：`1.0.5 Demo`；Unity：`2020.3.11f1`。C# `VersionNum.Start` 显示的是 `Application.version`，不是自定义假版本标签。
- 实际规则程序集：`HoochooGames.NoUmbrellasAllowed.dll`，1,214,976 bytes，SHA-256 `8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3`。
- 工具：ILSpy CLI 8.2.0；仅静态读取。反编译临时文本留在 `/tmp/nua-negotiation-types`；没有把原C#/F#代码复制到产品。
- `src/negotiation.ts` 是围绕下面数学事实独立写的TypeScript状态转换。所有事实型系数在 `MODEL_PARAMETERS.demo`，未核验的综合判断在 `MODEL_PARAMETERS.provisional`。

## 核对结果

下文 V 为顾客当前认可的公开估值；不能替换为录像成交价，也不能不加区分地使用包含私有卡的真实估值。边界由 `EvaluatePrice.isAbove/isBelow` 核对：分别包含等号。

| 行为 | 核对到的事实 | 类型 / 方法定位 |
| --- | --- | --- |
| Active首次报价 | ≥0.7V接受；≤0.3V拒绝并要求解释；其他常规范围给0.7V反报价。低于4V的小物品存在特殊规则。 | `Personality.Active.PriceSuggest.InitialSuggest`、`.Cheap` |
| Horong与Active | 0.65V—0.7V间用线性梯度选择接受；高端必接受，低端拒绝。 | `InitialSuggest.flowerPipe`、`Pipe.createGradient` |
| WishyWashy首次报价 | 普通分支≥0.8V接受；中间区间可能只要求更高报价而不给数字。花分支先检查≥0.7V。 | `Personality.WishyWashy.PriceSuggest.InitialSuggest` |
| Fixie | 接受/反报价的基准是0.8V，不是后期攻略中的约70%。 | `Personality.Fixie.PriceSuggested.Stopper` |
| FrustratedReported | 对0.2V进行整型截断后比较；低价时以该值反报价。API的`fearless`映射到此modifier。 | `PipeModifiers.FrustratedReported` |
| FrightenedReported | 初始要价0.6V；公开升值后保持原要价，降值后更新为新估值0.6倍；玩家重新报价≥V离店。等于现有要价由UI直接接受。 | `PipeModifiers.FrightenedReported`、C# `HaggleEngine.assertPrice` |
| Active让步 | 前一玩家报价至少0.5V且已有双方报价时，让步比例为 `(本次玩家价−前次玩家价)/(顾客要价−前次玩家价)`；≥0.5接受，0.35—0.5梯度；低于0.1要求认真报价。 | `HaggleContextPrice.playerCompromisedBy`、`Active.PriceSuggest.CompromisedSuggest` |
| WishyWashy让步 | 同一比例在0.2、0.48、0.65处分段；≥0.48可以接受，低于此值有坚持/中点要价分支。 | `WishyWashy.PriceSuggest.CompromisedSuggest` |
| 反复报价 | Active有第三次玩家报价相关管线；部分让步/拒绝按0.6—0.7梯度。WishyWashy在双方报价总数>3时以0.65V分支。 | `Active.PriceSuggest.RepeatedSuggests`、`WishyWashy.PriceSuggest.RepeatedSuggests` |
| 普通出售接受概率 | 最终通用价格分支比较 `U−0.3+声誉层级奖励 >= (挂牌价−实际销售估值)/实际销售估值`，U均匀分布于[0,1)。层级≥2奖励0.1。之前另有按物品特征执行的分支。 | `Sale.byPrice`、`Sale.margin` |
| 普通单件出售反报价 | 挂牌/展示估值≤1.1时，用实际销售估值乘以`挂牌比例−0.01−0.1U`；否则围绕实际估值随机波动：价值>1000时±10%，其余±20%。若所得值不低于挂牌，直接成交。 | `Sale.playerSuggests` |
| 展柜买家交互 | 压价后是接受/拒绝回调；另有加购第二件的bundle分支，不能拿普通单件接口冒充已实现bundle。 | `Sale.InitialResponse`、`Sale.playerSuggests` |
| 催促时间 | 引擎节拍0.2秒；Busy有三个40—59 ticks的阶段；一般客户有多种随机催促模式，其中按时离店模式阈值450—599 ticks，Dora对应600—799 ticks。 | C# `HaggleEngine.TickInterval`、`PipeModifiers.Busy`、`Personality.General.OnTick` |
| Busy鉴定反应 | 正确且影响绝对值≤20%的信息可接受；正确且降值≥40%的信息可以导致带物离店。 | `PipeModifiers.Busy.onLowImpactCard/onHighImpactCard` |

## 与前一轮公开资料发生的冲突

- 玩家攻略的“Fixies约70%”与Demo的80%不同；本模块采用核对到的Demo边界，不能据此断言后期正式版攻略错误。
- 攻略对Frightened顾客“第二张升值卡即离店”的描述不见于此Demo modifier；本模块不再实现那条猜测。
- “所有人同一底价”“所有人固定120秒耐心”“固定次数后按录像价成交”均无依据，已从模块去除。

## 已实现范围与仍有差异

已实现独立种子、公开估值变化、普通初报价、部分反复报价/让步、几个明确modifier、普通单件销售分段、实际金额反报价、时间推进与序列化状态。29项模块测试包含独立数值边界和反例，未使用录像成交答案生成断言。

尚未声称等价的部分：

1. Demo实际是可插拔管线，顺序、历史上下文、阶段事件和卡类别均可覆盖通用规则。当前模块只实现其中一部分；尤其Active巨大估值变化、多个特殊卖出卡分支、声誉触发插入管线、WishyWashy延迟接受与bundle没有完整移植。
2. `patient/hurried/scared`是本项目接口别名；具体录像NPC对应的原始基础人格和modifier需另行确认。原始核心基础人格为Active/WishyWashy/Fixie。
3. 随机数使用本地可存档种子生成器。概率公式可核对，但不声称与原进程全局`System.Random`产生完全相同序列。
4. 输入只有数值和错误卡数量，无法表达原作所有卡类别/知识状态。错误卡总数阈值仍是显式provisional；不能用它声称原作错误鉴定规则已完整。
5. `appraisedTier`允许调用方传入实际鉴定层级；缺省层级是显式本地默认值。`reputation`不会在模型里再次乘公开估值，避免已经加过声誉卡后重复加成。
6. 只读规则核对仍须用另一段原版运行轨迹独立验证；29/29模块测试仅证明实现符合所写规则与不变量，不证明整个游戏完成。

## 接入契约

- `createNegotiation(input)`创建并可直接存档；hurried/scared可能自带开场`counter`。
- `offer(state, amount)`返回新state、outcome、counter、message；不变更钱和库存。
- `tick(state, seconds)`返回新state；`status === 'left'`时调用方结束来访。
- `updateAppraisal(state, update)`只在实际鉴定动作时调用；单独改变私有真实价值不清除公开反报价。
- 普通出售先用实际`listingPrice`调用一次offer，得到买家接受或压价；后续不能继续报价，必须接受/拒绝现有counter。
- engine接受必须检查当前counter、现金、对应物品实例、交易仍开放；不可回退到录像价格。
