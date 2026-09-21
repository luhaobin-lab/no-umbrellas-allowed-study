# Mac 0.2.5：实际鉴定入口与成交后的旧计数系统

这项缺口已经查清：Mac 使用较早的 `Infoscreen.isTrueCard` 与 `precise` 上下文计数，并没有 Windows 1.0.5 的售出时 `Reputation.Appraised / EvaluateAppraisal` 流水线。不是缺少一份尚未找到的同名函数。

## 证据范围

读取主提取器对 `HoochooGames.NoUmbrellasAllowed.dll`、`Assembly-CSharp.dll`、`Vnarchy.Darcys.dll` 的全量 IL 索引，保留相关函数 token、IL SHA、字面常量和实际调用目标。见 [静态证据](../../reference/original-study/items/mac-legacy-appraisal-static-evidence.json)。

主 HoochooGames 与 Assembly-CSharp 中，指向 `Vnarchy.Darcys` 的静态调用和字符串引用均为 0；该旧程序集在包中存在，不应拿它的函数替换实际主调用链。主流程实际命中的程序集是 HoochooGames。

独立探针引用用户原文件的 Mac DLL，未引入 Unity 场景，也未重写被测函数。结果：[mac-legacy-appraisal-probe.jsonl](../../reference/original-study/items/mac-legacy-appraisal-probe.jsonl)。

| 原函数验证 | 规模 | 结果 |
|---|---:|---|
| 387 个可加载物品 × 228 张原卡 × 顾客知道/不知道假品牌两种状态 | 176,472 | 无调用异常，每件保存真值卡列表 |
| 0–100 损伤 × 4 种真实状态 × 4 种申报状态 | 1,616 | 只认原始卡 ID；没有 Windows 重叠容错区 |
| 3 种 openYellowCard 状态 × 9 种鉴定输入，经完整 IO.haggleSuccess 成交 | 27 | 完整成交的 precise 与拆分规则一致；余额扣 100，库存加 1 |
| 正确/错误鉴定库存各实际销售一次 | 2 | 钱、库存和售出历史改变；precise 及全部 globalVars 均不变 |

资源 `BSC_acc_02` 含空 Cards 指针，原加载器会过滤，所以排除该 1 件，不伪造第 388 个有效物品。

## 买入时的实际链

`HaggleEngine.onCustomerAcceptPrice` 或 `AcceptCustomerPrice` 的回调 → `IO.haggleSuccess` → `checkForBuyBack` → `checkForFakeOrBasicError` → `checkForPrecise` → 其余欺诈/坚持/客流上下文计数 → `Pawnshop.stockItem`。

`Infoscreen.isTrueCard(h, id)`：

1. ID 在实际物品 `cards` 中，返回 true。
2. 否则 ID 在 `references` 中，只有当顾客所知卡中尚无任何包含 `fakeBrand` 的 ID 时返回 true。
3. 其余 false。

这里没有对 integrity 划容错区，也不把宝石 cert 和高 tier 全部直接放行。Windows 的鉴定评价器不能反套到这一版。

`Haggle.failedBasicAppraisal` 只看顾客公开所知卡：只要有一张 jewel、brand、material 卡不在物品实际卡中便返回 true。缺少材料、错贴普通损伤、只在私人槽藏一张错误材料，都不会单独触发这一函数。

`checkForFakeOrBasicError` 的门槛是 `openYellowCard` **键存在**，并不检查其值是否 true；因此字符串 `false` 仍开启此检查。开启后，下列任一情形使 `precise` 加 1：实际是假货而顾客不知道假货；或上述基本鉴定失败。

紧接着，`checkForPrecise` 只要看到顾客公开卡中的 `yellow_precise`，便使 `precise` 减 1；这一条不依赖 openYellowCard。两条叠加的错误材料＋yellow_precise 样本会先 5→6，再 6→5。门槛键不存在时，错误材料维持 5，yellow_precise 仍可 5→4。全部经过完整成交函数核对。

`EvaluateInfo.appraiseProportion` 与 `numMissingCard` 也属于旧机制：按顾客公开卡中与物品实际 ID 相符的数量，对比物品精炼后卡数。它们不读取私人卡以修正顾客所知。

## 售出时的实际链

`SaleEvent.Start` → `PawnshopDT.shopping` → `Pawnshop.sellItem` → `sellItemWithCustomPrice`。

shopping 从合法展柜物品随机挑选，以物品真实估值和标价决定 sold/expensive。成功后 sellItemWithCustomPrice 增加现金、增加 Sold 历史、移除库存、更新展柜状态；如果其账目存在 yellow_buyback，可增加 buyBackSold。该链没有逐类别售后鉴定、Expertness 惩罚，也没有新版 Inven.evaluated 一次性评价标志。

用同一真实物品分别保存正确卡与“错材料＋错损伤”卡，以 200V 调用原 sellItemWithCustomPrice，两者均 10000→10200、库存归零、售出历史增加 1、globalVars 完全不变。这是旧行为的直接验证，不再保留为笼统的“Mac 售后评价未知”。

以上结论限定这份 Mac 0.2.5 Demo 的实际主程序。原场景动画、异步 UI 操作和所有剧情可达性不在此有界补查范围。
