require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const SECRET = process.env.LINE_CHANNEL_SECRET;

async function reply(replyToken, text) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [{ type: 'text', text }]
  }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}

async function push(userId, text) {
  await axios.post('https://api.line.me/v2/bot/message/push', {
    to: userId,
    messages: [{ type: 'text', text }]
  }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}

const sessions = {};

app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    if (event.type !== 'message') continue;
    const userId = event.source.userId;
    const text = event.message.text.trim();
    const session = sessions[userId] || {};

    if (/สวัสดี|เมนู|help/i.test(text)) {
      sessions[userId] = {};
      await reply(event.replyToken,
        '🏫 PLTC HRD เมนูหลัก\n\n' +
        '1. พิมพ์ "ยื่นใบลา"\n' +
        '2. พิมพ์ "สิทธิ์การลา"\n' +
        '3. พิมพ์ "สถานะการลา"'
      );
    } else if (/ยื่นใบลา/i.test(text)) {
      sessions[userId] = { step: 'type' };
      await reply(event.replyToken,
        '📋 เลือกประเภทการลา:\n\n' +
        '1. ลาป่วย\n' +
        '2. ลากิจส่วนตัว\n' +
        '3. ลาคลอดบุตร\n' +
        '4. ลาช่วยเหลือภริยาที่คลอดบุตร\n' +    
        '5. ลาเข้ารับการตรวจเลือกหรือเข้ารับการเตรียมพล\n' +
        '6. ลาไปศึกษา ฝึกอบรม ปฏิบัติการวิจัย หรือดูงาน\n' +
        '7. ลาไปปฏิบัติงานในองค์การระหว่างประเทศ\n' +
        '8. ลาติดตามคู่สมรส\n' +
        '9. ลาอุปสมบท หรือลาไปประกอบพิธีฮัจย์\n' +
       '10. ลาเพื่อฟื้นฟูสมรรถภาพด้านอาชีพ\n\n' +
        'พิมพ์ชื่อประเภทได้เลยครับ'
      );
    } else if (session.step === 'type') {
      sessions[userId] = { step: 'start', leaveType: text };
      await reply(event.replyToken, `✅ ประเภท: ${text}\n\n📅 ระบุวันที่เริ่มลา\nรูปแบบ: 20/06/2567`);
    } else if (session.step === 'start') {
      sessions[userId] = { ...session, step: 'end', startDate: text };
      await reply(event.replyToken, `📅 วันที่เริ่ม: ${text}\n\nระบุวันที่สิ้นสุดการลา`);
    } else if (session.step === 'end') {
      sessions[userId] = { ...session, step: 'reason', endDate: text };
      await reply(event.replyToken, `📅 วันที่สิ้นสุด: ${text}\n\n📝 ระบุเหตุผลการลา`);
    } else if (session.step === 'reason') {
      const id = 'LV-2567-' + Date.now().toString().slice(-5);
      sessions[userId] = {};
      await reply(event.replyToken,
        `✅ ยื่นใบลาสำเร็จ!\n\n` +
        `เลขที่: ${id}\n` +
        `ประเภท: ${session.leaveType}\n` +
        `วันที่: ${session.startDate} – ${session.endDate}\n` +
        `เหตุผล: ${text}\n` +
        `สถานะ: รอดำเนินการ ⏳\n\n` +
        `จะแจ้งเตือนเมื่อได้รับการอนุมัติครับ`
      );
    } else if (/สิทธิ์การลา/i.test(text)) {
      await reply(event.replyToken,
        '📊 สิทธิ์การลาคงเหลือ ปี 2567\n\n' +
        '🏥 ลาป่วย: 55/60 วัน\n' +
        '💼 ลากิจ: 40/45 วัน\n' +
        '🌴 ลาพักผ่อน: 8/10 วัน'
      );
    } else if (/สถานะการลา/i.test(text)) {
      await reply(event.replyToken,
        '🔍 ประวัติการลาล่าสุด\n\n' +
        '✅ LV-2567-00245 ลาพักผ่อน อนุมัติแล้ว\n' +
        '✅ LV-2567-00221 ลาป่วย อนุมัติแล้ว\n' +
        '⏳ LV-2567-00250 ลาป่วย รอดำเนินการ'
      );
    } else {
      await reply(event.replyToken, 'พิมพ์ "เมนู" เพื่อดูรายการทั้งหมดครับ 😊');
    }
  }
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => res.send('PLTC HRD LINE Bot ทำงานอยู่ ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
