# 两份原文件的物品、鉴定、工具和手册研究

本报告对应用户提供的 Windows **1.0.5 Demo** 与 Mac **0.2.5 (Demo)**。两版分别研究，未将早期版当成完整版的补丁。本轮研究不修改浏览器游戏运行代码。目录覆盖全部打包定义，不代表每项都能在 Demo 的实际日程中出现。

## 结果与交付

| 指标 | Windows 1.0.5 Demo | Mac 0.2.5 Demo |
|---|---:|---:|
| 原始 Item 定义 | 609 | 388 |
| 能通过原 Item.LoadItems 非空卡筛选 | 609 | 387 |
| 允许随机出现的定义 | 398 | 275 |
| 原始 Card 定义 | 252 | 228 |
| ManualConfig 配置页 | 77 | 73 |
| 固定拖卡控件 | 184 | 184 |
| 正文拖卡链接，每种语言 | 82 | 68 |
| 全书可拖出的不同卡 ID | 143 | 135 |
| 宝石物品 | 63 | 43 |
| 有 OpenSprite、可拆开物品 | 59 | 32 |
| 有签名图物品 | 204 | 117 |
| 有材质卡及对应材质图物品 | 593 | 380 |

- [item-tool-catalog.json](item-tool-catalog.json)：全部物品与卡片原字段、来源对象 ID、名字/描述/口号双语文本、实际 DLL 估值、逐物品六工具结果、全书控件树/正文/解锁条件、版本差异。
- [tool-rule-spec.json](tool-rule-spec.json)：工具状态机、自动翻页条件、卡片估值顺序、宝石生成、鉴定例外的可机读规则。
- [item-tool-parity-gaps.json](item-tool-parity-gaps.json)：研究结果与当前原型的缺口，明确仍只有 31 个游戏内物品定义。
- [Windows 数值表](items-windows-1.0.5-demo.csv)、[Mac 数值表](items-mac-0.2.5-demo.csv)：每件物品的数值、工具适用性、随机资格；带宝石的物品另列生成卡后的值。
- [Windows 卡片表](cards-windows-1.0.5-demo.csv)、[Mac 卡片表](cards-mac-0.2.5-demo.csv)：全部卡片的原生类别、优先级、显示数值与真实函数，保留二者差异。
- [Windows 全书正文](manual-windows-1.0.5-demo.md)、[Mac 全书正文](manual-mac-0.2.5-demo.md)：按真实页 ID 排序，包含页面解锁条件、英文正文与卡片入口；完整韩文/英文原字段在 JSON。

证据分三层：**原始字段**表示能在资源对象找到；**代码确认**表示追过对应函数及调用顺序；**原 DLL 实测**表示调用了用户原文件中的程序集。没有运行原 Unity 场景的部分不会称为视觉/时序验收通过。

## 确实调用了原 DLL

探针是独立编写的 C# 调用程序，直接引用原文件目录内 `HoochooGames.NoUmbrellasAllowed.dll`，没有用浏览器实现充当对照答案。

- Windows：609 个物品的静态卡估值、252 张卡各 7 个输入点、252 个工厂创建入口、144 个高级宝石组合。
- Mac：388 个资源对象中 387 个可加载物品的估值、228 张卡各 7 个输入点、228 个工厂入口、144 个宝石组合。`BSC_acc_02` 的第三张 Cards 指针为空，原加载器会过滤；探针将它保留为明确错误行。
- Windows：逐项执行 **609 × 252 = 153,468 次** `EvaluateAppraisal.isReallyTrueCard`，每件物品保存完整的被接受卡 ID 列表。此矩阵以原序列化真值为输入，未将随机生成的高级宝石或未来世界事件混入静态真值。
- Windows：所有 integrity 0–100 × 四种原始普通状态 × 四种申报状态，共 **1,616 次**边界校验。
- Mac：已另定位并调用旧版 `Infoscreen.isTrueCard`，完成 **387 × 228 × 2 = 176,472 次**真值检验、**1,616 次**旧损伤边界、27 次完整买入结算和 2 次正确/错误鉴定库存销售；见 [Mac 旧链专报](MAC_LEGACY_APPRAISAL.md)。
- 直接探针结果：[Windows JSONL](../../reference/original-study/items/windows-dll-probe.jsonl)、[Mac JSONL](../../reference/original-study/items/mac-dll-probe.jsonl)。预期的坏参数也被记录，不以“没有异常”抹掉原实现边界。

两份 ManualConfig 还做了独立交叉解析：手写字段读取器完整消费 Windows 11,088 字节和 Mac 9,308 字节；与主提取器修复后的类型树结果逐字段相同。全 150 个配置页都遍历了真实 GameObject/Transform 子树，未发生未解析子对象。正文链接与其实际 `TMP_TextSelector_B` 拖拽组件逐一对应，故计数不只来自文本搜索。

