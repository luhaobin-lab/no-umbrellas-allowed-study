# 官方1.0.5 Demo：经营数学核验

检验日期2026-09-21。来源为[作者官方公开Demo](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)，包的文件名、大小、SHA-256见 [demo-source.json](../../reference/research/demo-source.json)。此次检查 `Assembly-CSharp.dll` 的UI调用与 `HoochooGames.NoUmbrellasAllowed.dll` 的规则实现，并用自写临时.NET程序直接调用原DLL交叉验证。临时反编译和探针仅在 `/tmp`，产品中没有复制原作源代码。独立实现见 [economy.ts](../../src/economy.ts)。

这是官方Demo构建证据，强于无版本玩家攻略；仍不自动证明零售版1.0.5每一资产配置都相同。数学输出保存在 [demo-economy-results.json](../../reference/research/demo-economy-results.json)，共有18项直接DLL调用结果。

## 贷款

源类型/方法：`HoochooGames.NoUmbrellasAllowed.Loan` 的 `estateIgnoringLoans`、`estate`、`darcyLoan`、`interest`、`isPayday`、`reimburseDebtPrice`、`recinterest`、`payInterests`、`onReimburse`；UI类型 `LoanEntryDisplayManager`；逾期失败 `Pawnshop.checkOverdue`。

设现金C，库存**真实物品卡片**估值总和V，活跃贷款本金合计D。`trunc`为朝0截断。

- 净资产 E = trunc(C+V) − D。忽略已还、取消和未借的offer；不用上架价、买入价或玩家错误鉴定价。
- Darcy下一笔可借额 = max(500, trunc(E/200)×100)。年/月利率不适用；显示的rate是每周期费率。
- 周期利息 I = trunc(本金P × rate)。本金不按未付利息自动复利。
- 借款日S、周期K、当前日T，活跃且T≥S时，(T−S+1) mod K = 0为付息日。因此1日周期在借款当天就到期；3日周期在S+2首次到期。
- 提前还款价：trunc((T−S)/K)=0时为P+I；否则为P+I×overdue。UI比较现金是否足够支付整个报价，只有足额才启用还款按钮。
- 当周期利息付得起，扣一期I且overdue清0；付不起则不部分扣款，overdue增加1。任何活跃债务overdue≥3置`failByOverdue`；这是连续未付周期数，不是始终“欠3天”。

### 能直接解释录像的独立实验

以DAY8借Executor1500、rate0.3、周期3：原DLL给DAY8/9/10提前还1950，DAY10付息日；DAY11/12还款1500，DAY13又是付息日。这解释录像1950→1500，无需凭空把债务改成1500。

其他直接调用：净资产7999时Darcy额度3900，8000时4000；零现金的25元日息连续三次不付，overdue依次1、2、3，只有第三次出现失败标志。

### 贷款产品静态配置

| 内部creditor / 原生头像 | 初始本金 | 周期rate | 周期天数 | 再次发放 |
| --- | ---: | ---: | ---: | --- |
| executor / loan_executor | 1500 | 0.30 | 3 | 还清且日期<25时再给offer |
| granmagwak / loan_granmagwak | 600 | 0 | 1 | 还清且日期<25时再给offer |
| investor / 红色loan_ajik | 5000 | 0.10 | 2 | 一次剧情提供；还清后不自动再发，无递增 |
| central / loan_mindlesia | 5000 | 0.10 | 1 | 还清再给同产品 |
| capital（首次）/ 蓝色loan_bbCapital | 5000 | 0.01 | 1 | 下一笔不同，见下行 |
| capital（后续）/ 蓝色loan_bbCapital | 8000→12000→17000→23000，之后23000 | 0.10 | 2 | 按上一笔本金阶梯递增 |
| darcy（初始特别贷款之外）/ loan_Darcy | 按净资产公式 | 0.05 | 1 | 每次还清重新计算并创建offer |

证据位置：Loan静态初始化类及`capital`/`onReimburse`。这揭示社区把图标或阶段混用的风险；不能拿某次显示5000/50认定整个机构永远1%日息。初始剧情1500/15不由上述Darcy循环产品生成，需要脚本/场景单独核验。

### 已纠正的机构映射错误：视频红Ajik不是Bluebird Capital

先前将本项目legacy ID `avac` 接到 `capital` 的首次优惠和递增规则，是**本次研究接入错误**，不能视作已核实原作行为。2026-09-21通过三层证据纠正：

1. 目标视频DAY11，[3395.6秒贷款面板](../../reference/loans/3395.6.png)红色Ajik图标旁清楚显示本金5000、每2天利息500。同日贷款提前结清为5500。
2. 原生`LoanEntryDisplayManager.UpdateLoanEntryDisplay`按`loan.creditor`查`thumbnails`。`sharedassets4.assets`组件path195的原生字典键/图片指针数组确定 `investor → loan_ajik(path82)`、`capital → loan_bbCapital(path70)`、`central → loan_mindlesia(path94)`。完整七机构映射见[demo-creditor-portrait-map.json](../../reference/research/demo-creditor-portrait-map.json)。红Ajik也不是`central`，所以`central`的1天周期与这张视频没有冲突。
3. 原生`resources.assets` StoreEvent path24063、名称`D21_investor`中的`AddLoanOfferData`明确为`loanID=investorFirst`、provider `Character path23832/ID investor`、`loanAmount=5000`、`interestPercentage=10.0`、`interestFrequency=2`。`AddLoan()`用provider.ID作为creditor、百分数除100作为rate。该剧情事件`canPlayMultipleTimes=0`；`Loan.onReimburse`没有investor/investorFirst分支，所以还清不会创建新offer，不能追加Bluebird的8000档。

