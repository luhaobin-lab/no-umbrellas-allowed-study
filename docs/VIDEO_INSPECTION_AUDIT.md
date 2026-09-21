# 逐件工具读数审计

来源：用户提供的 `参考视频.mp4`。原帧裁切，保留仪器边框与其覆盖的本物品像素。未使用另一件物品的结果填充缺失读数。

数据与素材：

- `src/reference-inspections.ts` 导出 `REFERENCE_INSPECTIONS`、`REF_INSPECTIONS`、`REF_INSPECTION_BY_TRANSACTION`。
- 每条含 `transactionId / tool / timestamp / asset / rect / observation / bookPage`。
- `rect` 使用原视频1920×1080坐标。图像按其原始位置叠在相同物品上。
- `bookPage` 是该读数出现时的实际书目的页；1503的La Gioconda、1988邮票去History and Time，其余有证据的年份去Chronological Table。

验证：49 个有效工具读数、18 个交易物品；所有PNG存在、尺寸等于rect宽高，并已实际逐张查看。
工具数量：{'damage': 15, 'material': 10, 'year': 9, 'signature': 15}。原视频未看到宝石仪/螺丝刀的有效物品鉴定结果，没有生成这些结果。

## 证据采样

全片物品区每秒一帧；以书页切换和物品区域变化识别候选，再读取原尺寸帧。AVAC卡年份、纸片年份、邮票年份和邮票签名均补充每秒10帧。
重要区分：年份仪移出物品会显示0000；签名仪启动有空白屏。它们不是该物品有效读数，本数据排除。
有些物品只检查了一两种工具。数据缺省代表录像没展示，并不代表这个物品无此属性。
裁切是矩形patch，边角可能带有本物品背景；不应移动到另一件物品上。

## 已捕获读数

| transactionId | tool | 秒数 | 可见结果 |
|---|---|---:|---|
|day6-backpack-soldier|damage|114|Needle points near the green face.|
|day6-backpack-soldier|material|136|Canvas weave shown in magnifier.|
|day6-backpack-soldier|year|221|2068|
|day6-backpack-soldier|signature|240|No Signature Found|
|day6-combat-boots|damage|374|Needle points at the green face.|
|day6-combat-boots|material|382|EE PVC Premium pattern.|
|day6-combat-boots|year|470|2070|
|day6-combat-boots|signature|473|No Signature Found|
|day7-fixie-bag|damage|775|Needle points at the green face.|
|day7-fixie-bag|material|810|FF Fabric weave.|
|day7-fixie-bag|year|845|2080|
|day7-fixie-bag|signature|850|Green signature, matching LEE, Eunjeong.|
|day7-research-poster|damage|1044.5|Condition dial|
|day7-research-poster|year|1047.5|2077|
|day7-research-poster|signature|1084.5|Signature of MOO, Manjo|
|day7-crabgrass|damage|1275.5|Condition dial|
|day7-crabgrass|signature|1279.5|Choi|
|day7-bookmark|damage|1384.5|Condition dial|
|day7-bookmark|material|1388.5|Yellow metal texture|
|day7-golden-glasses|signature|1554.5|Signature of KIM, Emily|
|day8-gioconda|damage|1699.5|Condition dial|
|day8-gioconda|year|1709.5|1503|
|day8-gioconda|signature|1721.5|No Signature Found|
|day8-avac-card|damage|1836.5|Condition dial|
|day8-avac-card|material|1844.5|Dark blue material surface|
|day8-avac-card|year|1848.5|2079|
|day8-doll|damage|1947.5|Condition dial|
|day8-doll|material|1969.5|Gold-brown woven texture|
|day8-doll|signature|1979.5|Signature of MO, Yeon-gi|
|day8-rabbit|damage|2035.5|Condition dial|
|day8-rabbit|material|2040.5|Wood grain|
|day8-rabbit|year|2046.5|2064|
|day8-rabbit|signature|2052.5|Signature of LEE, Dongjun|
|day8-crocodile|material|2260.5|Green canvas texture|
|day8-crocodile|signature|2266.5|Signature of LEE, Eunjeong|
|day8-fantastic-hoverboard|damage|2427.5|Condition dial|
|day9-time-device|damage|2699.5|Condition dial|
|day9-time-device|signature|2711.5|Choi|
|day9-my-mom-declined-sale|signature|2743.5|Two green characters, not identified in the shown pages|
|day9-seoul-stamp|damage|2803.5|Condition dial|
|day9-seoul-stamp|material|2813.5|Paper surface|
|day9-seoul-stamp|year|2816.5|1988|
|day11-meaningful-paper|damage|3232.5|Condition dial|
|day11-meaningful-paper|material|3237.5|Light blue paper surface|
|day11-meaningful-paper|year|3240.5|2060|
|day11-meaningful-paper|signature|3312.5|Signature of HAN, Sol|
|day11-hoverboard-display|damage|3418.5|Condition dial|
|day11-hoverboard-display|signature|3445.5|Signature of HWANG, hon|
|day9-seoul-stamp|signature|2825.15|No Signature Found|

## 边界

交易时间区间原为抽样估计：Wooden Sculpture «My Dear Rabbit» 已在2035.5秒可见损伤仪，但早期交易表start=2040。已通知交易审计修正；这里保留读数真正时间。

本审计不将49个读数当作原作全部数值数据库。对视频没有运行的工具、未展示的分支、未被检查的属性，必须维持未知。