## 估值实际规则

来源：`Infoscreen.overWrite/refinedInfoscreen/sortInfoscreen/estimatePrice`、`Card`、`IO.convertCcardToFcard`。

1. 同类别卡比较 tier，低 tier 不替换高 tier，同 tier 后输入者替换前者。灰卡跨灰卡类别冲突；红卡有不同的类别处理，不能照普通绿蓝卡归并。
2. 精炼后按原 CardColor 和 category 排序，逐张调用估值函数。Windows 颜色顺序是 Gray → Green → Blue → Red → Yellow → Pink；Mac 没有 Pink。
3. 通常灰/绿卡做加减法，蓝卡做乘法；直接 DLL 采样验证每张卡的 `multiplier × 输入 + addend`。两个 +20% 是相乘得到 ×1.44，并非相加成 +40%。
4. 空卡列估值为 0；非空卡列最终至少为 1。核心返回 double，不在这里强行取整，不在每张卡后截断负值。
5. 物品事实卡、NPC 所知卡、公开卡、私人卡是不同数据层。工具读取事实字段，玩家贴错标签不会改变实际年份、材质、签名或宝石。

所有物品的直接估值和精炼后卡序已列入 JSON；宝石随机物品同时保留原序列化值及每种切割产生的总价，避免将一局随机结果固化为永久真值。

## 六种工具

| 工具 | 真实读数和操作 | Windows 1.0.5 额外条件 |
|---|---|---|
| 损伤仪 `brush/IntegrityTool` | 移到物品即读 integrity；针角 52.7−1.054×损伤，0.5 秒回弹动画；离开后闲置摆动，点击放下 | 自动翻 Status；按住 Shift 或手册未启用则不翻 |
| 材质放大镜 `magnifier` | 读第一张 material 卡对应的材质图，再叠加物品 tint；移动时纹理偏移，点击放下 | 当前 Brands_ 页面保留；否则翻 Materials；Shift 抑制 |
| 签名仪 `sign` | 直接显示 signSprite；无图显示无签名并播放失败音；不以 HasSignature 布尔值替代图 | 当前 Figures 页面保留；否则翻 FigureList；Shift 抑制 |
| 年份仪 `year` | 悬停读取 YearMade，D4 四位显示；离开显示 0000；点击物品不执行放下逻辑 | ≤1999 翻 Historic，2000–2047 翻 Timeline1，≥2048 翻 Timeline2；品牌/人物/历史页保留 |
| 宝石仪 `jewelscan`（解锁键 tool.jewel） | 必须点击；比较真实 jewel 卡，普通宝石生成认证卡，高级宝石保留高 tier；出票后送进私人槽 | 私人槽已有两张即失败；重复已有证据不出票；成功时锁住工具 0.75 秒出票＋0.25 秒淡出；翻 Jewel |
| 螺丝刀 `screw` | 点击 ToggleOpen，显示物品 OpenSprite；不是所有物品都可拆，失败有声音并放下 | 成功后立即允许放大，翻 WatchMovement；Shift 抑制 |

`Tool.Use` 在各工具 OnUse 后还调用 `HaggleEngine.PlayerUseTool(toolID)`，所以使用工具会进入 NPC 反应模型；不能只替换窗口图片。

Mac 六工具没有上述自动翻书；损伤针范围是 ±70°；材质显示固定 20×20 世界单位；年份不补四位零；宝石工具没有 Windows 的“两张私人卡满槽”前置阻止，也没有出票期间禁止放下的保护。这些是版本差异，不能拼成一个所谓原版规则。

Windows 有 16 件打包物品没有材质卡。`MagnifierTool.OnUse` 会访问空的 loadedSprite.rect，存在原代码空引用风险；本报告记录这个边界，未将其包装成一个原本不存在的通用“不适用”流程。

工具有独立解锁键。全部原 `SetPersistentContextEventData` 写入已与路径/条件留在 catalog 的 unlocks。例：D02_firstassess_darcy 的 brush/magnifier、D03_hanja 与 D04_year_darcy 的 year、D05_sign_darcy 的 sign、D11_2_jewelry_jane 的 jewel、D15/D16/D21 的多种 screw 获得路径。**存在后期事件资源不证明该 Demo 日程能走到它。** D16_screwmorechance 分支还会收取 500V 或在余额不足 500 时扣空余额，不能概括成所有工具都有固定购买价格。

## 宝石及原实现异常

高级宝石基础值：Emerald 1000、Ruby 800、Grandidierite 1200、Taaffeite 1500。切割系数：emerald 1、round 1.5、oval 1.7、pear 2、heart 1.6、cushion 2.1。

