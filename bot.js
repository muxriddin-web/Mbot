require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const Order = require('./models/Order');

const bot = new Telegraf(process.env.BOT_TOKEN);
const Admin = require('./models/Admin');
// MUHIM: Bot yaratilgandan keyin darhol session ni ulaymiz
bot.use(session());

// MongoDB bazasiga ulanish
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB bazasiga muvaffaqiyatli ulandi!'))
    .catch((err) => console.error('❌ Bazaga ulanishda xatolik:', err));
// /start komandasi
bot.start(async (ctx) => {
    try {
        await ctx.reply(
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `                          ✨ <b>DIL IZHORIM</b> ✨\n` +
            `                                   <b><i>by Munira</i></b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Yuragingizda aytolmay yurgan gaplaringiz bormi? \n` +
            `Yaqin insoningizni kutilmagan tarzda xursand qilmoqchimisiz? ❤️\n\n` +
            `─────────────────────\n` +
            `🎙 <b>KUTILMAGAN QO‘NG‘IROQ</b>\n` +
            `<i>Boshlovchimiz tomonidan jonli ijroda:</i>\n` +
            `• 💌 Aytolmagan dil izhorlaringiz\n` +
            `• 🎂 Tug‘ilgan kun tabriklari\n` +
            `• 🥹 Uzrnomalar\n` +
            `• 🤍 Minnatdorchilik maktublari\n` +
            `• 👩‍👩‍👧 Yaqinlarga samimiy tilaklar\n\n` +
            `🎧 <b>PROFESSIONAL OVOZ YOZISH</b>\n` +
            `<i>Maxsus matnlarni professional ovozda yozib beramiz.</i>\n\n` +
            `🎬 <b>VIDEO ROLIK & XOTIRALAR</b>\n` +
            `<i>Yubiley, sevgi va eng qadrli suratlaringizdan unutilmas video montaj.</i>\n` +
            `─────────────────────\n` +
            `✨ <b>NIMA UCHUN BIZNI TANLASHADI?</b>\n` +
            `  ✅ Har bir buyurtma individual\n` +
            `  ✅ Professional ovoz va ijro\n` +
            `  ✅ Sifatli va ta'sirli yondashuv\n` +
            `─────────────────────\n` +
            `👇 <b>Kerakli bo'limni tanlang:</b>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎁 Tabrik buyurtma berish', callback_data: 'make_order' }],
                        [{ text: '📂 Namunaviy videolar', callback_data: 'samples' }],
                        [{ text: '⭐ Chegirmalar va Aksiyalar', callback_data: 'discounts' }],
                        [{ text: '📅 Muhim sanalarni saqlash', callback_data: 'birthdays_menu' }],
                        [{ text: '📞 Biz bilan bog\'lanish', callback_data: 'contact_admin' }],
                        [{ text: '✍️ Fikr-mulohaza qoldirish', callback_data: 'feedback_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (start):', error.message);
    }

});

// Admin qo'shish: /addadmin 12345678
bot.command('addadmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const newAdminId = Number(args[1]);

  if (!newAdminId) {
    return ctx.reply("❌ Xatolik! ID kiriting. Masalan: /addadmin 12345678");
  }

  try {
    await Admin.create({ telegramId: newAdminId });
    ctx.reply(`✅ Yangi admin (ID: ${newAdminId}) muvaffaqiyatli qo'shildi!`);
  } catch (err) {
    ctx.reply("⚠️ Bu ID allaqachon adminlar ro'yxatida bor.");
  }
});

// Admin o'chirish: /deladmin 12345678
bot.command('deladmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const adminId = Number(args[1]);

  await Admin.deleteOne({ telegramId: adminId });
  ctx.reply(`❌ Admin (ID: ${adminId}) bazadan o'chirildi!`);
});

