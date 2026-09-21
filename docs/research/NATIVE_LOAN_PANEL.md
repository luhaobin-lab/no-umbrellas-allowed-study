# 原生贷款面板：动态组件与复核

日期：2026-09-21。组件：`src/native-loan-panel.ts`。它只负责绘制当前贷款记录、登记操作区域，不计算利息、不改变余额、不读取录像成交数据。

## 界面契约与来源

玩家打开贷款账簿后，先看到债权人头像，再看到每周期利息、当前还款额或可借额度，最后通过 `Pay Off` / `Get Loan` 操作；上方三角区域关闭面板。支付不足时按钮禁用；已还清、终止记录使用淡化卡片与状态章。贷款收支反馈和余额更新由 engine / main 的现有处理负责。

动态信息顺序采用用户视频的 2521 秒与 3395 秒原帧。面板以原坐标 `(1206,90)` 绘制为 `678×420`；卡片 `330×114`，两列三行，行间隔 120。头像 `105×108`，操作按钮 `216×42`。空位置保留底板的深色槽，不能填成浅色大方块。

原生资产来自官方免费 **1.0.5 Demo** 的 `sharedassets4.assets`：已有 `loan_main`、`loan_slot`、`loan_button`、`loan_status`、`loan_Darcy`、`loan_executor`；本轮补充 `loan_button_pressed`（path ID 80）、`loan_ajik`（82）、`loan_bbCapital`（70）。新增文件来源见 `native-loan-extra-assets.json`，完整 Demo 哈希与取得方式见 `NEGOTIATION_DEMO_FACTS.md`。没有将含旧金额的截图用于组件。

当前 engine 的 `avac` ID 在用户视频中对应红色 Ajik/AVAC 标识，使用 `loan_ajik`；独立 `bluebird` ID 才使用蓝色鸟标 `loan_bbCapital`。这一点已用图像比对排除名字误认。

官方 Demo 的 `LoanEntryDisplayManager` 静态检查确认：在贷状态显示即时还款报价；利息、状态、按钮文字统一使用债务色；可借状态使用常规色；已还清/终止记录淡化盖章且不能操作；还款按钮需余额足够。`LoanDisplayManager` 显示列表最多取六项。这里只独立实现这些行为，没有搬入原 C# 实现。

## 接入

```ts
renderLoanPanel(ctx, {
  entries, // LoanPanelEntry[]；严格保留调用方提供的顺序
  draw, text, hit,
  cash: game.state.cash,
  onClose: () => { showLoans = false; dirty = true; },
  onAction: (id, action) => runAux(`loan:${action}:${id}`),
});
```

- `entries` 必填 `id,name,principal,payoff,interest,cycle,overdue,active`。`interest` 是每周期金额，`payoff` 是当前真实还款额，不应把未结利息在 renderer 再加一次。
- `draw` 与 `text` 兼容 main 的现有函数；`text` 应使用 `OrangeKid`，参数是 alphabetic baseline。普通信息 em 大小 26，按钮 34，均是本地原帧测量校准值；长金额按信息区域宽度缩字，不遮盖头像或另一张卡。
- 保留 `loan-pay-${id}`、`loan-get-${id}`、`loan-close` 控件 ID。`loan-panel` 吞掉落在面板空白上的点击，防止触发背后的游戏控件。
- 可选 `pressedId` 使用原生按下按钮；可选 `currency` 默认 `V`；可选 `portrait` 支持其他已确认债权人图像。
- 不传 `status` 时由 `active` 选择在贷/可借。若要同时显示新贷款与旧的 `PAID` 记录，用独立记录和稳定 `key`，旧记录传 `status:'repaid'`。不能把原有 repaid 对象直接替代当前可借报价。
- 状态章为动态文字。逾期信息通过动态还款额和可访问标签呈现，没有凭空添加新的逾期按钮或图标。

## 六种独立浏览器图

运行：`node scripts/verify-native-loans.mjs`。输出 `artifacts/qa/native-loans/report.json` 及：

1. `active-debts.png`：Darcy + Executor 在贷；付款区与原生头像完整。
2. `available-three-lenders.png`：两张可借卡与一张在贷卡；AVAC 红色标识、两列换行。
3. `paid-record-and-new-offer.png`：已有报价及执行官 PAID 记录；旧记录不能再次操作。
4. `overdue-insufficient-cash.png`：逾期且余额不足；还款禁用。
5. `empty-ledger.png`：没有贷款时仅保留原生深色底板。
6. `six-cards-large-amounts.png`：三行六张卡、大金额、PAID 与 STOPPED；内容没有越过外框。

这些是**隔离的组件测试图**，使用此前商店截图作为静态背景，面板本身全部实时绘制；不是从真实游戏达到这些状态的游玩证明。脚本检查了六种场景的控件数量、禁用回调不可执行、操作区域未越界与资源/脚本错误，均通过。接入后的真实借款、还款和存档仍须用游戏 UI 复测。

## 实际视觉检查与余差

已在 1920×1080 浏览器图中逐项确认：缺失头像、错误的大格子、额外名字行、混合字体和扁平按钮问题已由新组件修正。固定同金额的 Darcy 卡与视频 2521 秒对照，首行红字范围由原实现约 187 像素宽校准至 162 像素，原帧约 161 像素；按钮红字左右边界均为 x=1391..1473。卡片位置、头像比例和按钮区域对齐。

仍不宣称像素 1:1：浏览器 OrangeKid 栅格化的笔画比录像的 Unity 字体更厚；首行字底可相差约 3 像素，按钮纵向约 1 像素；状态章文字、透明度与斜角尚未逐像素验收。新组件图不验证贷款面板滑入/收起动画。真正的整屏对照还需同步 NPC 与背景动画，并独立检查 main 接入结果。
