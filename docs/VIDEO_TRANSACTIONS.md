# 视频来访、物品与交易审计

源文件：`参考视频.mp4`，1920×1080，60000/1001 fps，3613.698 秒。游戏版本画面为 No Umbrellas Allowed 1.0.5。

## 覆盖与证据边界

- 已视觉审阅全片每20秒联系表，并对主要交易截取精确1920×1080原帧；对现金短时变化追加5秒及1秒采样。
- 联系表时间文字为20秒采样名义区间；`keyframes/NNNN.png` 文件名为实际请求的秒数。所有代码引用timestamp基于后者。
- 第38秒左右直接加载DAY6正在鉴定的物品，现金258；不是新游戏教学。此来访之前的问候与操作不可见。
- 实际游戏画面截至59分多钟，60分钟附近为频道片尾，与游戏机制无关。
- `src/reference-transactions.ts` 是可执行的数据索引；`reference/transactions/data.json` 是相同数据的审计副本。
- 当前53条来访/故事记录、57种可拆绘标签、87张已归档到来访的对白截图、7格最早可见货架。时间和对话为可见采样记录，**不是每帧完整转录，也不等于原作全部内容**。
- NPC姓名只有确切证据才可赋值。当前sprite记录保持name:null；外观只作选择与比对线索。
- 对未知成交价保留null。个别来访边界、不可读物品标题或极快剪切已单独标注，不能把净现金差当作成交价。

## 图片坐标合同

- 独立标签：x103，y411+48×行号，276×44，原始行序保存于states.tags。
- 整张左卡：x60，y348，345×505。
- 物品标题：x91，y350，285×61。
- NPC patch：x815，y318，290×431。
- 物品patch：默认x785，y684，345×278。
- **NPC与物品为scene-patch**：包含该坐标内的背景，不是透明精灵；只能按bbox原位叠加。部分NPC身体下沿在源图中被物品遮挡，未伪造缺失身体像素。
- 对话图片按浅米色气泡像素连通区域裁取，保留尾巴与小范围源背景，bbox随气泡而变。全部四张对白联系表已人工看图，未混入书页或工具。
- 原图中文字不重新排版；OCR text仅提供检索与辅助可访问文本，部分拼写尚可能有OCR误差。partial表示拍摄时打字尚未结束或完整度不能确定。

## 已证实的估价机制

1. 基础值与加价先相加，再分别乘百分比/倍数，最后向下取整数显示。例：背包(70+80)×0.8×0.99=118.8→118；军靴(89+80+100)×1.1×0.98=289.982→289；修正材质后(89+80+20)×1.1×0.98=203.742→203。
2. 条件包括In Perfect Condition +10%、Slightly Damaged −20%、Fairly Damaged −60%。
3. 左卡购买估值用Attractiveness of Darcy's，视频从−1%到−7%；入库与右侧出售估值用Expertness of Darcy's（已见+4%、+5%）。同一背包左55、右58；眼镜左127、右137；兔子左2780、右3011。
4. 属性不是工具使用后无条件直接写入。对原有错误标签的质疑会触发顾客回应；被否定的品牌可变成无价格的Wrong Material占位条。
5. 可观察到Base、Material、Brand、Condition、Artwork、History、Celebrity Signature、Popularity与Shop modifier的联合估价。
6. 艺术家签名×2、考古价值×3、国家历史价值×2、已故艺术家作品+1500、政治家签名−30%、不明签名−20%。只记录本录像可见项，不暗示完整属性表。
7. 后段有Private Slot：在公开估价之外保留隐藏标签与独立总价；拖动公开/隐藏会改变两个数值。53分钟Darcy以Good-looking Hoverboard教把VERTIVO品牌藏入私人槽。
8. 数字报价器有0–9、C、E、OFFER、DECLINE、ACCEPT。可直接报价，也可接受对方还价；固定NPC接受阈值不可从单次录像推导。
9. 陈列货架可从库存拖物品、定价，并有RECOMMENDED大格；同一NPC可能连续购买或卖入物品。

## 单秒复核纠错

