# 官方1.0.5 Demo：三维声望核验

2026-09-21。来源：[作者官方公开Demo](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)，来源与包哈希见 [demo-source.json](../../reference/research/demo-source.json)。对 `HoochooGames.NoUmbrellasAllowed.dll` 的 `Card`、`Reputation.Appraised/Trusted/Recommended`、`Sale`、`ItemFunctions` 做静态检查，并用临时自写.NET探针直接调用发布DLL。原始数学结果：[demo-reputation-results.json](../../reference/research/demo-reputation-results.json)。产品独立实现：[reputation.ts](../../src/reputation.ts)。原作代码不进入产品。

## 三种变量绝不能合成一个reputation

| 原内部名 | 英文UI名 | 独立状态 | 范围 |
| --- | --- | --- | --- |
| appraised | Expertness | expertnessRaw | −15到375 |
| trusted | Attractiveness | attractivenessRaw | −100到100；数值越低越有利 |
| recommended | Wittiness | wittinessRaw | 0到25 |

每次交易不等于显示百分比±1。程序保存raw，使用分段线性映射并**朝0截断**取得UI整数百分比。tier按截断后的百分比计算。直接探针遍历所有391+201+26=618个合法raw并核对结果，当前TS与DLL一致。

### Expertness

| raw区间端点 | 百分比端点 | tier按百分比 |
| --- | --- | --- |
| −15→0 | −5→0 | tier1：−5到−1 |
| 0→45 | 0→5 | tier2：0到4 |
| 45→135 | 5→10 | tier3：5到9 |
| 135→255 | 10→15 | tier4：10到14 |
| 255→375 | 15→20 | tier5：15到20 |

例：raw36和raw44都显示4%。全对鉴定一次加raw2，raw36→38仍然4%；raw44→46则变5%。所以从截图4%不能猜出唯一raw。

### Attractiveness

| raw端点 | 百分比端点 | tier按百分比 |
| --- | --- | --- |
| 100→40 | 15→10 | tier1：11到15 |
| 40→10 | 10→5 | tier2：6到10 |
| 10→−10 | 5→−5 | tier3：−4到5 |
| −10→−40 | −5→−10 | tier4：−9到−5 |
| −40→−100 | −10→−15 | tier5：−15到−10 |

当对应机制启用，满意的议价结果使raw−1；不满意使raw+1。只有tier5步长是2。raw在[-100,100]夹紧。所有201个raw的正负变化与原DLL逐一对比。

后续调用链核验明确了何时使用该评分：`IO.haggleSuccess`对非Fixie调用满意加分，`IO.haggleFail`对非Fixie调用不满减分；Fixie都跳过。C# `HaggleEngine`中接受NPC报价、NPC接受玩家价走success；玩家DeclinePurchase和onCustomerGiveUp走fail；只是拒绝一轮报价仍继续议价则不走fail。**普通收购可按最终成功/失败判断，普通货架出售不是这个入口。** 这替代了初查时“可能需要额外满意字段”的谨慎猜测。

Junuk/SingSing台词里的满意并不改上述通用Trusted评分：Junuk用≥真实价70%选择满意台词，SingSing按无错误/遗漏选择台词；区域关系另在DAY20后改变。不要把台词当额外Trusted倍率或另扣一次。

## 首次买家检查如何改变Expertness

源方法 `Appraised.appraisalPointForSale`、`Appraised.evaluateSale`、`Sale.chooseInitialDisplay`。顾客选择货架商品时就可评价，未必等到成交。每件实例有`evaluated`标记，只首次评价。原方法的错误数量是**category appraisal**里的wrong/missing类别数量，不是所有卡片数量；同类别两张错卡不能无条件计两次。

| 已证实wrong+missing数量 | tier1/2 | tier3/4/5 |
| --- | --- | --- |
| 0 | raw+2 | raw+2 |
| 1 | 0 | trunc(−1.5×tier) |
| ≥2 | trunc(−1.5×tier) | trunc(−1.5×tier) |

负分各级为−1、−3、−4、−6、−7，之后夹紧[-15,375]。已直接调用DLL验证5个等级×0/1/2错误，共15组。

原 `appraisalPoint(haggle)` 与 `appraisalPointForSale(inven)` 是不同函数；本项目公开的`appraisalPoints`采用买家首次检查版本。不能混用两处略不同的宽容规则。

本项目不完整物品资料的保护：`complete=false`时不因“未找到错误”而奖全对；如果已知错误本身已足以确定负分，才应用该负分。这是对证据覆盖的处理，不是原作随机容忍。

## Wittiness评分

只在对应商品通过特定成功销售路径、且商品实例位于原作display[0]推荐格时更新。UI可能把推荐格映射为其他布局索引，应由运行时语义字段告诉helper，不可拿数组下标猜。

