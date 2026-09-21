# 可见现金动作审计

金额带符号；`unresolved-change` 的 amount 永远是 null，禁止运行时用它修补资金。

|事件|时间|类型|金额|屏幕|
|---|---:|---|---:|---|
|day6-junkjunk-scavenge|587|scavenge|13|street-b2-junkjunk|
|day6-street-cut-cash|596|unresolved-change|None|street-east|
|day6-darcy-interest|704|interest|-25|day-summary|
|day7-horong-purchase|738|purchase|-50|flower-shop|
|day7-morning-cut-cash|765|unresolved-change|None|shop|
|day7-street-items-cut|1685|unresolved-change|None|street-east|
|day7-darcy-interest|1690|interest|-25|day-summary|
|day8-executor-loan|2182|loan|1500|loans|
|day8-darcy-payoff|2526|repayment|-500|loans|
|day8-night-cut-cash|2538|unresolved-change|None|shop|
|day9-renunciation-raised|2781|rule-change|0|shop|
|day9-officer-cut-cash|2796|unresolved-change|None|shop|
|day9-registration-fee|2918|registration|-1300|stabilizer-office|
|day9-stamp-repair|2962|repair|-59|repair-shop|
|day10-fine-250|3007|fine|-250|shop|
|day10-visitor-cut-cash|3045|unresolved-change|None|shop|
|day10-fine-waived|3055|rule-change|0|shop|
|day11-executor-payoff|3398|repayment|-1500|loans|
|day10-day11-blackcard-transition|3133|unresolved-change|None|street|

## day6-junkjunk-scavenge

- 587秒B2 JUNKJUNK西侧垃圾桶明确出现E Scavenge。
- 590秒对白“…13U.”；591秒现金428→441。
- 金额13是本次实际拾取结果，不代表每次垃圾桶固定产出。

## day6-street-cut-cash

- 595秒B2走廊现金441；596秒画面直接转到B1 GEM附近且现金573。
- 净变化+132，但没有看见这132对应的拾取/售卖操作；不能自动命名为Scavenge或直接发钱。

## day6-darcy-interest

- DAY6睡前现金573；DAY7起床704秒现金548，差25。
- 此前借款面板明确Darcy Indebted500、Interest25U/1days；与每日利息吻合。

## day7-horong-purchase

- 736秒花店Horong前显示E Buy(50U)。
- 738秒红色−50U与余额548→498；744–748秒店主明确未来3天好运。

## day7-morning-cut-cash

- 764秒店内晨间广播后余额498；765秒直接进入Fixie-made Bag鉴定，余额398。
- 净变化−100，没有看见给乞丐、缴费或另一笔成交；不把该缺口写成捐赠/税/罚款。

## day7-street-items-cut

- 1684秒店内日终广播仍400；1685秒直接切到GEM外，余额480。
- 同时右侧库存显示Picked-up Remote Control、下一帧Picked-up Hoverboard。
- 发生街道拾物可以直接看到结果，但+80的实际触发动作未出现在已审帧；保留未确认，不能自动凭净差发80。

## day7-darcy-interest

- DAY7夜间街道1685–1689现金480；1690进入DAY8店内现金455。
- Darcy500借款未偿清、每日利息25仍有效。

## day8-executor-loan

- 2178秒Executor面板Available1500、Interest450U/3days，鼠标在Get Loan。
- 2182秒余额1225→2725，面板变Indebted1950。
- 1500本金到账，同时将450期利息计入应付1950；不可误建成旧借款1950再加1500。

## day8-darcy-payoff

- 2524秒Darcy面板Indebted500，旁边Executor1950。
- 2526秒出现红色−500；2528余额1851→1351，Darcy卡盖PAID。
- Darcy还清后新报价Available4000、Interest200U/1days，不是继续500额度。

## day8-night-cut-cash

- 2536日终店内现金1351；2538仍见日终广播及打开日历，但余额1584。
- 净变化+233，已审画面没有对应触发动作，不伪造成拾取收益。

## day9-renunciation-raised

- 2776–2778：I have no choice but to raise your Renunciation rate.
- 2781：Your Renunciation rate is now 10%.
- 本对话期间现金1451不变；这是规则变化，不是即时扣款120。

## day9-officer-cut-cash

- 2795执法者对白末尾现金1451；2796直接切邮票卖家，现金1331。
- 净变化−120，没有可见付款或收据。不得标为已确认罚款。

## day9-registration-fee

- DAY6 Darcy要求去Stabilizer办公室取得Blue Plates，预告登记费1300（原前段对话）。
- 2916秒在Stbl.Office与窗口人物交谈，2918秒红色−1300，现金2420→1120；对白“It is done. You are free to go.”。

## day9-stamp-repair

- T REPAIR柜台，选择88 Seoul Olympics Post Stamp。
- 2958–2961显示Okay, good / I will come back again选择，2962红色−59，1120→1061。
- 2968后物品条件从Fairly Damaged−60%改善为Slightly Damaged−20%，估值98→196。

## day10-fine-250

- 3001–3002执法者明确“The fine is 250U.”，3003出现付款/不付选项。
- 3006对白Great，3007余额1114→864；3008又可见250金额。

## day10-visitor-cut-cash

- 3044上一位时光装置顾客道谢，现金629；3045切换执法者时余额589。
- 净变化−40，付款动作未显示；下一条罚款威胁后来明确免除，所以这40不是该段已确认罚款。

## day10-fine-waived

- 3055–3056执法者说“Wait. I changed my mind. Don’t mind the fine.”。
- 随后要求所有相关对话保密，禁止转售Yujin Oh相关物品并要求扔进垃圾场。
- 3045–3085余额一直589；没有再次缴纳罚款。

## day11-executor-payoff

- 3396面板Executor Indebted1500（已不含前述450利息），玩家点Pay Off。
- 3397现金4001→2501，3398红色−1500与PAID印章。
- 还款发生于兔子雕塑卖出3303之后；不能把净增1803当作雕塑卖价。

## day10-day11-blackcard-transition

- 3096秒DAY10货架现金840；3097–3132是全黑叙事卡，未显示任何现金动作。
- 3133恢复DAY11街道现金460，差−380。
- Executor在DAY8借1500、利息450/3days；DAY11还款面板债务1500说明450利息已清，但付款时点未显示。
- 不能凭净差反推不存在于画面里的+70拾取，或把−380全部当利息。

逐秒复核后，所谓40与120罚款都不成立：40段威胁被免；120段只明确提高Renunciation rate至10%。登记1300、邮票维修59、执法者罚款250则都有可见动作/选择与金额。

已看过scavenge、花店、借款、还款、登记、维修与罚款全图并校正热点坐标。图片是1920×1080证据帧，热点可能来自同动作的前置选择帧；不是用整帧当动态可交互场景。