|区间|已经确认的动作|不能采用的推断|
|---|---|---|
|27:49–27:51|Picked-up Paperbag，现金100→400，成交300|之后街道+80、利息−25，不能合并成355卖价|
|31:10–31:28|Taxidermied Butterfly卖275；Golden Glasses另卖180|不能把两次销售合计455当一个物品价格|
|41:28–41:35|Vermeer画NPC出852，随后+852到账|后来另一太阳镜销售350，不能归入此画|
|50:30–50:45|时光装置输入300，现金329→629；随后另扣40|不能用跨帧净差260当成交价|
|56:30–56:38|兔子雕塑+3303，随后借款面板−1500|不能把净增1803当成交价|
|57:42–57:46|Hoverboard最后公开估值20，玩家报价0，对方拒绝|之后−94不是此物买入价|

## 来访表

|ID|DAY|可见范围|来访/物品|结果|确认成交价|
|---|---:|---|---|---|---:|
|day6-backpack-soldier|6|00:38–04:42|Backpack of Soldier|bought|45|
|day6-strong-leg|6|05:30–05:50|Strong Leg for Chippies|sold|295|
|day6-combat-boots|6|05:50–08:15|Triumphant Combat Boots|bought|150|
|day6-early-poster|6|08:20–08:45|Early Poster of AVAC|sold|70|
|day6-darcy-task|6|08:45–09:30|秃头、浓密胡须、棕色敞怀外套的年长顾客|story|未确认|
|day7-fixie-bag|7|12:40–16:03|Fixie-made Bag|bought|360|
|day7-research-poster|7|17:00–20:30|Poster from Citizens Alliance Research Institute|declined|未确认|
|day7-backpack-resale|7|20:30–20:50|Backpack of Soldier|sold|75|
|day7-crabgrass|7|21:00–22:05|The World's Best Crabgrass|declined|未确认|
|day7-flawless-bag-resale|7|22:10–22:45|Flawless Shoulder Bag|sold|412|
|day7-bookmark|7|22:45–24:25|Bookmark|bought|350|
|day7-avac-secretary|7|24:25–25:20|棕发、棕色上衣、携AVAC证件的顾客|story|未确认|
|day7-boots-refused-sale|7|25:20–25:40|Triumphant Combat Boots|declined|未确认|
|day7-golden-glasses|7|25:40–27:05|Golden Glasses|bought|75|
|day7-finer-warning|7|27:20–27:48|蓝色连帽衣、苍白长发顾客|story|未确认|
|day7-paperbag-sale|7|27:40–28:00|Picked-up Paperbag|sold|300|
|day8-gioconda|8|28:00–30:00|Masterpiece «La Gioconda»|bought|450|
|day8-fixie-bag-sale|8|30:00–30:20|Fixie-made Bag|sold|850|
|day8-avac-card|8|30:20–31:10|AVAC ID Card|bought|50|
|day8-taxidermied-butterfly-sale|8|31:10–31:16|Taxidermied Butterfly|sold|275|
|day8-golden-glasses-sale|8|31:16–31:28|Golden Glasses|sold|180|
|day8-doll|8|32:00–34:00|Doll of Me|bought|35|
|day8-rabbit|8|34:00–37:25|Wooden Sculpture «My Dear Rabbit»|bought|1789|
|day8-crocodile|8|37:40–38:50|Painting «Happy Tears of a Crocodile»|bought|325|
|day8-picked-hoverboard-sale|8|38:54–39:00|Picked-up Hoverboard|sold|30|
|day8-my-mom|8|39:00–39:30|Painting «My Mom is Very Pretty»|bought|50|
|day8-vermeer-acquired|8|39:40–40:00|Painting «Girl with a Pearl Earring»|gifted|0|
|day8-doll-declined-sale|8|39:40–39:48|Doll of Me|declined|未确认|
|day8-fantastic-hoverboard|8|40:00–40:40|Fantastic Hoverboard|declined|未确认|
|day8-avac-card-sale|8|40:40–41:20|AVAC ID Card|sold|68|
|day8-vermeer-sale|8|41:20–41:50|Painting «Girl with a Pearl Earring»|sold|852|
|day8-plain-sunglasses-sale|8|41:46–41:49|Plain Sunglasses|sold|350|
|day9-boots-declined-sale|9|42:33–42:54|Triumphant Combat Boots|declined|未确认|
|day9-black-umbrella-sale|9|43:00–44:00|Black Umbrella|sold|200|
|day9-umbrella-side-deal|9|44:00–44:34|Umbrella (side deal)|sold|150|
|day9-doll-sale|9|44:37–44:41|Unidentified showcased item|sold|60|
|day9-time-device|9|44:40–45:30|Prof. Choi's Time... Whatever|bought|180|
|day9-my-mom-declined-sale|9|45:34–45:58|Painting «My Mom is Very Pretty»|declined|未确认|
|day9-officer-visit|9|46:00–46:40|黑色制服、黑发的Stabilizer人物|story|未确认|
|day9-seoul-stamp|9|46:40–47:30|88' Seoul Olympics Post Stamp|bought|60|
|day9-chippie-sculpture-sale|9|47:25–47:50|Sculpture «Chippie Gazes»|sold|571|
|day9-bookmark-sale|9|47:50–48:30|Bookmark|sold|551|
|day10-fine-visit|10|49:55–50:13|制服执法来客|story|未确认|
|day10-crocodile-sale|10|50:14–50:18|Painting «Happy Tears of a Crocodile»|unknown|未确认|
|day10-time-device-sale|10|50:20–50:50|Prof. Choi's Time... Whatever|sold|300|
|day10-stabilizer-warning|10|50:45–51:24|棕色长发、深绿制服执法来客|story|未确认|
|day10-sweet-pocket-sale|10|51:25–51:28|Sweet Pocket Mommy|sold|未确认|
|day11-reporting-setup|11|52:20–52:54|棕色长发、深绿制服执法来客|story|未确认|
|day11-private-slot-tutorial|11|52:54–53:40|秃头、浓密胡须、敞怀外套的Darcy|story|未确认|
|day11-meaningful-paper|11|53:40–56:20|Seemingly Meaningful Paper|bought|5|
|day11-rabbit-sale|11|56:20–56:50|Wooden Sculpture «My Dear Rabbit»|sold|3303|
|day11-hoverboard-display|11|56:45–57:46|Hoverboard for Display|declined|未确认|
|day11-darcy-close|11|57:47–58:10|秃头、浓密胡须、敞怀外套的Darcy|story|未确认|