独立真实物品的score为以下项相加：

| 性质 | 分数 |
| --- | ---: |
| 全民流行卡 | +2 |
| 其他正面流行卡 / 负面流行卡 | +1 / −1 |
| 世界历史伟人 / 其他正面figure卡 | +2 / +1 |
| AA品牌 async、oz、realbird、besch | +2 |
| A品牌 queen、vertivo、sas、casualcat、ben | +1 |
| 真实估值≤30 / ≥500 / ≥2000 | −1 / +1 / +2（互斥） |
| 限量 | +1 |
| 国家历史或考古 | +2（不重复相加） |
| 假品牌 | −1 |
| 修复品 | −2 |
| 垃圾桶捡拾实例（原ID以_t结尾） | −2 |

没列出的性质0分；figure负面不自动再减1；损伤没有独立评分项，可能通过低真实价值间接影响。品牌是否AA/A看原真实cards的品牌匹配；不是凭玩家临时贴的品牌猜。

| Wittiness当前显示 | 加raw1条件 | 减raw1条件 | 其余 |
| --- | --- | --- | --- |
| 0—4（tier1） | score≥1 | 从不减 | 0 |
| 5—9（tier2） | score≥1 | score≤−2 | 0 |
| 10—14（tier3） | score≥1 | score≤−1 | 0 |
| 15—19（tier4） | score≥2 | score≤0 | 0 |
| 20—25（tier5） | score≥2 | score≤0 | 0 |

raw本身等于Wittiness百分比，结果夹紧[0,25]。48组原DLL合成物品实验覆盖6个raw边界×4个真实价格×是否修复；评分与更新均和TS一致。该结论解决“修复品不能放推荐格”的误读：可以放，但评分−2；不等同于所有修复品必降推荐声望。

## 对库存估值的连接

`Card.saveAppraisedRaw`更新后会重建已有库存及货架里的appraised卡；原来的百分比不能固定在购买那天。recommended也有`changeRecommended`同步函数。三类pink卡的基础估价效果是乘(100+显示百分比)/100。其他声望等级对物品卡效果、顾客数或NPC策略的影响可能在别处，本模块只复现此处已确认的映射/评分，未声称所有声望相关规则都齐全。

## 初始状态与接入

视频DAY6的4% Expertness和−1% Attractiveness只能得到raw区间：36—44和−3—−2。`initialFromRates(4,-1,0)`返回状态{36,−3,0}、完整区间以及`inferred:true`。0% Wittiness作为调用方当前切片种子；若视频未能独立读清它，不能把该值升级为原始存档事实。此前所谓“信誉6”单个数字不足以恢复三种声望。

接口：

- `rates(state)` → {expertness,attractiveness,wittiness}
- `tiers(state)` → 三个1—5等级
- `reviewAppraisal(state,{wrongCategories,missingCategories,complete,alreadyEvaluated?,enabled?})`
- `reviewSatisfaction(state,'satisfied'|'unsatisfied'|'neutral',enabled?)`
- `recommendationScore(facts)` → score或null（缺事实）
- `reviewRecommendation(state,{recommended,score,enabled?})`

update结果包含新state、rawDelta（夹紧后实际改动）、pointDelta（规则原始改动）、applied与reason。除非applied，调用方不应显示增加声望。所有helper无副作用，不决定库存归属或写存档。

### Native卡数据适配

新增 [rep-data-helper.ts](../../src/rep-data-helper.ts) 的 `scoreFromDemoCards(cards,{itemId,repaired?,pickedUp?,trueValue?})`，接受DemoCard[]或原native ID[]，返回score或null。`analyzeDemoRecommendation`额外返回完整facts和未知原因。只按原category/nativeId/数值效果判断，不解析翻译名称。没有itemId且未明确pickedUp时返回null，防止默认假定非捡拾物。

优先传`DEMO_ITEMS[nativeDefinitionId].cardIds`，保留原始低tier品牌与高tier纠错卡。已refine的nativeCards可能丢失被盖住的原品牌，而原`repBrand`检查的是原始item.cards；这会造成评分差异。价格及popularity/figure需要refine（同类别高tier胜，等tier最后者胜）；品牌、假牌、修复、限量、历史的评分则按原始卡存在性。修复选项先换真实损伤卡，再计算真实值并加修复−2。

5项适配测试涵盖native ID/对象等价、类别、修复、未取整价格30.9边界、同tier覆盖及未知值不评分。

683行直接调用记录包括618个评分状态、1组品牌表、1组颜色表、15组鉴定评分、48组推荐评分。满意变化附在201条trusted状态中，不能误报成另一套完整独立系统测试。当前7项测试通过；这是规则数学覆盖，不是整个游戏真实UI全流程验收。
