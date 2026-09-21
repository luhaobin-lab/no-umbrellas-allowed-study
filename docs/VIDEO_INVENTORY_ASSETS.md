# 库存与货架素材补正

`src/reference-inventory.ts` 现提供 **20种有物品名映射的原库存格、16种原挂牌卡**，只覆盖录像中确实找到的对应物品。键使用 `reference-transactions.ts` 的物品名；`Picked-up Hoverboard` 对应录像上挂牌名称 `Picked-up Remote Control`，保留现有数据键兼容，没有改交易名。

- `REFERENCE_INVENTORY_BY_TITLE`：`{asset,rect,timestamp}`，每张为132×121原始库存格，含原米色槽框和物品小图，不含商品名/挂牌价。该图直接放进库存格，不能再把完整货架卡或柜台场景缩成库存图标。
- `REFERENCE_SHELF_BY_TITLE`：`{asset,rect,price,timestamp}`，每张为212×200的原挂牌卡，保留视频中的原商品名、物品图和已见挂牌价。`price`是那张原图的挂牌价，不表示买入价格或后来用户改价。
- `REFERENCE_INVENTORY_GRID`：原抽屉槽位 x1645、y209，列间隔130，行间隔120，裁切格132×121。原旧版实现的134/123间距会逐行偏移。

原库存格来源：285秒初始物品，1010秒背包/Fixie/纸袋/靴子，2370秒书签/玩偶/兔子/画/卡/遥控器，2938秒首尔邮票，2970秒Prof.Choi装置，3492秒无鼠标的Meaningful Paper。初始六件原挂牌卡文件均保留；新增map没有删除或覆盖 `public/assets/reference-items/stock-*.png`。

最后优先补的三个格：

| 物品键 | 秒 | 原裁切[x,y,w,h] |
|---|---:|---|
| 88' Seoul Olympics Post Stamp | 2938 | [1481,209,132,121] |
| Prof. Choi's Time... Whatever | 2970 | [1481,329,132,121] |
| Seemingly Meaningful Paper | 3492 | [1481,329,132,121] |

Golden Glasses 已有详情大图，但这一轮没有找到无歧义的原库存小格，故没有用详情图或重画图冒充。其余没有映射的物品同样保留缺口。

## 原界面污染修复

- `public/assets/surfaces/sales-wall.png`：主源仍285秒，推荐大格的录制手形光标在原位 [729,430,60,57]；用1010秒同位置的无鼠标墙面像素替换。目标素材自己的y坐标为340（源完整画面减去90顶栏）。原货架内容其余不动。
- `public/assets/surfaces/sales-inventory.png`：维持324×698和原放置位置[1596,194]，只保留抽屉及左侧拉手的alpha轮廓，左下方不是抽屉的背景纸张/文字设为透明。可见RGB未重绘。原始未修复两图保存在 `reference/inventory/originals/`。
- `reference/inventory/masked-preview.png` 用品红背景展示透明边界；`cells-contact.png`展示首批18个原生小格；最后3个格另有对应源帧与manifest。

## 核验

`python3 scripts/verify-reporting.py` 同时检查广播/举报/导航/库存素材。当前67张PNG无颜色元数据，剥离元数据前后的IDAT字节SHA保持一致；64个manifest条目的尺寸通过，可直接追溯到单帧的裁切逐像素一致。记录在 `reference/reporting/verification.json`。

这验证的是图像来源、字节和尺寸，不表示未知物品、未见库存顺序或任意新挂牌价格均已获得原作完整素材。

最后收窄：285秒初始持有的深色伞只见图像，未确认它与后来来访物品Black Umbrella是同一件，所以不放入BY_TITLE映射；原裁切仅作为证据保留。
