# 用户视频书页审计

来源：工作区 `参考视频.mp4`，1920 × 1080，约 60 分 13 秒。此审计仅使用这份用户提供的录像，不采用旧 MVP 书内容，不用外部 wiki 补未知数据。

## 审阅方式与可重查证据

1. 全片每 20 秒取样，共 181 帧，生成 `reference/book/contact-*.jpg`。
2. 全片 721 个关键帧，检测书壳并检查 80 次显著页面变更，见 `transitions-*.jpg`。
3. 全片每秒取样，共 3614 帧，再检查 100 次页面变更和 208 次页面/悬停浮卡变更，见 `seconds-transitions-*.jpg` 与 `tooltip-transitions-*.jpg`。
4. 对材料、品牌原料、签名、年表等快速操作区间以每秒 2 帧复核，并取原尺寸局部帧阅读。
5. 最终 21 张 570 × 800 原尺寸 PNG 全部实际查看，汇总图为 `reference/book/final-page-contact.jpg`。文件散列、源时间、引用与坐标验证见 `reference/book/manifest.json`。

抽帧取样不能证明小于 1 秒的全部过渡状态均被捕获，也不是游戏程序或完整资料库的反编译。已捕获的页面图像直接来自视频帧；没有生成或重绘文字。个别页面保留录像中的鼠标，未通过绘图改写源画面。

## 截图坐标与运行时接口

所有书页裁切：原视频 `x=1350, y=155, width=570, height=800`。包含书壳、导航和正文，不包含整个交易屏幕。

数据：`src/reference-book-data.ts`。

- `REF_BOOK_PAGES`：章节、页 id、原图 URL、取帧时间、页面热点。
- `REF_BOOK_TAGS`：标签、分组、数值运算、可见数值证据。`value=null` 表示录像未给出，不能自动声称其为零。
- `REF_BOOK_PAGE_BY_ID` / `REF_BOOK_TAG_BY_ID`：id 索引。
- `REF_BOOK_RECORDED_TAG_ALIASES`：书标签 id 对应交易记录中剪出的原始标签图。
- 热点 `rect=[x,y,width,height]` 使用书裁切内坐标。按钮正文已经在 PNG 中，不要另外叠字。
- `kind=tag` 可拖卡；`jump` 进入已见页面；`info` 切换已见说明；`close` 收书；`locked` 说明录像锁定或未出现目的页。
- `previous` / `next` 是**仅供浏览已捕获页面的实现顺序**。录像大部分使用目录、自动跳页和签名图入口，没有展示完整原书页序；不能称这条浏览链为已验证的原作全部相邻页。

## 目录确为 14 项

左列：Tools、Condition、Materials、Rarity、Popularity、Celebrity Types、Watch Movements。

右列：Brands、Gems、History and Time、Chronological Table、Artwork、Celebrity List、Updated Information。

Gems 和 Watch Movements 在截图中带锁。Rarity、Popularity 带 NEW 标记；没有看到其正文。Tools 与 Updated Information 也没有看到正文。不能把这些目录字样当作正文已经复刻的证据。

## 已捕获页面

| 页 id | 取帧秒数 | 可见内容 |
|---|---:|---|
| index | 2750 | DARCY'S 30-YEAR SECRETS；14 项目录 |
| condition | 120 | 完美、轻损、较重损、无价值、潜在垃圾；右侧状态表情 |
| material | 190 | 24 个材料纹样；++A / +A / +B 分区；Brands 跳转 |
| brand-list | 150 | 品牌 logo 列表、等级和解锁锁头 |
| brand-easy-enough | 160 | Easy Enough 品牌、正文、三种原料 |
| brand-fxxx-fxxx | 822 | Fxxx Fxxx 品牌、正文、三种原料 |
| brand-wildcards | 148.5 | Brand Eraser 及五种品牌问题理由 |
| celebrity-types | 929 | 11 个职业/名人类别、未知签名、世界历史伟人 |
| celebrity-index | 854 | 29 个签名图入口 |
| celebrity-ahn-lee | 880 | Ahn, Jurin；LEE, Eunjeong |
| celebrity-gong-han | 3270 | GONG, Deok；HAN, Sol |
| celebrity-hwang-kim | 3450 | HWANG, hon；KIM, Gretel |
| celebrity-emily-semilia | 1550 | KIM, Emily；KIM, Semilia |
| celebrity-lee-choi | 2070 | LEE, Dongjun；CHOI, Sungho |
| celebrity-moo-mo | 1130 | MOO, Manjo；MO, Yeon-gi |
| history | 1770 | Archaeological Value、National Historic Value、Time-sensitive |
| chronology-recent | 230 | 2049 / 2062 / 2076 三时期与六事件 |
| history-anti-chippie | 3250 | 2060 Anti-Chippie Act 事件正文 |
| history-fiber-10 | 1065 | 2077 Fiber 10 事件正文 |
| artwork | 1750 | 艺术品六等级按钮 |
| artwork-help | 2090 | Artwork 信息图标展开的说明层 |