// Buyurtma tushganda barcha adminga xabar ketadigan funksiya
async function notifyAllAdmins(messageText) {
  const dbAdmins = await Admin.find({});
  const adminIds = dbAdmins.map(a => a.telegramId);

  if (process.env.SUPER_ADMIN_ID) {
    adminIds.push(Number(process.env.SUPER_ADMIN_ID));
  }

  const uniqueAdmins = [...new Set(adminIds)];

  for (const id of uniqueAdmins) {
    try {
      await bot.telegram.sendMessage(id, messageText);
    } catch (err) {
      console.log(`Adminga (${id}) xabar yuborishda xatolik:`, err.message);
    }
  }
}
// "Tabrik buyurtma berish" tugmasi bosilganda
// 🎁 "Buyurtma berish" menyusi ochilganda
bot.action('make_order', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.reply(
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `                          ✨ <b>DIL IZHORIM</b> ✨\n` +
            `                                   <b><i>by Munira</i></b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Yuragingizda aytolmay yurgan gaplaringiz bormi? \n` +
            `Yaqin insoningizni kutilmagan tarzda xursand qilmoqchimisiz? ❤️\n\n` +
            `─────────────────────\n` +
            `🎙 <b>KUTILMAGAN QO‘NG‘IROQ</b>\n` +
            `<i>Boshlovchimiz tomonidan jonli ijroda:</i>\n` +
            `• 💌 Aytolmagan dil izhorlaringiz\n` +
            `• 🎂 Tug‘ilgan kun tabriklari\n` +
            `• 🥹 Uzrnomalar\n` +
            `• 🤍 Minnatdorchilik maktublari\n` +
            `• 👩‍👩‍👧 Yaqinlarga samimiy tilaklar\n\n` +
            `🎧 <b>PROFESSIONAL OVOZ YOZISH</b>\n` +
            `<i>Maxsus matnlarni professional ovozda yozib beramiz.</i>\n\n` +
            `🎬 <b>VIDEO ROLIK & XOTIRALAR</b>\n` +
            `<i>Yubiley, sevgi va eng qadrli suratlaringizdan unutilmas video montaj.</i>\n` +
            `─────────────────────\n` +
            `✨ <b>NIMA UCHUN BIZNI TANLASHADI?</b>\n` +
            `  ✅ Har bir buyurtma individual\n` +
            `  ✅ Professional ovoz va ijro\n` +
            `  ✅ Sifatli va ta'sirli yondashuv\n` +
            `─────────────────────\n` +
            `👇 <b>Kerakli bo'limni tanlang:</b>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎙 Kutilmagan qo‘ng‘iroq', callback_data: 'order_call' }],
                        [{ text: '🎬 Video rolik / Xotira', callback_data: 'order_video' }],
                        [{ text: '🎧 Ovoz yozish', callback_data: 'order_audio' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (make_order):', error.message);
    }
});
// 1. Kutilmagan qo'ng'iroq
bot.action('order_call', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = { step: 'waiting_for_order_details', serviceType: 'Kutilmagan qo‘ng‘iroq' };
        
        await ctx.editMessageText(
            `🎙 <b>Kutilmagan qo‘ng‘iroq</b> xizmatini tanladingiz.\n\n` +
            `Iltimos, bu kim uchun va qanday mazmunda bo'lishini yozib yuboring (Masalan: <i>Otamga, tug'ilgan kunlari uchun</i>):`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Ortga qaytish', callback_data: 'make_order' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (order_call):', error.message);
    }
});

// 2. Video rolik / Xotira
bot.action('order_video', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = { step: 'waiting_for_order_details', serviceType: 'Video rolik / Xotira' };
        
        await ctx.editMessageText(
            `🎬 <b>Video rolik / Xotira</b> xizmatini tanladingiz.\n\n` +
            `Iltimos, kim uchun va qanday mavzuda bo'lishini yozib qoldiring:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Ortga qaytish', callback_data: 'make_order' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (order_video):', error.message);
    }
});

