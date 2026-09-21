# 官方 Demo 物品事实核验与接入

2026-09-21，来源为开发者 [Itch 页面](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed) 的 `No Umbrellas Allowed - 1.0.5 Demo Windows.zip`。下载文件 216,684,694 字节，SHA-256：`026da208cdf7fdec6e09491f1262d271af3dd67a571ce8bf583f73435f9fb602`。这是官方 Demo 数据，文件名版本号本身不构成零售版全数据相同的证明。

本报告补充并更新先前 `APPRAISAL_EVIDENCE.md` 中的“待下载/未核验”状态。研究阶段保留原来源，游戏代码为独立 TypeScript 实现，未复制反编译 C# 实现。

## 已提取内容

- 609 个物品定义、252 张卡片定义，见 `official-item-catalog.json`。
- 1,808 条英文物品本地化记录、1,033 条英文卡片记录已解析，完整文本仅留临时研究文件；产品模块只纳入物品名、可检查的内容文本和卡片标签。
- 游戏运行数据纳入 31 种物品定义，显式对应 43 次物品来访和 6 件初始库存。第 44 次 `day9-umbrella-side-deal` 的具体伞未能唯一确定，维持 unknown。
- 原始工具组件 16 个、材料纹理 18 张、签名字形 10 张已导出到 `public/assets/demo-tools`。当前范围没有手表或宝石物品，因此不制造其机芯或宝石结果。

Unity `Item` 数据中的 `YearMade`、`integrity`、`Cards`、`ReferenceCards`、`signSprite`、`materialTintColor` 等，独立于玩家标签。原 `MaterialSprite` 选择逻辑读取真实 Cards 中的材料；签名仪读取 `signSprite`，没有图样才显示没有签名。

## 显式身份匹配

没有以标题在运行时合并库存。`DEMO_VISIT_ITEM_IDS` 保存了逐项确认的映射，特别处理了同名实例：

- 购买的 AVAC ID Card 是 `AVACcard_01`，年份 2079；免费所得并售出的同名卡是 `AVACcard`，年份 2077，不能共用所有权和买入成本。
- `Flawless Shoulder Bag` 存在多个原生定义；录像中的低价款匹配 `No_03_copy`，不能选昂贵的 `AA_06`。
- 两种同名 Picked-up Hoverboard 中，录像低价款映射到 `VT_2068_t`；该映射的依据是物品历史与估价数量级，未来仍应做独立画面复核。
- 研究所海报有多个近似名字；录像明确看到 MOO 签名，选 `Poster_01`，而非无签名的 `Poster_01_01`。

## 发现的真实差异

- `EE_shoes`（Triumphant Combat Boots）材料确实为 EE PVC Premium、年份 2070，但官方真实卡还有错误口号。录像玩家保留了品牌溢价，这不是正确答案。
- Golden Glasses 和 Hoverboard for Display 的签名分别是 `sign_emily_fake`、`sign_hon_fake`。字形看起来近似名人，不代表真正的名人签名。
- 鳄鱼画的先前人工纹理注释“Canvas”有误。官方物品写的是 Paper；将原始 Paper/Canvas 纹理与录像检测窗口进行去亮度影响、有限缩放/平移的相关性比较，Paper 为 0.864，Canvas 为 0.370。可视条纹也吻合 Paper。此比较支持纠正材质，并非整帧逐像素相同的证明。详见 `crocodile-material-comparison.json`；代码保留原冲突及已解决记录。
- `Athlete` 原生卡为 +30%，与 Wiki 的 +20% 不同。12 个先前无数值的手册标签现均找到官方数据，包括 Failed Piece −250、Time-sensitive −40%、Potential Garbage −25%。

## 条件仪器的确切规则

通过官方 Demo 的 `EvaluateAppraisal.evaluateConditionAppraisal`、`ItemFunctions.isAcceptableAlternativeCondtion` 和 `IntegrityTool` 确认：针角为 `52.7 − 1.054 × integrity` 度。普通 condition tier 0 有合法重叠区：

| integrity | 可接受普通条件 |
|---:|---|
| 0–5 | Perfect |
| 6–15 | Perfect 或 Slightly Damaged |
| 16–25 | Slightly Damaged |
| 26–35 | Slightly Damaged 或 Fairly Damaged |
| 36–50 | Fairly Damaged |
| 51–65 | Fairly Damaged 或 No Value |
| 66–100 | No Value |

特殊高 tier 条件卡优先；原数据只有一个条件卡且玩家正好贴该卡时，原校验会先接受该精确匹配。不能仅用一条针角阈值丢掉这两个规则。

## 产品 API

`src/item-facts.ts` 导出：

- `inspectItem(query, tool)`：available、unsupported 或 unknown；readout 包含来源和置信度。已有录像 patch 优先保留；补齐结果提供年份、损伤值、针角、材料原图/颜色、签名原图。
- `getItemFacts(query)`：`nativeCards`、`nativeValue`、`nativeDefinitionId`、`nativeContent` 与证据。
- `valuationForItem(query, shopRate=0)`：真实物品有效卡的价值；与玩家库存鉴定估价分离。未知物品返回 null。
- `auditAppraisal(query, publicCards, hiddenCards=[])`：knownWrong、knownMissing、unknownEvidence。私人槽本身不会被当成错误。
- `nativeCardById`：现 UI ID、手册 ID、原生 ID 均可索引数值定义。
- `DEMO_TOOL_FRAMES`、`DEMO_MATERIAL_SPRITES`、`DEMO_SIGNATURE_SPRITES` 从 `src/demo-tool-assets.ts` 导出。

query 接受 visitId，或 `{visitId?, itemDefinitionId?}`。官方有效卡按原 category 的最高 tier 选择；价格函数先合计固定价格，再应用百分比/乘数和指定店铺比率。这里尚未实现所有随世界事件改变的卡片效果；市场更新需要由上层显式传入或替换物品状态，不能把静态原生数据称为整个经营系统。

## 验证

14 项数据层测试与 TypeScript 检查通过：包括 49 个原录像工具 patch 的可达性、同名不同 AVAC 卡隔离、已知所有权连续性、错误口号反例、公开/私人卡正确性相同、损伤全部边界、未知伞不返回假价值，以及外部无法修改内部事实。

独立数值样例：Backpack of Soldier 原生价值 56，吸引力 −1% 后 55；兔子雕塑原生价值 2896，Expertness +4% 后 3011；靴子的真实基础估价 119，不含被误认为真实的品牌溢价。

复现工具：`scripts/extract-demo-tool-assets.py` 从本机临时 UnityPy 提取目录导出图样；`scripts/research-inspection-coverage.ts` 只描述原录像覆盖，不应把其中 215 个“录像未观察”误读成最新官方补齐后仍全部未知。
