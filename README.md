# No Umbrellas Allowed — Demo 研究与复刻

这是可运行的学习研究项目，当前以用户提供的 **Windows 1.0.5 Demo** 为运行时依据；Mac 0.2.5 Demo 用于研究对照。**尚未完成整个原游戏的 1:1 还原。**

换电脑或换 AI 接手，请先读 **[AI_HANDOFF.md](AI_HANDOFF.md)**：任务方向、源码地图、实际验收、未完成项、操作顺序和恢复资料的方法都在其中。

## 启动

需要 Node.js 20+：

```sh
npm ci
npm run dev
```

打开终端打印的本机地址，通常为 http://127.0.0.1:5173/。也可运行 `npm run build` 后用 `npm run preview`（默认5174）。默认 New Game 为原 Demo 的 DAY1—3；旧存档保留兼容。

```sh
npm test
npm run build
```

收尾快照：370/370 单元测试通过。完整 DAY1—3 浏览器验收完成，852 次真实操作、22 次手册拖卡、保存/加载成功、浏览器零错误。包含实际策展选物和报价，**不代表尚未接完的全街道/全部演出已经验收**。

## 跨电脑资料

用户要求公开且精简：不上传原 Demo、研究截图、验收截图和大体积取证附件。Git 包含源码、游戏运行必需的图片/声音/字体素材、测试需要的小型差分样本以及交接说明。历史截图请按脚本重新生成；原 DLL 研究需要另行准备本地 Demo。

原始 `参考视频.mp4` 当前不在工作区，也未上传。详细本地资料边界见 [AI_HANDOFF.md](AI_HANDOFF.md)。

## 主要内容与边界

已接入609物品、252卡片、77页手册、六种鉴定工具、54角色定义、普通及32种专属NPC议价脚本、真实物品实例、买卖/上架/存档、Demo三天调度。29个街道购买组件的规则和原场景素材已准备；其完整界面接线、原街道人物动画、部分演出和像素级表现仍待继续。

详细取证与分域交接：

- [研究索引](docs/original-study/README.md)
- [物品与工具](docs/handoff/items-tools.md)
- [经营、流程、生成和策展](docs/handoff/engine-progression.md)
- [NPC与街景接入](docs/handoff/npc-street.md)
- [最终测试输出](docs/handoff/final-test-results.txt)

本项目用于学习研究；仓库不附加对原游戏素材的再授权声明。