## 交易之外已经看到的系统

- 顶部时钟/每日进度、钱币、设置/记录图标；左上电视新闻与公告。
- Calendar Week 2：每日利息、Umbrella Pickup、Get AVAC Card、Merchant Registration等约定。
- 借款/还款面板：余额、可借额度、每天利息、Get Loan/Pay Off；兔子鉴定中借1500，后续还1500。
- 日终书册：Best deal/Worst deal、SOLD、DISPOSED、每日纪事、1/2分页与睡觉推进。
- 店外横向移动、上下层电梯、商店入口、物品拾取与街头交互；花店SCENTED、宝石GEM、维修T REPAIR、Stbl.Office、EMT Center。
- 花店购买装饰、维修改善物品状态并收费；DAY9邮票由Fairly Damaged修到Slightly Damaged，估值从98到196，费用59（48:50–49:30原帧）。
- AVAC证件对话选择；MISSING/WANTED人物表及奖励15000/8000/5000/1000。
- 执法者罚款与威胁，举报器REPORT与双计数器；街头90人周任务，片尾街区显示还剩53、D−5。

## 尚不能宣称完全一样的部分

- 所有对白的逐字完整转录、未采样瞬间的商品详情，以及视频极快切换处的个别成交额仍需逐帧核验。
- 普通NPC并未给出可可靠归属的姓名；对话中的人物姓名不能自动作为当前卖家身份。
- 一笔交易只有观察轨迹，没有反事实报价尝试，无法推断耐心阈值、接受边界、随机参数或全部剧情分支。
- 物品/NPC的透明分层、背后被遮挡像素、完整走路/转头动画未从一张截图臆造。

## 补采复核

- 对51组打字中途对白补采282帧（+0.5/1/1.5/2/2.5/3秒），通过相同气泡、文本前缀筛选出49条更完整原图，并人工查看全部补采联系表。去除相邻重复后保留87张对白。
- 首笔完整回应位于273秒与277秒；没有利用生成文字补全原文。仍然有些句子在源片显示途中即切镜，保持partial:true。
- 工具代理交叉核对：背包2068、战靴2070、FF肩包2080、研究海报2077、Gioconda1503、AVAC卡2079、木兔2064、邮票1988、纸片2060。
- 木兔在2035.5秒已经检测受损，来访边界已提早到2033；前一玩偶来访截至2033。
- attractiveness字段按每位来客当前左卡填写，不按时间单调递增；expert字段仅写直接看见的值，数学可推但被隐藏在下页者保留null。
