# DAY9登记与维修的可见路径

本次复核用原视频全帧，联系表为 `reference/events/office-repair-path-0.jpg` 到 `-2.jpg`；边界补帧为 `reference/events/finance-path-fine/contact.jpg`。所有时间为视频绝对秒。

| 时间 | 可见操作或画面 | 现金与限制 |
| --- | --- | --- |
| 2908–2912 | 店内夜间广播，贷款账簿打开 | 2393；Darcy已经显示可借4000，说明较早的500已还清 |
| 2914 | 硬切至广场Stbl.Office，玩家站在窗口前，窗口NPC说话 | 2420；中间+27来源未见 |
| 2916 | 窗口NPC气泡“What is it about?”；背景仍是广场 | 没有办公室室内场景 |
| 2918 | 窗口对话“It’s done. You’re free to…”并出现−1300 | 2420→1120，登记实际收费 |
| 2922 | 玩家走到左边楼层门；出现E Move to lower floor | 从广场离开 |
| 2924.4–2925.8 | B1向右行走，经过GEM byul并继续到右侧楼层门 | 2924.8清楚显示E Move to GEM byul，但玩家没有在这段进入；下方B2可见1st REPAIR门头 |
| 2926 | 硬切至维修店内，店主介绍维修规则 | 具体下楼与进入1st REPAIR的选择没有出现在视频中，不能将GEM门当作已证实维修入口 |
| 2934–2938 | 玩家打开右侧库存，依次查看物品，最终选Seoul Stamp；出现Show | 该邮票当前估值98、买入60、Fairly Damaged−60% |
| 2940–2956 | 选中的Seoul Stamp详情保持可见，Show位于库存左下 | 1120，尚未扣费 |
| 2958–2960 | Show之后出现“Okay, good.”与“I’ll come back later.”选项 | 接受维修与取消分支都可见 |
| 2962 | 出现−59，画面短黑 | 1120→1061 |
| 2964–2971.5 | 回到同一维修店；再次查看邮票 | 估值变196，损坏程度变Slightly Damaged−20% |
| 2972 | 硬切回店内货架 | 1061；离开维修店、回家路线被剪去 |

补充：2526视频已见Darcy 500还清。真实UI资金测试需要在DAY8 Plain Sunglasses售出后操作该Pay Off，不能只靠次日现金快照掩盖仍在收取25利息的旧债务。

2940全帧直接显示完整邮票详情：Postage Stamp 73、Paper +5、Fairly Damaged−60%、Archaeological Value×3、Expertness of Darcy’s 5%。因此维修前`floor((73+5)×0.4×3×1.05)=98`，维修后`floor((73+5)×0.8×3×1.05)=196`。已将交易数据的该件expertness从未知补为5；不是仅从结果反推。

收费事件已定义于 `src/reference-events.ts`：`day9-registration-fee`（−1300）、`day9-stamp-repair`（−59）；两者必须从实际入口和选择按钮触发，不能当作没有可见动作的现金差额自动补偿。
