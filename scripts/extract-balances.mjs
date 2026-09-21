import fs from 'node:fs/promises';import {RECORDED_TRANSACTIONS} from '../src/reference-transactions.ts';
await fs.writeFile('reference/balance-input.json',JSON.stringify(RECORDED_TRANSACTIONS.map(t=>({id:t.id,time:Number(t.npc.asset?.match(/visitor-(\d+)/)?.[1]||t.start),known:t.states[0]?.cash??null})),null,2));
