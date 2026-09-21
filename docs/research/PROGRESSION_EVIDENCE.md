# 经营生命周期与完整性：交叉证据

检索日期：2026-09-21。目标：用户录像中的 PC 1.0.5。此报告只研究证据与现有代码，不把社区猜测升级为已知原作算法。

后续补充：本报告最初标为未知的贷款额度、提前还款、逾期与维修公式，已经通过官方Demo的静态规则及直接DLL调用缩小不确定性，最新结论以 [DEMO_ECONOMY_FACTS.md](./DEMO_ECONOMY_FACTS.md) 为准；下文保留首次网络交叉研究的冲突记录。

## 核心结论

53段来访是剪辑后的经营轨迹，不是完整经营系统。至少需要独立的库存生命周期、日程、债务账本、声望、花的有效期、维修任务、按天存档与失败状态，才可以让拒绝交易、不同报价、改变上架顺序等选择持续成立。视频中的钱数应作为对照样本，不能作为下一段的运行时输入。

**发现官方同版研究入口**：作者的 [itch 页面](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)仍列出 Windows 1.0.5 Demo（206 MB）；macOS 包为0.2.5，不能混用版本。页面平均半小时是介绍标签，不是完整游戏时长证明。2020年官方 Demo 宣布覆盖前三天；当前1.0.5包实际内容还须打开验证。[官方三日 Demo 公告](https://store.steampowered.com/news/posts/?appids=1301390&enddate=1592376417&feed=steam_community_announcements)

## 来源登记与版本隔离

下列日期优先使用 Valve 新闻 API 的 UTC 时间；网页按访问地区显示的日期可能提前一天。只保存元数据于 [OFFICIAL_PATCH_METADATA.json](./OFFICIAL_PATCH_METADATA.json)，没有下载整篇攻略作为交付内容。

| ID | 来源、作者、发布时间 | 版本适用与用途 |
| --- | --- | --- |
| P1 | Hoochoo [官方公告汇总](https://steamcommunity.com/app/1301390/announcements/?l=english)：1.0.0，2021-09-03；1.0.6，2021-10-26；1.1.0，2022-03-05 UTC | 1.0.0可证明1.0.5已有的功能；1.0.6/1.1.0用于排除晚加入的特性 |
| P2 | Hoochoo [0.7.0 分支存档公告](https://store.steampowered.com/news/posts/?appids=1301390&enddate=1606744297&feed=steam_community_announcements)，2020-11-26 UTC | 按天回溯并生成新分支；同页另有0.5.0/0.6.0街店、声望、租赁说明 |
| P3 | Hoochoo [0.10.0 平衡及生活质量更新](https://store.steampowered.com/news/posts/?appgroupname=No+Umbrellas+Allowed&appids=1301390&enddate=1626071179&feed=steam_community_announcements)，2021-03-10 UTC | 维修费用随物品变化；修复卡；租赁已重做；不是初版固定维修价 |
| P4 | Hoochoo [0.11.0 Challenge Mode 公告](https://store.steampowered.com/news/posts/?appgroupname=No+Umbrellas+Allowed&appids=1301390&enddate=1630674588&feed=steam_community_announcements)，2021-07-12 UTC | 无剧情、连续30笔交易；公开原作的闭合短流程框架 |
| P5 | Hoochoo [0.11.7 Cloud Save 公告](https://store.steampowered.com/news/app/1301390/view/2966167980991977123)，2021-07-26 UTC | 正文后来划掉启用云存档，说明Mac丢档后暂时关闭，标题不能单独作为可靠云存档证据 |
| C1 | Agh [Easily missed mechanics](https://steamcommunity.com/sharedfiles/filedetails/?id=2624632420)，2021-10-10，更新2021-10-30 | 最近1.0.5时代的独立实际玩法观察，但更新跨过1.0.6，未声明精确构建号 |
| C2 | Terreliv [Annoying Math and Other Tidbits](https://steamcommunity.com/sharedfiles/filedetails/?id=2820394308)，2022-06-12，页面最新更新显示Jan 30 | 后期版本经验；作者也引其他攻略；并非完全独立的第二份原始测量 |
| C3 | TheOddFly [Appraisal 101](https://steamcommunity.com/sharedfiles/filedetails/?id=3010421920)，2023-08-04，更新2024-06-12 | 作者明确主要基于个人体验；适合反例及实验假说，不直接认定1.0.5系数 |
| W1 | [Loans](https://noumbrellasallowed.fandom.com/wiki/Loans)、[Darcy](https://noumbrellasallowed.fandom.com/wiki/Darcy) | 无版本声明；贷款页自称不完整；全文打开被402阻止，使用当前搜索索引返回的正文，可信度下降 |
| W2 | [Appraising](https://noumbrellasallowed.fandom.com/wiki/Appraising)、[Endings](https://noumbrellasallowed.fandom.com/wiki/Endings) | 无版本声明；仅作交叉核对；结局页依赖韩文Wiki，不能算独立实测 |
| V1 | 用户视频、src/reference-events.ts、原帧 assets/reference-events | 精确1.0.5画面和动作；但存在跳剪，不包含隐藏状态或完整规则 |

明确排除：1.0.6新增对话日志、更多小结局收藏、敲诈者新路线，并修改部分物品属性；1.1.0重做英语脚本。这些变化不可无标注地填进1.0.5。官方1.0.0已有 Updated Items、挑战模式街店、库存声望卡动态更新、维修中货品移出货架、Adam花改变物品状态。它们是功能存在的高可信证据，不提供所有概率。[P1](https://steamcommunity.com/app/1301390/announcements/?l=english)

## 逐系统证据与未知项

### 日程、顾客数与街道

- 2021年玩家观察：服务速度不增加客人数；一天来客数受声望和植物影响。作者还明确买下后不能自行重做鉴定；买家拒绝时可以重新检查，作用是找出错误。[C1](https://steamcommunity.com/sharedfiles/filedetails/?id=2624632420)
- 官方0.5.0说明邻店与玩家同时闭店，应早上访问。0.6.0已包含三类店铺声望与租赁；租赁物品可能损伤或遗失。[P2](https://store.steampowered.com/news/posts/?appids=1301390&enddate=1606744297&feed=steam_community_announcements)
- 原录像只保证DAY6—11的特定日程。当前 `nextDay()`实质是 `loadVisit(visit+1)`，没有“下一经营日”的独立事件表。
- 未知：每一声望档的准确来客数、花的加客算法、日程事件与普通客的插入规则、周末是否跳时、工具解锁的全部前置条件。
- 应有模型：日期、时段、当前事件、当日已完成事件、普通客剩余队列分别记录。固定故事可按天触发，但购买/拒绝必须改变后续库存和条件事件。

### 债务、利息、还款

| 项目 | 视频1.0.5可确认 | 外部交叉 | 结论 |
| --- | --- | --- | --- |
| Darcy在录像开场的借款 | 本金500；每天25；两个日结分别扣25 | Wiki初始种子借款是1500/日息15，显然不是同一笔 | 不得把DAY6债务当新游戏债务 |
| Darcy再次贷款 | 还500后，面板可借4000/每天200 | Wiki另一次可借6100/每天305 | 两个样本都是5%/日；额度可能随状态变化，公式未知，不能全局固定4000 |
| Executor/Inspector | 收到1500；面板利息450/3天；之后一帧欠1950，DAY11实付1500 | Wiki同样1500/450/3天 | 利息周期可确认；债务从1950变1500的中间处理未拍到，不能按DAY11强制重置 |
| 后期蓝鸟机构 | 录像尾贷款UI可见5000产品 | Wiki5000/50/日 | 与橙色双手、红AJK产品不可仅凭摆位混为同一个贷款 |
| 其他机构 | 该录像不足 | Wiki红AJK5000/500/2天；橙色双手5000/500/日 | 仅候选资料，名称/解锁/逾期仍未知 |

来源：[V1事件记录](../../src/reference-events.ts)、[W1贷款页](https://noumbrellasallowed.fandom.com/wiki/Loans)。百分比为本次按显示数字计算的推断，不是反编译原作公式。

尚未确认：可借额度计算基数、舍入、首次计息日、当天提前还本金是否免当日息、逾期是否滚入本金、宽限期和信用等级、破产条件检查先后。实现必须拆开 principal、accruedInterest、nextDueDay、periodDays、rate/flatFee、status，不能只留一个 debt 数字。

### 货架、库存、推荐、维修与花

- 库存应区分拥有、上架、出租、维修中、已出售、已移交；物品必须有唯一实例ID，同名不能视为同一件。1.0.0官方明确修复“维修中仍在货架”，0.11.7提及物品锁定功能；这两个约束应进入测试。[P1](https://steamcommunity.com/app/1301390/announcements/?l=english)、[P5](https://store.steampowered.com/news/app/1301390/view/2966167980991977123)
- 维修：录像邮票98→196，收费59；获得 Slightly Damaged 与 Repaired Item。官方确认按物品收费，非统一50。[V1](../../src/reference-events.ts)、[P3](https://store.steampowered.com/news/posts/?appgroupname=No+Umbrellas+Allowed&appids=1301390&enddate=1626071179&feed=steam_community_announcements)
- Wiki称每日最多2件、50+约5%修后价值、可能即时/隔夜。收费公式只有“约”，不是确认系数。2023攻略倾向Valueless隔夜，但Wiki说不是绝对；须实验。[W2](https://noumbrellasallowed.fandom.com/wiki/Appraising)
- 推荐争议：2022攻略说修复品不适于社团、可放中间格；2023攻略说社团仍可能接受、价格较低。至少“不能放推荐格”不成立。后者对中心格Wittiness增减观察为±1，门槛会随现有等级变化。[C2](https://steamcommunity.com/sharedfiles/filedetails/?id=2820394308)、[C3](https://steamcommunity.com/sharedfiles/filedetails/?id=3010421920)
- 租赁费用候选：2/3/4天分别为估值1/3、1/2、2/3；这是较晚玩家攻略数据，0.10.0已重做租赁，旧版攻略更不能混入。当前未覆盖租赁，未来加入时必须处理离架、到期、损伤、遗失与归还，不可只做“卖出后再凭空拿回来”。[C2](https://steamcommunity.com/sharedfiles/filedetails/?id=2820394308)、[P3](https://store.steampowered.com/news/posts/?appgroupname=No+Umbrellas+Allowed&appids=1301390&enddate=1626071179&feed=steam_community_announcements)
- 花：录像Horong50、持续3天可确认；实际幸运效果未知。官方承认Adam会改变买入物品状态；所以只有放盆栽和倒计时不等于花系统完成。[V1](../../src/reference-events.ts)、[P1](https://steamcommunity.com/app/1301390/announcements/?l=english)

### 日结、存档和失败

- 视频日结是账本证据：实际收支、交易和利息应形成可回看记录，不应反向从日结截图造现金流。最优/最差交易计算公式尚未确认，不能默认为最高/最低售价格。
- 原作至少从0.7.0起就可回到某日产生新分支，保留旧路线。[P2](https://store.steampowered.com/news/posts/?appids=1301390&enddate=1606744297&feed=steam_community_announcements) 当前原型New/Load共用start完全不满足此行为。
- 社区结局资料区分现金破产、未付债务利息、拒绝罚款后被固定、未登记；Wiki称开店时现金≤0可触发破产。准确检查时点、宽限期、同日偿债后的优先级仍需1.0.5实测。[W2结局页](https://noumbrellasallowed.fandom.com/wiki/Endings)、[C2](https://steamcommunity.com/sharedfiles/filedetails/?id=2820394308)
- 当前 `Math.max(0,cash-owed)`会抹去没付出的债务；没有游戏结束/债务逾期状态。连续拒绝所有收购后继续开店应是完整可判定分支，而非卡住、隐形补钱或无限零现金。

## 跨来源冲突登记

| 冲突 | 处理 |
| --- | --- |
| 官方英文1.0.0雨伞罚款句可读作“每天收罚款”；韩文原文说修复了展示雨伞时每天出现罚款的现象 | 按作者韩文原文排除“因此必定每日罚款”的推论；具体处罚间隔仍待原作实验。[韩文公告](https://steamcommunity.com/app/1301390/allnews/?l=koreana) |
| Darcy500/25、1500/15、4000/200、6100/305 | 分初始特别贷款与后续产品，再标状态相关额度；不选一个数字覆盖其余 |
| 修复品完全不能推荐 vs 可进中心格/部分推荐也可 | 明确“中心货架”和“客人定向推荐”不同；社团实际判定未确认 |
| 维修固定50 vs 50以上且随物品变化 | 0.10.0之后官方+录像59可反证固定50；完整费用公式未知 |
| 垃圾桶通常500—1000 vs 评论2400 vs视频13 | 不存在固定13奖励的证据；随机分布、财富影响均未知，不能用平均值伪造 |
| 最新存档新闻标题显示Cloud Save | 正文宣布停用；只实现可靠本地分支存档，不宣称等同Steam云同步 |
| 2023攻略的数字与视频同类物品不同 | 先检查版本、声望、真实物品属性和NPC条件，不能为对齐样本硬改基础值 |

## 本地实现缺口（2026-09-21研究开始时快照）

| 优先级 | 位置 | 问题与后果 |
| --- | --- | --- |
| P0 | src/engine.ts:19；src/main.ts:127、139、174 | 开场、进办公室、跨日、结尾根据录像覆盖cash/loan，直接抹去玩家选择 |
| P0 | src/engine.ts:27—31 | 录像成交价当NPC接受阈值；没有对应库存仍能出售加钱 |
| P0 | src/main.ts:44、139；src/engine.ts:34—35 | 游戏重置、跨日没有独立持久化/账本/到期任务；负债不足被归零 |
| P0 | src/main.ts:169—171 | 借贷UI由日期/截图摆位选择，债务与本金利息混为一体；重复贷款/提前还款无通用规则 |
| P1 | src/data.ts:14；src/engine.ts:31 | 声望和属性依附录像某次来访；已有库存估值快照不会跟当前声望自然变化 |
| P1 | src/engine.ts:19 | 私藏槽和宝石工具按视频秒数解锁，无教程完成/日期条件 |
| P1 | src/main.ts:131、164 | 只有Horong倒计时；维修只认邮票标题并直接改卡，无可修条件/容量/隔夜/取回 |
| P1 | src/main.ts:152；src/auxiliary.ts:157 | 任意日显示DAY6日结，最佳交易、日历和贷款数据都可能与玩家实际经营不符 |
| P1 | src/engine.ts:10、37 | 库存缺少锁定/维修/出租/取得日等状态；同名出售按title匹配 |
| P1 | src/main.ts:156 | 设置/资料按钮无动作；Load与New无真实区别 |
| P2 | src/main.ts/auxiliary.ts | 城市、登记、社团、声望、垃圾桶、举报叙事只是录像路径的局部事件，缺少完整前置和后续 |

这些是阅读实现得出的工程判断，不依赖攻略推测。当前文件可能被后续实现修改，行号是研究快照；改后应重审。

## 30分钟完整MVP与原版全系统的边界

原作本来就有30笔交易的Challenge Mode，适合做独立而可结束的短验证；1.0.0又加入花店、维修、拍卖。[P4](https://store.steampowered.com/news/posts/?appgroupname=No+Umbrellas+Allowed&appids=1301390&enddate=1630674588&feed=steam_community_announcements)、[P1](https://steamcommunity.com/app/1301390/announcements/?l=english)

但这只是候选产品切片，**不替代用户当前要求的1.0.5全部可见机制**。若使用DAY6—11研究场景，应明确起始存档是预制条件，以后完全由玩家行为推进；结束时给实际账本结算和重新开始/读档，不能突然退出到静态街景。若新建30笔挑战，应独立命名、独立存档，不能用Challenge入口偷偷启动DAY6剧情。

完整MVP最少要满足以下验收；这些是本项目工程验收建议，不声称全是原作逐字规范：

- [ ] 不开任何录像检查点也能开始、经营、结束、重新开始。
- [ ] 同一初始状态，报价40/45/50/拒绝四路的余额差异持续到下一天；只发生有凭据的账本收支。
- [ ] 无货、下架、维修中、已卖出和同名不同实例均正确；不能重复卖出、同时租出和上架。
- [ ] 买入时的玩家鉴定固定，独立真实属性用于客人检查；后续声望更新可影响应影响的估值项。
- [ ] 每笔交易只结算一次；刷新、双击、返回界面不能复制物品或金钱。
- [ ] 借款只发放一次；本金/计息/提前还/到期/不足金额完整；每个日结只处理一次。
- [ ] 花有购买、活跃、到期状态和确有依据的效果；未知效果明确标为研究待定。
- [ ] 维修有合法物品选择、费用显示、支付、离架、处理、取回、修复卡与重复维修拒绝。
- [ ] 日历、摘要、最好/最差交易与实际流水一致，借入本金不伪装营业利润。
- [ ] 存档覆盖钱、库存实例、价签、日期、债务、工具、花、事件完成、声望和随机状态；读旧日生成分支。
- [ ] 失败分支有可读原因、恢复入口；没有未实现按钮或必须按录像答案才能离开的客人。
- [ ] 正常策略、全部拒绝、不借款、激进报价、错鉴定、乱上架、维修隔夜、刷新恢复至少各完成一次独立全流程。
- [ ] 每条未知公式都列于证据表，测试预期独立编写；录像答案不能同时成为运行时判断和测试标准。

## 下一轮最有信息量的原作实验

1. 同一DAY存档改变成交价，只看下一位现金，验证禁止检查点回填。
2. 记录Darcy贷款可用额度与现金/净资产；只卖一件、只上架、只还款后分别重开面板，找额度依赖项。
3. 同一Executor贷款分别当天、次日、第三日还，完整拍摄本金/欠款/日息/日历和日结，不跨切。
4. 两件不同价格邮票/同损伤物品维修，测试收费公式；再测Valueless、当日第3件、修复品再次送修。
5. 不买花与买Horong从同一存档比较多次完整日，不把一次多来一个客人当确定因果；记录所有随机条件。
6. 修复品分别放中心格、推荐给普通客、推荐给社团，分开记录可接受性和声望后果。
7. 在1.0.5保存图实际回退一日，分叉经营，确认旧分支保留以及保存时点。

可用资料尚不足以确认上述隐藏系数；准确的下一步是缩小不确定性并补全架构，而非把搜索结果中的某个数值直接硬编码成“原作真值”。