两版原函数的价格均为 **基础值 × 切割系数，不乘克拉**。克拉只进入卡 ID 和显示文字；0/1/2/3/4/10 克拉组合均实测。Unity 卡片工厂先把 0 克拉改为 1、none 切割改为 round；直接向 Core 工厂传 none 会抛异常。

Windows Item.OnEnable 会给开启随机化的 tier-2 定义随机克拉和切割；Mac Item 根本没有这个 OnEnable 实现，所以序列化的同名随机标志不能被当成已经生效。Windows 30 件有 tier-2 标志，其中 29 件标记随机；一件虽然有标志但没有 jewel 卡，不会真正追加高级宝石。

不要从卡面的 ShortEffectText 直接推导代码：

- Windows `green_art_revalued` 印着 600V，但静态卡效和工厂都返回恒等函数，加值实际为 0。`ChangingCards.artRevalued` 换卡时没有补上 600。
- `green_garnet_cert` 的静态注册缺少卡效，但工厂会特别复制普通 Garnet 的 +50。要保留“原始卡表”与“工厂创建后的卡”两条路径。
- `green_fakeBrandHalf` 裸 ID 会缺失品牌字典键；加具体品牌后缀才可生成半价品牌卡。
- Mac 艺术卡面的 450V、100V 等是含原始 2D artwork 基价的展示法，实际绿卡增量分别仍为 +150、−200；不能再额外相加一遍展示总数。
- Mac→Windows 真正变化的例子：Sheet Music 灰卡 +55→+285，AA Logo 材料 −300→−50，Ben Easy 材料 −150→−50，Great Figure tier 1→3。全量差异在 versionDiff。

## 鉴定真假的细节

Windows 普通损伤接受区间存在重叠：0–5 Perfect，6–15 Perfect/Slight，16–25 Slight，26–35 Slight/Fair，36–50 Fair，51–65 Fair/NoValue，66–100 NoValue。但原物品只有一张状态卡且申报正是该卡时，会先直接接受；高 tier 特殊状态按原真值优先，不走简单针角阈值。

`EvaluateAppraisal` 对宝石有明显宽松分支：只要真实物品有 jewel 类别，申报 tier≥1 或带 cert 的宝石卡即被视为正确，不再比对宝石种类。`fakeBrandHalf` 在原物品有品牌类别时也会直接接受。这些是原 DLL 的结果；目前仅作为研究事实保留，没有将“理应如此”的规则反写进源码假装原行为。

Windows appraisal/recommended/trusted/repair 类别另有直接接受分支。Mac 使用不同的 `Infoscreen.isTrueCard` 与买入成交后的 `precise` 计数链，已独立完成 176,472 次真值检查。其普通售出链只结算金钱、库存和历史，没有 Windows 的售出时 Reputation.Appraised 评价。旧版只按事实卡 ID 或尚未识破假货时的 ReferenceCards 判真，损伤没有新版重叠容错区；openYellowCard 门槛实际只检查键存在，字符串 false 也会启用错误鉴定计数。完整调用链和边界见 [Mac 旧链专报](MAC_LEGACY_APPRAISAL.md)。

## 全书机制与当前缺口

手册不是 21 张图片。Windows 有 77 个配置页：六工具说明、状态/材质/热度/稀有度、人物分类与名单、人物详情、完整品牌页、宝石/机芯/艺术、年代和历史事件、后期变化页。每页按 unlockCondition 动态进入有序页表；手册自身另受 Mechanic.manual 控制。

固定卡控件和正文中的 c: 链接都能拖卡；正文拖拽要从真实文字命中位置确定卡，而不是单纯点击整页。两者都会经过 `PickupMaterialContextProvider`：回收行情会把纸、玻璃、铝、基础金属、钢、银、塑料卡替换为对应涨价版。品牌页还可因 Card.OnItemLoaded 提前解锁，不必等成功买入。55 个原始卡→解锁上下文映射已保留，包括源程序中的拼写异常。

当前浏览器原型仍只覆盖视频切片中的 31 个物品定义、21 张书页和 48 个已实测热点。它没有达到本报告 609 定义/77 页/完整工具与随机生命周期的范围；跨日世界事件和 NPC 心理模型的研究在其他报告。此处的“完整目录”不能替代“全系统已实现”。

尚未声称完成的验证：150 页原 Unity 场景逐页运行、所有工具在原场景中的快速连续操作/动画中断、所有未来事件路径可达性、全随机分布的运行采样。Mac 旧版鉴定与结算调用链已在补查中查清。这些明确保留为后续验证项目。

## 重复研究

运行 `reference/original-study/items/parse-manual-config.py` 复核字节解析。分别 `dotnet build` 两个 probe 工程，再以 `dotnet run --no-build --project ... -- <version>-probe-input.json` 调用原 DLL。`build-item-tool-catalog.py` 将来源资源、页树、本地化和探针输出合并；`export-readable-tables.py` 生成易读数值表与手册。