// 3. Ovoz yozish
bot.action('order_audio', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = { step: 'waiting_for_order_details', serviceType: 'Ovoz yozish' };
        
        await ctx.editMessageText(
            `🎧 <b>Ovoz yozish</b> xizmatini tanladingiz.\n\n` +
            `Iltimos, kim uchunligini yozib qoldiring (Masalan: <i>Otamga</i>):`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Ortga qaytish', callback_data: 'make_order' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (order_audio):', error.message);
    }
});
// Ortga qaytish tugmasi
bot.action('back_to_start', async (ctx) => {
    try {
        ctx.session = null; 

        await ctx.editMessageText(
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `                               ✨ <b>DIL IZHORIM</b> ✨\n` +
            `                                        <b><i>by Munira</i></b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Yuragingizda aytolmay yurgan gaplaringiz bormi? \n` +
            `Yaqin insoningizni kutilmagan tarzda xursand qilmoqchimisiz? ❤️\n\n` +
            `─────────────────────\n` +
            `🎙 <b>KUTILMAGAN QO‘NG‘IROQ</b>\n` +
            `<i>Boshlovchimiz tomonidan jonli ijroda:</i>\n` +
            `• 💌 Aytolmagan dil izhorlaringiz\n` +
            `• 🎂 Tug‘ilgan kun tabriklari\n` +
            `• 🥹 Uzrnomalar\n` +
            `• 🤍 Minnatdorchilik maktublari\n` +
            `• 👩‍👩‍👧 Yaqinlarga samimiy tilaklar\n\n` +
            `🎧 <b>PROFESSIONAL OVOZ YOZISH</b>\n` +
            `<i>Maxsus matnlarni professional ovozda yozib beramiz.</i>\n\n` +
            `🎬 <b>VIDEO ROLIK & XOTIRALAR</b>\n` +
            `<i>Yubiley, sevgi va eng qadrli suratlaringizdan unutilmas video montaj.</i>\n` +
            `─────────────────────\n` +
            `✨ <b>NIMA UCHUN BIZNI TANLASHADI?</b>\n` +
            `  ✅ Har bir buyurtma individual\n` +
            `  ✅ Professional ovoz va ijro\n` +
            `  ✅ Sifatli va ta'sirli yondashuv\n` +
            `─────────────────────\n` +
            `👇 <b>Kerakli bo'limni tanlang:</b>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎁 Tabrik buyurtma berish', callback_data: 'make_order' }],
                        [{ text: '📂 Namunaviy videolar', callback_data: 'samples' }],
                        [{ text: '⭐ Chegirmalar va Aksiyalar', callback_data: 'discounts' }],
                        [{ text: '📅 Muhim sanalarni saqlash', callback_data: 'birthdays_menu' }],
                        [{ text: '📞 Biz bilan bog\'lanish', callback_data: 'contact_admin' }],
                        [{ text: '✍️ Fikr-mulohaza qoldirish', callback_data: 'feedback_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (back_to_start):', error.message);
    }
});

// Kategoriyalardan biri tanlanganda
bot.action(/^cat_/, async (ctx) => {
    try {
        const categoryName = ctx.match.input.replace('cat_', '');

        // Agar foydalanuvchi "Boshqa" ni tanlasa, unga qo'lda kiritish uchun qadam ochamiz
        if (categoryName === 'Boshqa') {
            ctx.session = { 
                step: 'waiting_for_custom_recipient' 
            };

            await ctx.editMessageText(
                `⚡ <b>Boshqa yo'nalish</b>\n` +
                `────────────────────────\n` +
                `✍️ Iltimos, tabrik **kim uchun** mo'ljallanganini matn ko'rinishida yozib yuboring:\n\n` +
                `<i>(Masalan: Ukamga, Opamga, Ustozimga va hokazo)</i>`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]
                        ]
                    }
                }
            );
            return;
        }

        // Qolgan standart kategoriyalar uchun odatdagidek raqam so'rashga o'tamiz
        ctx.session = { 
            selectedCategory: categoryName,
            step: 'waiting_for_client_phone' 
        };

        await ctx.editMessageText(
            `📌 <b>Tanlangan yo'nalish:</b> <code>${categoryName}</code>\n` +
            `────────────────────────\n` +
            `📞 <b>1-Qadam:</b> Iltimos, <b>o'zingizning bog'lanish uchun telefon raqamingizni</b> yuboring:\n\n` +
            `<i>(Masalan: +998901234567)</i>`, 
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (category):', error.message);
    }
});
// Matn kelganda bosqichma-bosqich qabul qilish
bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.step) return;

    const text = ctx.message.text ? ctx.message.text.trim() : '';
    const userId = ctx.from.id;
    const userFirstName = ctx.from.first_name || 'Foydalanuvchi';
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Username yo\'q';
    const phoneRegex = /^\+?998\d{9}$/;

    // Foydalanuvchi yuborgan yangi xabarni darhol o'chiramiz (Chat toza turadi)
    try {
        await ctx.deleteMessage().catch(() => {});
    } catch (e) {}

    // Botning mavjud xabarini tahrirlash uchun yordamchi funksiya
    const updateMenu = async (messageText, extra = {}) => {
        let edited = false;
        if (ctx.session.lastMessageId) {
            try {
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    ctx.session.lastMessageId,
                    undefined,
                    messageText,
                    extra
                );
                edited = true;
            } catch (e) {
                edited = false;
            }
        }
        // Agar edit o'xshamasa (masalan xabar o'chirilgan bo'lsa), yangisini yuborib saqlaymiz
        if (!edited) {
            const sentMsg = await ctx.reply(messageText, extra);
            ctx.session.lastMessageId = sentMsg.message_id;
        }
    };

    // ==========================================
    // 1. ✍️ FIKR-MULOHAZANI QABUL QILISH
    // ==========================================
    if (ctx.session.step === 'waiting_for_feedback') {
        if (text.length < 3) return;

        try {
            const adminIdsEnv = process.env.ADMIN_IDS || process.env.ADMIN_ID;
            if (adminIdsEnv) {
                const adminIds = adminIdsEnv.split(',').map(id => id.trim());
                const adminMessage = 
                    `💬 <b>YANGI FIKR-MULOHAZA / TAKLIF!</b>\n` +
                    `────────────────────────\n` +
                    `👤 <b>Foydalanuvchi:</b> ${userFirstName} (${username})\n` +
                    `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
                    `────────────────────────\n` +
                    `✍️ <b>Xabar:</b>\n${text}\n` +
                    `────────────────────────`;

                for (const adminId of adminIds) {
                    try {
                        await bot.telegram.sendMessage(adminId, adminMessage, { parse_mode: 'HTML' });
                    } catch (err) {}
                }
            }

            await updateMenu(
                `✨ <b>Rahmat! Fikringiz muvaffaqiyatli yuborildi.</b>\n\n` +
                `Xizmatlarimizni yanada yaxshilashga yordam berganingiz uchun tashakkur! ❤️`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]]
                    }
                }
            );

            ctx.session = null;
            return;
        } catch (err) {
            ctx.session = null;
        }
    }

    // ==========================================
    // 2. XIZMAT TAFSILOTI (Masalan: Ovoz yozish - Otamga)
    // ==========================================
    if (ctx.session.step === 'waiting_for_order_details') {
        if (text.length < 2) return;

        ctx.session.selectedCategory = `${ctx.session.serviceType}: ${text}`;
        ctx.session.step = 'waiting_for_client_phone';

        await updateMenu(
            `📌 <b>Xizmat va yo'nalish:</b> <code>${ctx.session.selectedCategory}</code>\n` +
            `────────────────────────\n` +
            `📞 Iltimos, <b>telefon raqamingizni</b> yuboring:\n\n` +
            `<i>(Masalan: +998901234567)</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]]
                }
            }
        );
        return;
    }

    // ==========================================
    // 3. "BOSHQA" UCHUN QABUL QILISH
    // ==========================================
    if (ctx.session.step === 'waiting_for_custom_recipient') {
        if (text.length < 2) return;

        ctx.session.selectedCategory = text;
        ctx.session.step = 'waiting_for_client_phone';

        await updateMenu(
            `📌 <b>Tanlangan yo'nalish:</b> <code>${text}</code>\n` +
            `────────────────────────\n` +
            `📞 Iltimos, <b>telefon raqamingizni</b> yuboring:\n\n` +
            `<i>(Masalan: +998901234567)</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]]
                }
            }
        );
        return;
    }

// ==========================================
    // 4. MIJOZ RAQAMINI QABUL QILISH VA BUYURTMANI SAQLASH
    // ==========================================
    if (ctx.session.step === 'waiting_for_client_phone') {
        if (!phoneRegex.test(text)) return;

        const recipientType = ctx.session.selectedCategory; 
        const clientPhone = text; 

        try {
            // Adminlar ro'yxatini olish
            const adminIdsEnv = process.env.ADMIN_IDS || process.env.ADMIN_ID;
            let assignedAdminId = null;

            if (adminIdsEnv) {
                const adminIds = adminIdsEnv.split(',').map(id => id.trim()).filter(Boolean);

                if (adminIds.length > 0) {
                    // Bazadagi jami buyurtmalar sonini sanaymiz
                    const totalOrders = await Order.countDocuments();
                    
                    // Navbatdagi adminni aniqlaymiz (Matematik modul bo'yicha teng bo'linadi)
                    assignedAdminId = Number(adminIds[totalOrders % adminIds.length]);
                }
            }

            // Buyurtmani bazaga saqlash
            const newOrder = new Order({
                userId: userId,
                recipientType: recipientType,
                clientPhone: clientPhone,
                assignedAdmin: assignedAdminId,
                status: 'pending'
            });

            await newOrder.save();

            // Mijozga javob yuborish
            await updateMenu(
                `✨ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b> ✨\n` +
                `────────────────────────\n` +
                `📌 <b>Yo'nalish:</b> <code>${recipientType}</code>\n` +
                `👤 <b>Sizning raqamingiz:</b> <code>${clientPhone}</code>\n` +
                `────────────────────────\n` +
                `⏳ <i>Tez orada mas'ul adminimiz siz bilan bog'lanadi!</i>`, 
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]]
                    }
                }
            );

            // Faqat biriktirilgan (navbatdagi) adminga xabar yuborish
            if (assignedAdminId) {
                const adminMessage = `🔔 <b>YANGI BUYURTMA (SIZGA BIRIKTIRILDI)!</b>\n` +
                                     `────────────────────────\n` +
                                     `👤 <b>Mijoz:</b> ${userFirstName} (${username})\n` +
                                     `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
                                     `🎁 <b>Yo'nalish:</b> <b>${recipientType}</b>\n` +
                                     `────────────────────────\n` +
                                     `📞 <b>Mijoz raqami:</b> <code>${clientPhone}</code>\n` +
                                     `────────────────────────`;

                try {
                    await bot.telegram.sendMessage(assignedAdminId, adminMessage, { parse_mode: 'HTML' });
                } catch (err) {
                    console.error(`Adminga xabar yuborishda xatolik (${assignedAdminId}):`, err);
                }
            }

            ctx.session = null;
        } catch (err) {
            console.error('Buyurtmani saqlashda xatolik:', err);
            ctx.session = null;
        }
        return;
    }
    // ==========================================
    // 5. SANA UCHUN ISMNI KUTISH
    // ==========================================
    if (ctx.session.step === 'waiting_for_bday_name') {
        if (text.length < 2) return;

        ctx.session.bdayName = text;
        ctx.session.step = 'waiting_for_bday_date';

        await updateMenu(
            `📌 <b>Kim uchun:</b> <code>${text}</code>\n` +
            `────────────────────────\n` +
            `📅 <b>2-Qadam:</b> Sanani <b>KUN.OY</b> formatida yuboring:\n\n` +
            `<i>(Masalan: 15.08 — ya'ni 15-avgust uchun)</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'birthdays_menu' }]]
                }
            }
        );
        return;
    }

    // ==========================================
    // 6. SANANI KUTISH VA SAQLASH
    // ==========================================
    if (ctx.session.step === 'waiting_for_bday_date') {
        const parts = text.split('.'); 
        if (parts.length !== 2) return;

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) return;

        try {
            const newBirthday = new Birthday({
                userId: ctx.from.id, 
                recipientName: ctx.session.bdayName,
                day: day,  
                month: month 
            });

            await newBirthday.save();

            const months = ['', 'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
            
            await updateMenu(
                `✨ <b>Sana muvaffaqiyatli saqlandi!</b> ✨\n` +
                `────────────────────────\n` +
                `👤 <b>Kim uchun:</b> <code>${ctx.session.bdayName}</code>\n` +
                `📅 <b>Sana:</b> <code>${day}-${months[month]}</code>\n` + 
                `────────────────────────\n` +
                `🔔 <i>Sana yaqinlashganda sizga o'z vaqtida eslatma yuboramiz!</i>`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]]
                    }
                }
            );

            ctx.session = null;
        } catch (err) {
            ctx.session = null;
        }
        return;
    }
});
// ////////////////////////////////////////////////
// Namunaviy videolar bazasi (kod ichida saqlanadi, MongoDB'ni band qilmaydi)
// ////////////////////////////////////////////////
const sampleVideos = {
    'Otamga': {
        videoUrl: 'https://t.me/Dil_izhorim_M/9766',
        caption: `👨 <b>Otamga bag'ishlangan namunaviy video</b>\n\n` +
                 `────────────────────────\n` +
                 `💬 <i>Bu video otangiz uchun eng yaxshi tabrik so'zlari va dizaynda tayyorlangan.</i>\n\n` +
                 `🔗 <b>To'liq ko'rish:</b> https://t.me/Dil_izhorim_M`
    },
    'Onamga': {
        videoUrl: 'https://t.me/Dil_izhorim_M/9761',
        caption: `👩 <b>Onamga bag'ishlangan namunaviy video</b>\n\n` +
                 `────────────────────────\n` +
                 `💬 <i>Onajonlarimiz uchun maxsus iliq tilaklar va video dizayn.</i>\n\n` +
                 `🔗 <b>To'liq ko'rish:</b> https://t.me/Dil_izhorim_M`
    },
    'Opa-Singil': {
        videoUrl: 'https://t.me/Dil_izhorim_M/9765',
        caption: `🤝 <b>Aka-Ukaga bag'ishlangan namunaviy video</b>\n\n` +
                 `────────────────────────\n` +
                 `💬 <i>Opa-Singil uchun qiziqarli va samimiy tabrik formati.</i>\n\n` +
                 `🔗 <b>To'liq ko'rish:</b> https://t.me/Dil_izhorim_M`
    },
    'Sevgan': {
        videoUrl: 'https://t.me/Dil_izhorim_M/9761',
        caption: `❤️ <b>Sevgan insonga bag'ishlangan video</b>\n\n` +
                 `────────────────────────\n` +
                 `💬 <i>Romantik va yurakdan chiqqan tabrik namunasi.</i>\n\n` +
                 `🔗 <b>To'liq ko'rish:</b> https://t.me/Dil_izhorim_M`
    }
    // 'Boshqa' bu yerdan olib tashlandi, chunki u pastda alohida havolali action bo'ladi
};
// 📂 "Namunaviy videolar" tugmasi bosilganda (Asosiy xabarni yangilaymiz)
bot.action('samples', async (ctx) => {
    try {
        // Agar oldin video xabari kelgan bo'lsa, uni tozalashga harakat qilamiz
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.editMessageText(
            `📂 <b>Namunaviy videolar bo'limi</b>\n` +
            `────────────────────────\n` +
            `👇 <i>Qaysi yo'nalishdagi videolarni ko'rmoqchisiz?</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👨 Otamga', callback_data: 'sample_Otamga' }, 
                            { text: '👩 Onamga', callback_data: 'sample_Onamga' }
                        ],
                        [
                            { text: '🤝 Opa-Singil', callback_data: 'sample_Opa-Singil' }, 
                            { text: '❤️ Sevgan insonga', callback_data: 'sample_Sevgan' },
                            { text: '⚡ Boshqa insonga', callback_data: 'sample_Boshqa' }
                        ],
                        [{ text: '⬅️ Ortga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    } catch (error) {
        // Agar xabarni edit qilib bo'lmasa (masalan, oldingi xabar video bo'lsa), uni o'chirib yangidan chiqaramiz
        try {
            await ctx.deleteMessage();
        } catch (e) {}

        await ctx.reply(
            `📂 <b>Namunaviy videolar bo'limi</b>\n` +
            `────────────────────────\n` +
            `👇 <i>Qaysi yo'nalishdagi videolarni ko'rmoqchisiz?</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👨 Otamga', callback_data: 'sample_Otamga' }, 
                            { text: '👩 Onamga', callback_data: 'sample_Onamga' }
                        ],
                        [
                            { text: '🤝 Opa-Singil', callback_data: 'sample_Opa-Singil' }, 
                            { text: '❤️ Sevgan insonga', callback_data: 'sample_Sevgan' },
                            { text: '⚡ Boshqa insonga', callback_data: 'sample_Boshqa' }
                        ],
                        [{ text: '⬅️ Ortga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    }
});
// ⚡ "Boshqa insonga" namunaviy video tugmasi bosilganda kanal havolasini chiqarish
bot.action('sample_Boshqa', async (ctx) => {
    try {
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.reply(
            `⚡ <b>Barcha boshqa yo'nalishdagi namunaviy videolar</b>\n` +
            `────────────────────────\n` +
            `💬 <i>Opamga, ustozimizga va boshqa barcha turdagi tayyor tabrik videolarini bizning maxsus kanalimizda ko'rishingiz mumkin!</i>\n\n` +
            `👇 Quyidagi tugmani bosing va barcha videolardan bahramand bo'ling:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🎬 Barcha videolarni ko\'rish', url: 'https://t.me/Dil_izhorim_M' } // Kanal havolangiz
                        ],
                        [{ text: '⬅️ Videolar bo\'limiga qaytish', callback_data: 'samples' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (sample Boshqa):', error.message);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi.');
    }
});

// Qaysidir namunaviy video tugmasi bosilganda (Boshqadan boshqalari uchun)
bot.action(/^sample_/, async (ctx) => {
    try {
        const sampleKey = ctx.match.input.replace('sample_', '');
        const sampleData = sampleVideos[sampleKey];

        if (sampleData) {
            // Oldingi menyu xabarini o'chirib yuboramiz
            try {
                await ctx.deleteMessage();
            } catch (e) {}

            // Videoni yangi xabar qilib yuboramiz
            await ctx.replyWithVideo(sampleData.videoUrl, {
                caption: sampleData.caption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Videolar bo\'limiga qaytish', callback_data: 'samples' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            });
        } else {
            await ctx.answerCbQuery('⚠️ Hozircha bu yo\'nalishda video mavjud emas.');
        }
    } catch (error) {
        console.log('Xatolik (sample video):', error.message);
        await ctx.answerCbQuery('❌ Videoni yuklashda xatolik yuz berdi.');
    }
});
// Qaysidir namunaviy video tugmasi bosilganda
bot.action(/^sample_/, async (ctx) => {
    try {
        const sampleKey = ctx.match.input.replace('sample_', '');
        const sampleData = sampleVideos[sampleKey];

        if (sampleData) {
            // Oldingi menyu xabarini o'chirib yuboramiz
            try {
                await ctx.deleteMessage();
            } catch (e) {}

            // Videoni yangi xabar qilib yuboramiz
            await ctx.replyWithVideo(sampleData.videoUrl, {
                caption: sampleData.caption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Videolar bo\'limiga qaytish', callback_data: 'samples' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            });
        } else {
            await ctx.answerCbQuery('⚠️ Hozircha bu yo\'nalishda video mavjud emas.');
        }
    } catch (error) {
        console.log('Xatolik (sample video):', error.message);
        await ctx.answerCbQuery('❌ Videoni yuklashda xatolik yuz berdi.');
    }
});

// Videolar ichidan bosh sahifaga yoki orqaga qaytish uchun maxsus tugma
bot.action('back_to_start_from_video', async (ctx) => {
    try {
        ctx.session = null;
        // Video xabarining o'zini o'chiramiz
        await ctx.deleteMessage();

        // Asosiy menyuni matn ko'rinishida chiqaramiz
        await ctx.reply(
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `                               ✨ <b>DIL IZHORIM</b> ✨\n` +
            `                                        <b><i>by Munira</i></b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Yuragingizda aytolmay yurgan gaplaringiz bormi? \n` +
            `Yaqin insoningizni kutilmagan tarzda xursand qilmoqchimisiz? ❤️\n\n` +
            `─────────────────────\n` +
            `🎙 <b>KUTILMAGAN QO‘NG‘IROQ</b>\n` +
            `<i>Boshlovchimiz tomonidan jonli ijroda:</i>\n` +
            `• 💌 Aytolmagan dil izhorlaringiz\n` +
            `• 🎂 Tug‘ilgan kun tabriklari\n` +
            `• 🥹 Uzrnomalar\n` +
            `• 🤍 Minnatdorchilik maktublari\n` +
            `• 👩‍👩‍👧 Yaqinlarga samimiy tilaklar\n\n` +
            `🎧 <b>PROFESSIONAL OVOZ YOZISH</b>\n` +
            `<i>Maxsus matnlarni professional ovozda yozib beramiz.</i>\n\n` +
            `🎬 <b>VIDEO ROLIK & XOTIRALAR</b>\n` +
            `<i>Yubiley, sevgi va eng qadrli suratlaringizdan unutilmas video montaj.</i>\n` +
            `─────────────────────\n` +
            `✨ <b>NIMA UCHUN BIZNI TANLASHADI?</b>\n` +
            `  ✅ Har bir buyurtma individual\n` +
            `  ✅ Professional ovoz va ijro\n` +
            `  ✅ Sifatli va ta'sirli yondashuv\n` +
            `─────────────────────\n` +
            `👇 <b>Kerakli bo'limni tanlang:</b>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎁 Tabrik buyurtma berish', callback_data: 'make_order' }],
                        [{ text: '📂 Namunaviy videolar', callback_data: 'samples' }],
                        [{ text: '⭐ Chegirmalar va Aksiyalar', callback_data: 'discounts' }],
                        [{ text: '📅 Muhim sanalarni saqlash', callback_data: 'birthdays_menu' }],
                        [{ text: '📞 Biz bilan bog\'lanish', callback_data: 'contact_admin' }],
                        [{ text: '✍️ Fikr-mulohaza qoldirish', callback_data: 'feedback_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (back from video):', error.message);
    }
});

// ⭐ "Chegirmalar va Aksiyalar" tugmasi bosilganda
bot.action('discounts', async (ctx) => {
    try {
        // Agar oldingi xabar video bo'lsa yoki matn bo'lsa, xatolik bermasligi uchun o'chiramiz
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.reply(
            `🎁 <b>AKSIYALAR VA MAXSUS BONUSLAR</b>\n\n` +
            `💝 <b>2 TA INSONNI BIR VAQTda XURSAND QILING</b>\n` +
            `Bir vaqtning o‘zida 2 ta yaqin insoningiz uchun buyurtma bersangiz, sizga <b>10% CHEGIRMA</b> taqdim etamiz! 🎉\n\n` +
            `<i>Masalan:</i>\n` +
            `👩 Onangiz + 👨 Dadangiz\n` +
            `👩‍❤️‍👨 Turmush o‘rtog‘ingiz + 🧑‍🤝‍🧑 Do‘stingiz\n` +
            `👵 Buvingiz + 👴 Buvangiz\n\n` +
            `<i>Bir buyurtmada ikki qalbga quvonch ulashing va 10% kamroq to‘lang!</i> 💌\n\n` +
            `────────────────────────\n\n` +
            `🎁 <b>OYLIK MAXSUS BONUS</b>\n\n` +
            `Bir oy davomida <b>5 tadan ko‘p</b> buyurtma bergan mijozlarimizga:\n\n` +
            `🎀 <b>+1 TA MAXSUS SET</b>\n` +
            `💰 Qiymati: <b>100 000 SO‘M</b>\n` +
            `🎁 <b>MUTLAQO BEPUL!</b>\n\n` +
            `<i>Ya’ni siz 5+ ta buyurtma berasiz va bizdan 100 000 so‘mlik maxsus setni SOVG‘A sifatida olasiz!</i> ❤️\n\n` +
            `────────────────────────\n\n` +
            `📲 <b>AKSIYADAN FOYDALANISH UCHUN</b>\n\n` +
            `Buyurtmangizni hoziroq rasmiylashtiring va <b>“Dil izhorim by Munira”</b>ning maxsus chegirma va bonuslariga ega bo‘ling! 💌\n\n` +
            `💝 <i>Yaqinlaringizni xursand qiling. O‘zingiz esa foydali bonuslarga ega bo'ling!</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🎁 Hozir buyurtma berish', callback_data: 'make_order' }
                        ],
                        [
                            { text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }
                        ]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (discounts):', error.message);
    }
});
const Birthday = require('./models/Birthday'); // Modelni chaqirib qo'yamiz
const cron = require('node-cron');