结论：本项目视频目标的`avac`只是旧UI别名，应对应原生`investor/investorFirst`：5000 / 10% / 2天，单次提供。没有首次1%条款，没有额度递增。Bluebird的独立阶梯仍有原生证据，但不能出现在这个红色机构上。直接DLL产品与回调验证见[demo-creditor-products.json](../../reference/research/demo-creditor-products.json)。脚本资产名称D21与视频出现DAY11的时点不同，名称不能直接当作目标MVP的解锁日期依据；录像DAY11能确认其当时已提供。

### 明确有意修复的原作缺陷

直接DLL实验：现金200，同时有当日利息150与200；原作分别拿两笔与同一个初始200比较，然后合计扣350，最终现金−150。其排序按利息金额升序，循环中的累计变量没有参与可支付判断。

本项目 `accrueInterest`保留利息升序，但每次使用**剩余现金**，结果应为先付150、现金50，第二笔记未付200/overdue+1。测试写死这个有意修复，而不宣称它与原作缺陷逐行为相同。另加`lastInterestDay`防重复日结；在完整游戏控制层也应保证一天结算一次。

## 维修

源类型/方法：`Shops.RepairShop.fixable/getCase/repairPrice/requestFix/resolveFix`、`Runnable.OverwriteConditions.removeUselessCondition`；UI `RepairShopManager.SubmitItems/TryRepair`。

- 接受资格看**玩家信息卡**：Fairly Damaged或两种Valueless卡之一，且没有Repaired或Totally Wrecked卡。
- 实际维修类别和价格看**真实物品卡**。真实Fairly→即时，价格显示trunc(50+真实现值×0.1)；真实Valueless→隔夜，显示trunc(50+真实现值×0.2)；真实损伤不属这两类→50元卡片纠正。
- 因而“玩家贴Fairly但物品真实只是Slightly”会获得纠错服务；不是把玩家想象的严重损伤当真实损伤。该机制可以解释攻略称维修时长并不总跟展示损伤一致。
- 修复完成同时更新真实卡和玩家卡，移除旧损伤，增加Slightly Damaged及Repaired Item；保留物品实例、买入价、锁定等属性。送修从货架移除；隔夜项目存到两个取回槽，取回才更新。
- 维修UI一次最多选2件；目前代码证据只证明**每批2件**，不单凭它宣称每日2件。每日服务限制还受场景对话状态机控制，尚未复核。
- Challenge模式在申请后立即resolve包括原本隔夜的项目；不要把这个特例套在剧情模式。
- 录像邮票真实现值98，50+9.8取整59，与实付59交叉一致。

本项目helper另拒绝已经送修、出租、拍卖中的实例，防止重复使用；这是完整库存状态约束。费用helper只计算报价，原UI剧情负责实际付费，因此API不自行扣两遍钱。

## 日结最佳/最差

来源 `EndOfDayDisplayManager.CalculateProfitMarginPercentage/CalculateProfitMargin/ShowCards`。

只考虑当日已售记录，按实例ID找到买入记录；买入价为0的赠品不参与利润率排名。先以整数买卖价计算32位float利润率并朝0截断，再按绝对利润打破平局。排列为利润率降序、利润降序。`compareDailyTrades`只实现此排序；可用于当前账本，没有从当天视频借最佳/最差图片。

原UI单件亏损时有一个边缘问题：它先把相同的最佳/最差去重，随后再隐藏不盈利的最佳，可能两个高亮都没有。产品可清晰显示这笔亏损，需标为完整性修复，不把这段原代码故障照抄。

## 花的补充状态事实

来源 `Shops.Scented.buyFlower/checkFlower/getAvailableFlowers`：买花设置当前type并把life置3；不是累加3天。一天检查递减life，归0清当前type。商店有3个销售槽，花型候选1—5，已摆出及当前持有花会被排除。具体花型名称、价格和经营效果需要剧情/其他规则进一步映射，不能从type数字猜。

## API与检验边界

`LoanAccount`：id、principal、rate、cycleDays、startedDay、status、overdue、可选lastInterestDay；参数不涉及录像时间戳。

- `loanLimit(cash, inventoryTrueTotal, loans): number`
- `quoteRepayment(loan, today): number|null`，只有活跃且已经开始的债务有报价。
- `accrueInterest(loans, cash, today)`返回克隆后的loans、cash、paidTotal、unpaidTotal、各项charges、failure；处理一个真实经营日，不用它跳过未结算的几天。
- `repairQuote(facts)`返回eligible、cost、mode、reason、repairedCondition；调用者完成付费和送修状态机。
- `compareDailyTrades`、`tradeProfitPercent`提供账本排序。

16项模块测试（economy8、session-store8）及TypeScript检查通过。原DLL直接调用覆盖贷款数学和多贷款缺陷；维修报价/状态与日结是静态方法检查加录像交叉，未运行完整原游戏UI。不要把这个覆盖表描述成原作所有经营场景都已动态验证。
