> 此文件保留此前录像重建阶段的历史记录。当前实现与自由游玩验收请看 [SYSTEM_STATUS.md](SYSTEM_STATUS.md)。

# 53次来访真实UI回归

最新补充回归在2026-09-21固定构建`index-DVr-CqYr.js`通过，报告为`artifacts/qa/day9-finance-report.json`：全部53次来访、43次结算、10次剧情、五次跨日，0页面/控制台/请求错误。除了下面初轮已覆盖的行为，还真实完成：

- Darcy Pay Off：1851→1351，债务500→0。
- 邮票年份工具1988→自动History页→真实拖入Archaeological Value；以60购买后库存估值98。
- 从DAY9街道实际步行到广场Office，登记2420→1120；重复输入不重复扣1300。
- 原对白衔接录像中剪去路线后的维修内景；选中库存邮票→Show→接受59维修，1120→1061；物品估值98→196、损坏标签改为Slightly Damaged并增加Repaired Item。收费、状态和原图详情均通过。
- 继续走完最后11位来访，再次完成250罚款、Executor1500还清、REPORT及末尾街头库存。
- DAY11贷款面板1500→PAID、末尾街头ARRESTED与53/D-5两项旧视觉缺陷已看图确认关闭。

该轮仍使用followRecording，记录13次录像剪切的现金恢复；`acceptance.fullVisualFidelity`保持false。上述检查不等同于全原游戏所有分支及像素100%等价。

该轮之后只修正一张原图：登记完成事件展示从2918秒半句改为2918.2秒完整“It's done. You're free to go.”，保留红色−1300。PNG已实际查看并替换，未改收费逻辑；最终打包需包含此原图。

初轮于同日在本机安装的 Google Chrome（headless，1920×1080，DPR 1）通过固定预览 `http://127.0.0.1:5174` 完成；构建文件为 `index-6Xh7VG5f.js`。脚本为 `scripts/verify-session.mjs`，初轮详细结果保留在 `artifacts/qa/session-report.json`。下文保留初轮发现及修复经过。

所有推进、报价、拒绝、借还款和举报均使用真实指针或键盘输入。只通过 `render_game_to_text()` 读取状态，测试没有写入游戏状态。已知录像价格使用计算器逐位输入；成交金额未见的来访使用 Decline。

## 已验证的交互范围

- 53/53次来访：43次买卖/拒绝结算、10次剧情；每次结算后重复输入不重复改变现金或库存。
- DAY6到DAY11五次跨日，夜间广播→离店门→街道E进入日结→Sleep→街道E回店→早报均可完成。
- Rabbit前真实打开账簿借款：1225→2725，Executor债务1950，再以1789成交。
- 250罚款真实选择支付：1114→864。
- 私藏槽教程剧情和两次Okay说明均可达，最终privateUnlocked与gemUnlocked为true。
- Rabbit以3303售出后，真实点击Executor Pay Off：4001→2501，债务1500→0；重复点击不重复扣款。
- 在录像中的Hoverboard for Display来访时真实使用REPORT：今日/本周0→1，现金保持2501，重复点击不增加；屋顶折叠/展开及TODAY/THIS WEEK悬停标签已截图检查。
- 最后Darcy剧情进入finalStreet，现金2431；街头库存实际打开并出现已有物品命中区。
- 浏览器页面错误、控制台错误、请求失败均为0。

这次运行采用游戏内的followRecording模式；记录了13次起始现金或结尾街头剪切恢复。因此结果证明这组录像来访可以通过真实UI走完，不证明尚未补全剪辑间动作的连续自由经济，也不证明所有书页、工具分支和视觉细节已全部验收。

## 初轮截图问题（已在最新补充回归关闭）

1. **还款面板静态金额未随状态更新。** DAY11实际Executor债务1500，但打开账簿的位图显示1950；支付后实际债务为0，位图仍显示1950和Pay Off。见 `session-executor-payoff-before.png` 与 `session-executor-payoff-after.png`。还款机制通过，面板视觉状态没有通过。
2. **结尾街头仍显示早期示威场景。** finalStreet已进入public-square-later，但截图中为WE WANT CHANGE人群；视频最后段为ARRESTED及53/D-5。见 `session-final-street-inventory.png`。结尾场景切换与库存机制通过，实际背景阶段没有通过。

上述问题分别由主实现与街道代理修复，新构建截图为`day9-finance-executor-payoff-before.png`、`day9-finance-executor-payoff-after.png`、`day9-finance-final-street-inventory.png`。`session-report.json`保留当时的缺陷证据；最新报告记录具体关闭结果，两份报告都没有将流程通过解释为全像素等价。

## 本次过程中发现并复测的阻断

- **旧资金阻断：** 初版到DAY8 Gioconda只有380，无法支付450，未跳过也未注资。街道现金事件及录像现金断点接入后，最终复测该笔以455起始可成交。旧报告为 `session-report-before-street.json`。
- **新一天首位出售访客模式错误：** DAY9靴子买家应进入sales，但街道返回的`moveMode('shop')`覆盖了`loadVisit()`决定的模式，导致`sales-customer`入口不存在。主实现修复后，在固定构建中完整复测通过。失败报告为 `session-report-day9-mode-bug.json`。
- **测试选择器修正：** Executor借款后账簿切换至另一面板，关闭按钮ID由`loan-close`变成`aux-close`。借款本身成功，测试已按实际当前按钮关闭；这不是游戏死锁。原报告为 `session-report-loan-close-selector.json`。
- **开发环境刷新：** 在开发服务器5175运行时，其他代理改动触发HMR，将进度重置到DAY6。该次运行没有计为产品通过，报告为 `session-report-hmr-interruption.json`；最终使用冻结dist的5174重新从头走完。

主代理另行发现并修复了夜间NPC命中区遮挡离店门、结算后大范围Next遮挡日历的问题；这里的完整流程覆盖修复后的离店行为，日历专项验证由主代理执行。

复现命令：

```sh
TEST_URL=http://127.0.0.1:5174 node scripts/verify-session.mjs

# 包含邮票鉴定、DAY9登记/维修并继续全部53次来访
TEST_CONTINUE_AFTER_FINANCE=1 node scripts/verify-day9-finance.mjs
```

运行会覆写`session-report.json`和同名截图；上述视觉问题修复后应保存新构建标识并更新独立截图复核结果。
