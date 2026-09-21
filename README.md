# No Umbrellas Allowed 机制研究原型

本地试玩：<http://127.0.0.1:5174/>。本轮已移除录像余额覆盖和录像成交价判定；以持续账本、真实库存、独立物品事实和可保存的议价状态运行。

**这是参考视频 DAY6–11 的可玩研究片段，不是原作全游戏的完整移植，也尚未达到全画面、全部分支 1:1。** 当前验收与已知缺口见 [SYSTEM_STATUS.md](docs/SYSTEM_STATUS.md)。

最新已完成用户提供的两份 Demo 原文件解包研究，包含全部物品、卡、手册、工具、NPC管线及剧情动作证据，见[原文件研究总册](docs/original-study/README.md)。这些研究成果尚未全部接入当前试玩；原 DLL 对照已经测出原型仍有议价差异。

## 启动与测试

```sh
npm install
npm run build
npm run preview
```

开发服务器用 `npm run dev`。连续验收应对稳定的5174构建运行，避免热更新重置测试。

```sh
npm test
node scripts/verify-free-play.mjs
TEST_URL=http://127.0.0.1:5174 node scripts/verify-book.mjs
TEST_URL=http://127.0.0.1:5174 node scripts/verify-inventory.mjs
node scripts/verify-tool-readouts.mjs
```

Playwright默认使用本机Google Chrome。`scripts/verify-session.mjs`、`verify-flow.mjs`是旧的录像路线测试，不能用来证明当前系统规则正确。

## 操作

- New Game从录像DAY6初始局面开始。Load Game恢复本浏览器真实存档；每日开场存档可从桌上日历选择，旧分支保留。
- 鼠标移到桌面底中的放大镜展开工具栏；选工具后移到物品上检测。工具定位手册页，但不自动贴正确标签。
- 从书中拖标签到左鉴定单；同类替换，拖出移除。私有卡在剧情解锁后可使用。
- 右下报价器可输入数字，OFFER报价、ACCEPT接受当前还价、DECLINE拒绝。没有当前还价时，ACCEPT不会偷用录像成交价。
- 成交或拒绝后点顾客继续。货架和库存支持拖放、定价、移除；未持有或未挂牌的商品不会凭空售出。
- 日终外出并返回Darcy’s看实际交易日结，Sleep进入次日。贷款利息按实际借款日期和周期结算。
- 街道A/D或方向键行走，E交互；可去花店、维修、借还款及已录故事地点。修理会扣费并使商品下架，需隔夜的商品翌日归还。
- 设置提供声音、全屏、手动保存及存档返回菜单；约每2秒自动保存变化，页面关闭时再次保存。B打开书、F全屏、Escape关闭覆盖层。
- Challenge Mode提供30次来访的独立试验流程；该抽取顺序是研究原型的内容池规则，不是已证明相同的原作随机事件池。

## 研究资料

来源分别标注：用户提供的60分钟1.0.5视频；[开发者官方Windows 1.0.5 Demo](https://hoochoo-game-studios.itch.io/no-umbrellas-allowed)；官方更新记录；多份玩家指南。Demo的PlayerSettings确认为`1.0.5 Demo`，与完整版不是同一发行包，版本差异不会默认抹平。

- [官方物品与卡数据](docs/research/OFFICIAL_ITEM_DATA.md)：252张数值卡、目标物品真实属性及冲突核对。
- [议价规则](docs/research/NEGOTIATION_DEMO_FACTS.md)：直接核对到的参数和仍未覆盖的事件管线。
- [贷款、维修与日结](docs/research/DEMO_ECONOMY_FACTS.md)、[声望](docs/research/DEMO_REPUTATION_FACTS.md)：独立实现及对官方DLL的直接数值探针。
- [此前过拟合问题](docs/COMPLETENESS_AUDIT.md)：保留原故障复现，修复状态另见新验收。
- `docs/VIDEO_*.md`保留原视频逐段证据，不等于全部游戏内容清单。

视频书页、人物、物品与对白素材已保留；本轮另从公开Demo提取了仪器和空白UI组件。原生C#分析文件仅在临时研究目录中，产品以独立TypeScript规则实现运行。无需运行Windows游戏。

## 代码与状态

- `engine.ts`：持续会话、交易、所有权、按日推进。
- `item-facts.ts`、`demo-item-data.ts`：物品事实；`data.ts`里的录像最终鉴定仍只是历史观察。
- `negotiation.ts`、`economy.ts`、`reputation.ts`：可单独验证的规则。
- `accounting.ts`、`session-store.ts`：账本、结算和原子存档。
- `main.ts`、`street.ts`：实际鼠标键盘交互和原坐标界面。
- `window.render_game_to_text()`只读当前玩家状态；`advanceTime(ms)`用于受控交互测试。

`artifacts/qa/`保存真实浏览器截图及报告。测试通过仅证明报告中的场景；不把构建成功、样本通过或同一书页的像素一致扩大成全游戏完成。