// 📅 "Muhim sanalar" menyusi
bot.action('birthdays_menu', async (ctx) => {
    try {
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.reply(
            `📅 <b>YAQINLARINGIZNING MUHIM SANALARINI UNUTMANG!</b>\n\n` +
            `Onangizning tug‘ilgan kuni qachon? ❤️\n` +
            `Dadamizniki-chi? 👨\n` +
            `Turmush o‘rtog‘ingiz, farzandlaringiz yoki yaqin do‘stlaringizning tug‘ilgan kunlarini eslab qolish qiyinmi? 🎂\n\n` +
            `Endi buning uchun alohida kalendar yuritishingiz shart emas! 😉\n\n` +
            `💌 <b>"Dil izhorim by Munira"</b> sizga eslatib turadi!\n\n` +
            `📲 Yaqinlaringizning:\n` +
            `🎂 <b>Tug‘ilgan kun sanasi</b>\n` +
            `💍 <b>To‘y yoki yubiley sanasi</b>\n` +
            `❤️ <b>Siz uchun muhim bo‘lgan boshqa sanalarni</b>\n\n` +
            `botimizga kiritib qo‘ying.\n\n` +
            `🔔 <i>Biz esa muhim sana yaqinlashganda sizga eslatma yuboramiz.</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Sanani qo\'shish', callback_data: 'add_birthday_start' }],
                        [{ text: '📋 Saqlangan sanalarim', callback_data: 'view_my_birthdays' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (birthdays_menu):', error.message);
    }
});

// Sanani qo'shish jarayonini boshlash
bot.action('add_birthday_start', async (ctx) => {
    try {
        ctx.session = { step: 'waiting_for_bday_name' };

        // Oldingi xabarni o'chirib yuboramiz
        try { await ctx.deleteMessage(); } catch (e) {}

        // Yangi xabar yuboramiz
        await ctx.reply(
            `✍️ <b>1-Qadam:</b> Bu sana kimga tegishli?\n` +
            `────────────────────────\n` +
            `<i>(Masalan: Onamga, Dadamga, Turmush o'rtog'imga va hokazo)</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '❌ Bekor qilish', callback_data: 'birthdays_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (add_birthday_start):', error.message);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
});
// Mijozning saqlangan sanalarini ko'rsatish
bot.action('view_my_birthdays', async (ctx) => {
    try {
        const myBirthdays = await Birthday.find({ userId: ctx.from.id });
        
        if (myBirthdays.length === 0) {
            return await ctx.answerCbQuery('⚠️ Siz hali hech qanday sana saqlamadingiz.');
        }

        let msg = `📋 <b>Siz saqlagan muhim sanalar:</b>\n\n`;
        const months = ['', 'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
        
        myBirthdays.forEach((bday, index) => {
            msg += `${index + 1}. <b>${bday.recipientName}</b>: ${bday.day}-${months[bday.month]}\n`;
        });

        await ctx.editMessageText(msg, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Ortga qaytish', callback_data: 'birthdays_menu' }]
                ]
            }
        });
    } catch (error) {
        console.log('Xatolik (view_my_birthdays):', error.message);
    }
});
// Har kuni soat 09:00 da ishlaydi va ertangi kun uchun eslatma yuboradi
cron.schedule('0 9 * * *', async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Ertangi kunni olamiz

        const tDay = tomorrow.getDate();
        const tMonth = tomorrow.getMonth() + 1; // JavaScript'da oylar 0 dan boshlangani uchun +1

        // Alohida bazadan ertangi kunga to'g'ri keladigan sanalarni qidiramiz
        const upcomingBirthdays = await Birthday.find({ day: tDay, month: tMonth });

        for (const item of upcomingBirthdays) {
            try {
                await bot.telegram.sendMessage(
                    item.userId,
                    `🔔 <b>Eslatma!</b>\n\n` +
                    `<b>${item.recipientName}</b>ning tug‘ilgan kuniga 1 kun qoldi! ❤️\n\n` +
                    `U kishini <b>"Dil izhorim by Munira"</b> orqali kutilmagan qo‘ng‘iroq yoki maxsus tabrik bilan xursand qilishni xohlaysizmi? 🎁`,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🎁 Hozir buyurtma berish', callback_data: 'make_order' }]
                            ]
                        }
                    }
                );
            } catch (err) {
                console.log(`Foydalanuvchiga (${item.userId}) eslatma yuborib bo'lmadi:`, err.message);
            }
        }
        console.log('Tug\'ilgan kun eslatmalari tekshirildi.');
    } catch (error) {
        console.log('Cron xatoligi:', error.message);
    }
});
// 📞 "Biz bilan bog'lanish" menyusi ochilganda
bot.action('contact_admin', async (ctx) => {
    try {
        // Tugma bosilgandagi animatsiyani to'xtatish uchun
        await ctx.answerCbQuery().catch(() => {});

        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.reply(
            `📞 <b>BIZ BILAN BOG'LANISH</b>\n\n` +
            `Savollaringiz bormi yoki buyurtma bo'yicha murojaat qilmoqchimisiz? Biz har doim aloqadamiz! 👇\n\n` +
            `👤 <b>Admin:</b> <a href="https://t.me/Elnurovna_777">@Elnurovna_777</a>\n` +
            `📱 <b>Telefon raqam:</b> <code>+998 87 951 03 97</code>\n` +
            `⏰ <b>Ish vaqti:</b> 24/7_dam olish kunisiz\n\n` +
            `💬 <i>Murojaatingizni yozib qoldirishingiz mumkin, admin tez orada javob beradi!</i>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✍️ Adgang yozish', url: 'https://t.me/Elnurovna_777' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start_from_video' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.log('Xatolik (contact_admin):', error.message);
    }
});

// ✍️ Fikr-mulohaza menyusi ochilganda
bot.action('feedback_menu', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    
    // Bot menyu xabarining ID-sini saqlaymiz
    ctx.session = { 
        step: 'waiting_for_feedback',
        lastMessageId: ctx.callbackQuery.message.message_id 
    };

    await ctx.editMessageText(
        `✍️ <b>FIKR-MULOHAZA</b>\n\n` +
        `Xizmatlarimiz haqida fikr yoki taklifingizni yozib yuboring:`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]]
            }
        }
    );
});

// Admin qo'shish: /addadmin 12345678
bot.command('addadmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const newAdminId = Number(args[1]);

  if (!newAdminId) {
    return ctx.reply("❌ Xatolik! ID kiriting. Masalan: /addadmin 12345678");
  }

  try {
    await Admin.create({ telegramId: newAdminId });
    ctx.reply(`✅ Yangi admin (ID: ${newAdminId}) muvaffaqiyatli qo'shildi!`);
  } catch (err) {
    ctx.reply("⚠️ Bu ID allaqachon adminlar ro'yxatida bor.");
  }
});

// Admin o'chirish: /deladmin 12345678
bot.command('deladmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const adminId = Number(args[1]);

  await Admin.deleteOne({ telegramId: adminId });
  ctx.reply(`❌ Admin (ID: ${adminId}) bazadan o'chirildi!`);
});
// Botni ishga tushirish
bot.launch()
    .then(() => console.log('🤖 Bot muvaffaqiyatli ishga tushdi!'))
    .catch((err) => console.error('❌ Botni ishga tushirishda xatolik:', err));

// Dastur to'xtaganda bazani yopish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
