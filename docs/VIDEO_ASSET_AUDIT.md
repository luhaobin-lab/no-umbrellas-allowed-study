# 视频裁切素材审查

2026-09-21，对`public/assets/reference-items`的51张图片作完整联系表检查，发现原始粗取时间会夹带检测器、鼠标、悬停描述，或落在商品未到/已离开时。

已修19张，文件路径和345×278 bbox保持原样（stock例外按原212×200尺寸）。全部换为相同物品/同场交易中独立检查过的原视频帧裁切，未生成物品像素。

完整修订记录：`reference/surfaces/item-audit/replacement-audit.json`；原素材归档在`reference/surfaces/item-audit/originals`；候选对照在`reference/surfaces/item-audit/candidates/contact-*.jpg`与`empty-contact-*.jpg`。

修正：鞋黑广告/鼠标、Fixie包黑广告/鼠标、研究海报0000年代器、草的底工具栏、书签材质检测器及黑描述、眼镜鼠标、兔子2064年代器、鳄鱼画签名屏、维米尔作品悬停作者条、鞋的底部玩家对白、纸的黑描述/鼠标；机械腿/旧海报/回售背包/拒售鞋/回售Fixie包/拾取悬浮板/Chippie雕塑原本误取空桌；Flawless Shoulder Bag货架缩略图误烘焙另一物品的估价气泡。

未伪造补图的4个事件：2657旁支伞、2680极短Doll、3016鳄鱼快速回购、3085Sweet Pocket。对应已取秒级/亚秒级帧没商品摆到桌上的可见瞬间。这些交易可以有账目，但不能用空桌图宣称该物品外形完成。

重要渲染边界：多数scene-patch裁切从y684起，前64像素包含顾客腰部。这一背景条与另行播放的顾客动画帧可能不同，若直接叠加会切断腰部/把旧躯干重新画回来。需要在合成层面遮罩或保留单一同帧人物背景，不能把素材存在当成动画合成已验收。

放大机制：Bookmark在1370秒是很小的正常物品；之后有金色镜台放大态。镜台是可切换检视状态，不能把它永久烘焙为商品本体。已提供小物件默认`item-1390.png`及单独`surfaces/bookmark-magnified.png`供实现切换。邮票和书签再次出售也有镜台状态。

浏览器只读/操作审查：`scripts/audit-initial.mjs`；第一轮review证据定位菜单Load误中Settings、工具图被拉大、计算器销售墙外缘、焦点框遗留。后续review2确认菜单坐标和图标大小已恢复，但人物scene-patch接缝仍需合成检查。最新独立新浏览器加载菜单/开店/开书没有资源404或JS异常。
