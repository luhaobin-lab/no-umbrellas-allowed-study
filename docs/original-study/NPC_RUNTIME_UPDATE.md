> 后续实现记录：[NPC_SCRIPT_RUNTIME.md](NPC_SCRIPT_RUNTIME.md)。32专属Hook及交易结束全局effects已完成独立实现和原DLL差分；以下165-test数字为该记录之前的历史快照。

# Windows 1.0.5 议价运行时落地记录（2026-09-21）

本次用户授权更新游戏后，已把旧 `src/negotiation.ts` 的估算分支替换为独立 TypeScript 实现。这里更新此前 `NPC_MODELS.md` 的“只研究、不修改 src”阶段结论；不将资源枚举或编译通过说成整个游戏等价。

## 模块与接口

- `negotiation.ts` 保留 create/offer/tick/updateAppraisal，额外导出 assertNativeCard/hideNativeCard/useNativeTool/clearNegotiationContext/acceptNativeSaleCounter。估值保留 double，玩家报价仍要求非负整数。
- `native-pipelines.ts` 创建原五人格（三共享家族）的有序价格/卡片管道、55认知误判以外的 modifier 资格和构造状态。未给真实事实的条件写入 unknownFacts，不当作已经鉴定。
- `native-price-pipeline.ts` 使用双方全部报价和最后公开卡之后的报价子序列；包括 FeelSorry、改价、重复报价、Wishy迟疑和反价、Confused动态报价、收口辅助函数。控制器接受当前反价与原IO直调分别有入口。
- `native-card-pipeline.ts` 保存公开建议、拒绝、接受、私藏、工具历史，覆盖重复错误、已讨论类别、假货证据/半品牌、品质、稀有度、人气、签名、珠宝、Fixie颜色规则、六种红卡路由。顾客拒绝当前假货卡也可能自行认可半价品牌，因此控制器同步返回的 customerCardIds，不能只看 beliefAccepted。
- `native-tick.ts` 按200ms原生tick推进四种普通计时、花3/6变体、Fixie、Busy、假Busy、Confused、Enthusiast、Junuk、SingSing。延迟动作保留其安排时的context长度，到期检查是否变化，不因存档或低帧率跳过等号计时。
- `native-sale-feedback.ts` 提供85条原顺序强制反馈、byCondition、分类错误状态，以及真实 modifier 所需 `nativeNegotiationFacts` 与议价特有 `isNativeHaggleCardTrue`。
- `native-sale-value.ts` 区分买家估值 `fairValue` 和反价比例分母 `ratioValue`。包含鉴定/推荐tier、假品牌承认、可接受状态替换和粉卡，不用真实物品估值直接顶替。
- `native-sale.ts` 有原出售判断顺序与单件/两件总价/先反价后加购三种计划；控制器负责库存、现金和一次性结算。
- `native-outcome.ts` 提供 Junuk/SingSing 的 Failed 与 AzikScore 结果补丁，控制器在一次性成交/拒绝流程应用。
- `native-random.ts` 保存本地可恢复随机流；`native-migration.ts` 兼容旧本地存档，不碰库存和余额。

## 原 DLL 外部验证

依据用户提供 Windows 1.0.5 Demo DLL，SHA-256 `8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3`。测试 fixture 在 `src/fixtures/native-*original.json`；运行时模块不导入这些答案。

| 检查 | 已执行范围 | 证明边界 |
|---|---:|---|
| 初次报价 | 540输入 | 原结果、状态、反价数值逐一对齐 |
| modifier报价 | 108输入 | 原IO入口，包含Frightened等报价边界 |
| modifier公开/隐藏 | 11组序列 | 公共卡值、私槽集合和离场结果 |
| 价格序列 | 25段 | 确定性结果对齐；随机分支验证原观察轨迹在本地随机输入下可达，不把两套随机种子当同一流 |
| 特殊卡 | 90组 | 4种状态卡×15损伤点，及5人格下假货链、半品牌、宝石证书、假签名、余额/AVAC红卡 |
| 延迟 | 32组 | 回放原DLL捕获的随机安排参数，核对到期结果和上下文变化取消 |
| 计时 | 20组原探针 | Busy与by-time初始闭包参数直接差分；其余计时已有静态移植与本地分段/存档验证，尚非每个闭包的同随机流差分 |
| 强制售货反馈 | 3,654输入 | 全609物品×3标签组合×已反馈/未反馈，原反馈键和结果逐一对齐 |
| 出售估值 | 6,090输入 | 全609物品×tier1—5×推荐/非推荐；买家估值和反价比例分母分别对齐 |
| Junuk/SingSing结果 | 24输入 | day19/20、Azik0/25/50、成败、计数与夹限对齐 |

`npm test` 当前全库165个测试通过；`npx tsc --noEmit`通过。此数量是当时其他代理并行提交后的全库快照，不能替代原作端到端游玩或视觉验收。

可重跑本轮新增独立探针：`reference/original-study/npc/run-native-probes.sh`。脚本只读用户原DLL，在/tmp编译，重新生成原DLL响应和测试fixtures，再跑议价测试。初期540/108等探针沿用 `run-probes.sh` 与已捕获fixture。

## 仍需明确保留的差距

1. 32个Declarative注册Hook已在后续模块落实，168原DLL序列通过；全部Odin事件交错和517个StoreEvent端到端可玩等价仍需controller/UI独立验收。
2. 原 `System.Random` 与 `Guid.NewGuid` 流未复刻；本地流可保存并复现自身，但不能宣称相同seed、同一NPC顺序或逐帧抽样同原作一致。14个候选概率是资格概率，经筛选后排序取首才决定最终modifier。
3. 原presentation队列中的逐句对白、动画等待、onTickHook播放互斥以及原语言表完整显示由UI/controller负责。模块保留分支键与状态，不宣称英文占位提示已是原对白。
4. 红色Once/Last/Report在原DLL静态初始化分别抽一次；控制器需在world持久化redCardRolls。缺失时明确记录 `source-global-red-rolls`，局部兜底不构成原全局生命周期等价。
5. `IO.haggleEnd/haggleSuccess/haggleFail`全局effects已在native-haggle-effects.ts落实且144原DLL案例通过；controller必须在提交结算时仅应用一次，并维持既有现金/库存/Appraised/Trusted各自责任。
6. 原双件/加购controller库存、额外销售回调与游客数必须单独做端到端验证；议价计划与金额测试不证明画面操作一次性结算正确。
7. 609物品估值矩阵覆盖原序列化真卡；随机二阶珠宝和各种半品牌/状态替代组合有独立基础卡规则测试，但不是所有工厂组合的穷举出售矩阵。
8. 花5“影响记忆”在现有生成信念链尚无实代码证据；没有据对白虚构新效果。只使用已核验的Windows 1.0.5规则，未混入Mac0.2.5。