## 关键已核对数值

- Condition：In Perfect Condition `+10%`；Slightly Damaged `−20%`；Fairly Damaged `−60%`；Valueless `−90%`。No Value 是书页按钮文字，Valueless 是交易标签文字。
- Easy Enough 品牌 `+80`；三种原料由左到右：EE PVC `−50`、EE PVC Premium `+20`、EE Military Grade PVC `+100`。悬停证据 390.75–393.25 秒。
- Fxxx Fxxx 品牌 `−40`；三种原料由左到右：FF PVC `−5`、FF Fabric `+0`、FF Fabric Eco-Friendly `+65`。悬停证据 824.25–836.25 秒。品牌正文和原标签都是 **Fxxx Fxxx**；早期 OCR 曾误记 Fimm Fimm。
- 材料页实际位置确认：Canvas `(134,351,68,84)` `+0`；Silver `(134,227,68,84)` `+70`；24K Gold `(368,227,68,84)` `+500`；Cotton `(368,480,68,84)` `+0`；Wooden `(56,575,67,84)` `+0`。其余纹样没有足够悬停证据确定名字，未凭纹理猜。
- Silver 浮卡称其可回收，成为目标材料时价格上涨；上涨公式在视频中未展示。
- Signature of an Artist `×2`；Signature of a Businessman `−40%`；Signature of a Politician `−30%`；Signature Unidentified `−20%`。
- MO, Yeon-gi 正文中的 “Youngsters like him.” 可拖出 Popular Item among Youth `+10%`（1995.5 秒）。HAN, Sol 的 “enjoyed great popularity” 可拖出 Popular Item `+20%`（3274.5 秒）。这证明可拖卡入口不只出现在红色大按钮上。
- Archaeological Value `×3`；National Historical Value `×2`。书页国史按钮略写为 National Historic Value。
- Great Piece `+150`；Fine Piece `+50`；Poor Piece `−200`；Work of one's prime `+300`；Work by a deceased artist `+1500`。前三项与交易 agent 提取的原始标签图互证。
- Brand Eraser 及 Wrong…理由未印数值。Eraser 是删除品牌判断的操作，不能把它实现成只添加一个零价格牌。Wrong Material 的说明指向包、鞋、手表、饰品的品牌材料核对。

## 书页交互事实

- 鉴定工具使书自动进入相应章节；没有证据表明这会自动把正确标签放入左侧。
- 鼠标悬停到纹样/红字，按钮右上角出现折角、光标变手，再显示可拖标签浮卡。
- 标签可从书拖向左侧的鉴定槽；书本身仍留在原页。
- 材料书和品牌书之间有双向导航，品牌型号还需要对照品牌专属的三种材料。
- 签名图总表按图案点击进入两位名人的资料页；已访问的 12 个图案入口已建热点，另 17 个目的页未见。
- 名人资料中的红色说明正文可能是标签入口（流行度示例）。
- 年表上的事件红字点击进入 Major Events 正文；仅 Anti-Chippie Act / Fiber 10 两条有目的页证据。
- Artwork 信息图标显示说明层。其规则要求先查签名，区分在名人表中/未在表中的作者，再考虑创作巅峰与作者死亡。

## 未核对范围

完整原书、未展示的职业签名数值、未访问的 17 位签名资料入口、其余材料名称对应格位、未解锁品牌正文/宝石/机芯资料、完整页序、所有规则组合、Potential Garbage / Time-sensitive / Failed Piece 数值，均不能从此录像证明。数据中的未知值与缺页保留缺口，不用旧原型的假定值冒充。
