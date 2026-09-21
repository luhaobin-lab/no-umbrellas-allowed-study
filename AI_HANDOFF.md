# 下一位 AI 从这里开始

本次用户的最后指令是：先收尾，上传 GitHub，整理任务，以便换电脑由另一个 AI 继续。**这是一份可运行、可继续开发的交接版本，不是已经完成 1:1 的商业游戏。**

## 用户目标与已确定方向

用户最初提出废土餐车换皮，之后明确改为按《参考视频.mp4》和 No Umbrellas Allowed 原作完整复刻可见 UI、书、工具、买卖机制和 NPC 议价；后一个方向优先。不要重新改成 lowpoly 或自拟 UI。

用户要求多方交叉研究，允许研究他提供的程序文件。已确认两份都是 Demo，并明确让我们继续研究：Windows **1.0.5 Demo** 和 Mac **0.2.5 Demo**。运行时统一以 Windows 1.0.5 为准，Mac 只作版本对照。源包只有 DAY1—3 的 Level，不能把后期事件资产的存在解释为已恢复正式版完整日程。

核心体验是：NPC 带来真实物品 → 使用工具 → 自动翻到正确书页 → 从书里拖标签到左侧鉴定表或私槽 → 玩家报价、NPC 反应 → 买入、保存物品实例、上架、卖出、日结。目标 MVP 约 30 分钟，必须是可连续玩的完整循环。

## 新电脑先做什么

```sh
git clone https://github.com/luhaobin-lab/no-umbrellas-allowed-study.git
cd no-umbrellas-allowed-study
npm ci
npm test
npm run build
npm run dev
```

Node 20+。游戏运行必需的图片、声音、字体及单元测试小样本随 Git 上传。用户已明确允许保留这些运行素材，仅删除研究/验收截图和大资料；新电脑可以直接运行、构建和测试。开发入口以终端实际打印的地址为准，通常 http://127.0.0.1:5173/。

## 未上传的本地资料

用户最后明确要求**公开仓库并精简内容**。原程序、研究和验收截图、大体积取证目录均不上传；原计划的 Release 已取消，不要寻找该附件。

- 当前旧电脑本地 `原文件/`：Windows 1.0.5 Demo 和 Mac 0.2.5 Demo。继续从 DLL 研究时需用户另行提供到新机器，或使用已随源码提交的测试差分样本。
- `reference/`：原逐帧图片、完整 Unity 对象转储及取证。Git 只保留 `docs/handoff/git-test-evidence.json` 列出的核心测试必需小样本。
- `artifacts/`：历史验证截图和报告留在旧电脑，不上传。结论摘要在本文与分域文档；另一个 AI 应重新运行脚本生成自己的截图。
- 原始 `参考视频.mp4` 当前也不在工作区，只有旧电脑上已提取的数据；不能声称视频已上传。

分域文档中引用的 `artifacts/`、未列入测试清单的 `reference/` 路径是**旧电脑证据位置**，不是仓库已包含文件。需要时重新取证，不以找不到旧截图判断代码未实现，也不据旧报告保证新版本通过。

## 最新验证与准确边界

- 收尾 `npm test`：**370/370 通过，0 跳过**。详见 [最终测试输出](docs/handoff/final-test-results.txt)。
- 最新完整浏览器流程：DAY1→DAY3，**852 次真实操作，22 次书页拖卡，保存/加载成功，0 浏览器错误**，包含 DAY2 策展库存选择与报价。解包证据后看 `artifacts/native-update/demo-browser-curation-final2/report.json`、`acceptance-summary.json`、`build-manifest.json` 和 35 张截图。
- 更早的 `demo-browser-*` 目录包含失败记录，不能仅凭文件存在就判通过。尤其 `demo-browser-curation-final/` 是发现重复库存按钮的失败版，`final2/` 才是修复后的版本。
- 77 页手册、252+17 种卡片外观有逐页/逐卡浏览器检查；6 工具有 20 项真实 UI 机制检查。工具专项使用明确标记的原生存档测试样本，不等于从新游戏自然获取了所有工具。
- 后来修了损伤针缓动和宝石票据打印/遮罩；完整三天回归覆盖损伤工具，但最终的宝石逐帧动画专项**尚未重跑**。不要把旧工具专项报告当作新动画的验收。
- 原 DLL 差分包括：609 物品、252 卡；153,468 个物品×卡判定；540 初价；32 专属 Hook；售货、生成、策展与交易后效果。不同子域的集合不能简单相加成“全部系统穷举”。

## 代码地图

| 范围 | 入口 |
| --- | --- |
| Canvas、鼠标键盘、可访问按钮、弹层 | `src/main.ts` |
| 状态、实例所有权、交易、存档迁移、三天调度、经营 | `src/engine.ts` |
| 完整物品/卡片、真实估值与真值 | `native-item-data.ts`、`native-rules.ts`、`item-facts.ts` |
| 鉴定工具测量与行为 | `native-tools.ts` |
| 新工具缓动/票据遮罩 | `native-tool-view.ts`、`native-tool-visual-data.ts` |
| 手册树、Unity 布局、字体、富文本和卡片绘制 | `native-manual-*.ts`、`native-text.ts`、`native-card-*.ts` |
| NPC 普通管线与专属脚本 | `negotiation.ts`、`native-price-pipeline.ts`、`native-card-pipeline.ts`、`native-script-hooks.ts` |
| 故事、调度、随机生成、策展 | `native-story.ts`、`native-scheduler.ts`、`native-generation.ts`、`native-curation.ts` |
| 经营、29 个购买组件 | `native-services.ts`、`native-street-purchases*.ts` |
| 原人物部件/动作帧/HSL | `native-characters.ts`、`native-character-color.ts` |
| 新原街景模块、原热点 | `native-street-data.ts`、`native-street-view.ts`、`street.ts` |
| 浏览器 localStorage 存档 | `session-store.ts`，key=`no-umbrellas.session.v2` |

`campaign='demo'` 是默认新游戏：DAY1、现金1000、Darcy债务1500/日息1%、空库存。`story` 是保留的视频 DAY6—11 切片；`challenge` 的后期 Level 缺失，现可运行实现不代表正式版难度完全恢复。

## 按优先级继续

1. **先复跑当前版本**。不要上来大改。通读以下分域交接，并在浏览器点新游戏、检查账本/工具/书/策展；保存自己新增改动的基线截图。
2. **把 29 个已实现的街道购买组件接完真实 UI**。入口、原场景 Sprite、原碰撞区、条件和后端已准备。主 UI 尚未完整接所有店铺和原导演对白，不能宣称已完成商店系统。`getStreetPurchases/purchaseStreetProduct` 见经营交接；无 Collider 的理发/服装/维修/拍卖购买节点是对话回调，不可把它们的 Transform 当商品热点。
3. **修新街景玩家再启用全场景替换**。旧 Bob 从视频扣出，带旧栏杆遮挡缺口；新原街景搭配会身体缺段/悬空。保留 `artifacts/native-street-walk-b2.png` 的失败证据。应移植原 StreetPlayer 的动作/锚点，不能用新背景截图宣称整个场景通过。
4. **工具视觉最后一轮**。复跑 `scripts/research/verify-native-tools-browser.mjs`，重点 `.75s` 打票、`.25s` 淡出、SpriteMask、损伤针 `.5s easeOutBounce`、未接触 `.7s pingPong`。测试报告旧的 open findings 需要新证据才能关闭。
5. **完善原演出和策展表现**。控制器已支持选物、报价、反报价、原脚本分支。当前选物按钮是功能接线，尚未做到全部原 UI 像素/动画/台词停顿一致。完整街道导演、角色进出、镜头、并发演出、声音仍有缺口。
6. **逐项审计未证实的边界**。随机流可保存且规则相符，但不保证与 Unity/System.Random/Guid 同 seed逐次相同；像素字体 SDF 抗锯齿、URP 光照/描边、Animator 过渡不能被静态导出证明。

## 必须读的分域交接

- [物品、工具、书、角色](docs/handoff/items-tools.md)
- [经营、流程、生成、策展](docs/handoff/engine-progression.md)
- [NPC 管线、专属 Hook、街道接线](docs/handoff/npc-street.md)
- [原始研究索引](docs/original-study/README.md)
- [经营运行时的已知边界](docs/original-study/PROGRESSION_RUNTIME.md)
- [视觉验收边界](docs/original-study/NATIVE_ITEMS_VISUAL_ACCEPTANCE.md)

## 验证与开发约定

- 不再用视频里的最终成交价、余额或单次标签结果驱动通用游戏逻辑；不要重新引入录像过拟合。
- 真实物品实例与玩家/NPC 判断分开保存，检查工具永远读真值。相同显示名称可能对应多个原卡 ID；保留 `nativeId`。
- 先查原 DLL/对象数据和现有取证，再改规则。卡片 raw 值、F# factory 值、Unity 展示值可能不同；不要“修正”已证的原作怪异行为。
- 不删除旧证据或覆盖通过版本。新增测试必须验证真实状态变化和边界，不用伪造结果让断言通过。
- 文档里的 `/tmp/nua-*` 旧环境不可依赖；需要在新机器重建 UnityPy、.NET/ILSpy 等研究环境。运行网页本身只需 Node。
- 浏览器脚本支持 `PLAYWRIGHT_CHROME_EXECUTABLE`；未配置时会优先用 macOS Chrome，否则用 Playwright Chromium（`npx playwright install chromium`）。部分旧截图脚本仍有固定服务端口，运行前按脚本说明启动对应服务。
- 先读取 `build-manifest.json` 判断浏览器证据对应哪个源码快照。构建通过、数据条目齐全和真正 1:1 是不同的结论。

可直接交给下一位 AI 的任务：

> 请先读 AI_HANDOFF.md 和 docs/handoff/，运行当前项目并验证基线。继续完成这份 Windows 1.0.5 Demo 的原版机制与 UI 复刻，优先接齐已有29个街道购买组件及原场景交互，修原StreetPlayer动作后再启用新街景。保留已通过的三天循环、原数值与所有取证。每次修改都要在真实浏览器验证，并明确哪些内容仍未达到1:1，不要把构建或单元测试通过说成整个游戏已完成。
