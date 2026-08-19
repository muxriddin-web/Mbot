require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const cron = require('node-cron');
const Order = require('./models/Order');
const Admin = require('./models/Admin');
const Birthday = require('./models/Birthday');

// ==========================================
// ✅ TUZATISH #1: BOT_TOKEN mavjudligini va to'g'riligini ishga tushishdanoq tekshirish
// (server "tokenni tanimadi" xatosi berganda, aynan shu joy sababni darhol ko'rsatadi)
// ==========================================
const BOT_TOKEN = (process.env.BOT_TOKEN || '').trim();
if (!BOT_TOKEN) {
    console.error('❌ XATOLIK: BOT_TOKEN topilmadi yoki bo\'sh! .env fayli bot.js bilan BIR XIL papkada ekanligini va ichida BOT_TOKEN=... qatori borligini tekshiring.');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Sizning o'zingizning o'zgarmas asosiy Telegram ID raqamingiz
const SUPER_ADMIN_ID = 6380707116; // <-- O'z ID raqamingizni yozing

// MUHIM: Bot yaratilgandan keyin darhol session ni ulaymiz
bot.use(session());

// MongoDB bazasiga ulanish
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB bazasiga muvaffaqiyatli ulandi!'))
    .catch((err) => console.error('❌ Bazaga ulanishda xatolik:', err));

async function isAdmin(telegramId) {
  if (Number(telegramId) === Number(SUPER_ADMIN_ID)) return true;
  const admin = await Admin.findOne({ telegramId: Number(telegramId) });
  return !!admin && admin.isActive;
}

// ==========================================
// ✅ TUZATISH #2: Navbat bilan (round-robin) admin biriktirish
// Admin.js sxemasida shu maqsad uchun tayyor turgan "activeOrdersCount" maydonidan
// foydalanamiz: har doim ENG KAM buyurtma olgan faol adminga navbat beriladi.
// Natijada: 1-mijoz -> 1-admin, 2-mijoz -> 2-admin, ... va h.k. avtomatik ta'minlanadi,
// hattoki adminlar sonini keyinchalik o'zgartirsangiz ham adolatli taqsimlanadi.
// Bu funksiya faqat isActive:true bo'lgan (ya'ni superadmin o'chirib qo'ymagan)
// yordamchi adminlarni ko'rib chiqadi — superadminning o'zi mijozlarga hech qachon
// ko'rsatilmaydi.
// ==========================================
async function getNextAvailableAdmin() {
    const activeAdmins = await Admin.find({ isActive: true }).sort({ activeOrdersCount: 1, _id: 1 });
    if (!activeAdmins.length) return null;

    const chosen = activeAdmins[0];
    // Tanlangan adminning hisoblagichini oshiramiz, shunda keyingi mijoz boshqa adminga tushadi
    await Admin.updateOne({ _id: chosen._id }, { $inc: { activeOrdersCount: 1 } });
    return chosen;
}

// ==========================================
// 🚀 UMUMIY QISM — Bosh menyu matni va tugmalari bitta joyda saqlanadi
// ==========================================
const START_MENU_TEXT = `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✨✨✨ <b>DIL IZHORIM</b> ✨✨✨\n` +
    `『 <b><i>by Munira</i></b> 』\n` +
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
    `👇 <b>Kerakli bo'limni tanlang:</b>`;

const START_MENU_KEYBOARD = {
    inline_keyboard: [
        [{ text: '🎁 Tabrik buyurtma berish', callback_data: 'make_order' }],
        [{ text: '📂 Namunaviy videolar', callback_data: 'samples' }],
        [{ text: '⭐ Chegirmalar va Aksiyalar', callback_data: 'discounts' }],
        [{ text: '📅 Muhim sanalarni saqlash', callback_data: 'birthdays_menu' }],
        [{ text: '📞 Biz bilan bog\'lanish', callback_data: 'contact_admin' }],
        [{ text: '✍️ Fikr-mulohaza qoldirish', callback_data: 'feedback_menu' }]
    ]
};

// Yordamchi funksiya: Rasm/Video xabarni matnga o'zgartirish yoki tahrirlash uchun
async function safeEditOrReply(ctx, text, keyboard) {
    try {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch (error) {
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
}

// /start komandasi
// ✅ TUZATISH #3: endi START_MENU_TEXT/KEYBOARD qayta ishlatiladi (oldin matn shu yerda
// yana bir marta qo'lda yozilgan edi va asl matndan ozgina farq qilib qolgan edi)
bot.start(async (ctx) => {
    try {
        await ctx.reply(START_MENU_TEXT, {
            parse_mode: 'HTML',
            reply_markup: START_MENU_KEYBOARD
        });
    } catch (error) {
        console.log('Xatolik (start):', error.message);
    }
});

// "Tabrik buyurtma berish" tugmasi bosilganda
bot.action('make_order', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const keyboard = {
            inline_keyboard: [
                [{ text: '🎙 Kutilmagan qo‘ng‘iroq', callback_data: 'order_call' }],
                [{ text: '🎬 Video rolik / Xotira', callback_data: 'order_video' }],
                [{ text: '🎧 Ovoz yozish', callback_data: 'order_audio' }],
                [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, START_MENU_TEXT, keyboard);
    } catch (error) {
        console.log('Xatolik (make_order):', error.message);
    }
});

// Xizmatlar turlari (3 ta tugma uchun bitta handler)
const servicesData = {
    'order_call': { type: 'Kutilmagan qo‘ng‘iroq', icon: '🎙' },
    'order_video': { type: 'Video rolik / Xotira', icon: '🎬' },
    'order_audio': { type: 'Ovoz yozish', icon: '🎧' }
};

// ✅ TUZATISH #4: admin.name -> admin.fullName, isActive filtri, navbat bilan
// biriktirish (getNextAvailableAdmin) va telefon raqamini ham xabarga qo'shish
bot.action(['order_call', 'order_video', 'order_audio'], async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const action = ctx.match[0];
        const service = servicesData[action];
        const userId = ctx.from.id;

        // 1. Navbatdagi (eng kam bandligi bo'lgan) faol adminni tanlaymiz
        const assignedAdmin = await getNextAvailableAdmin();

        if (!assignedAdmin) {
            return await safeEditOrReply(ctx, "Hozirda bog'lanish uchun adminlar mavjud emas. Iltimos, keyinroq urinib ko'ring.", {
                inline_keyboard: [[{ text: '⬅️ Ortga qaytish', callback_data: 'make_order' }]]
            });
        }

        // 2. Buyurtmani bazaga saqlaymiz
        await Order.create({
            userId: userId,
            recipientType: service.type,
            clientPhone: 'Korsatilmagan',
            assignedAdmin: assignedAdmin.telegramId,
            status: 'pending',
            createdAt: new Date()
        });

        // 3. Mijozga adminning profil havolasi VA telefon raqamini yuboramiz
        const adminLink = `tg://user?id=${assignedAdmin.telegramId}`;

        let msgText = `${service.icon} <b>${service.type}</b> xizmatini tanladingiz.\n\n`;
        msgText += `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n`;
        msgText += `Batafsil ma'lumot berish va buyurtmani kelishish uchun quyidagi ma'lumotlar orqali adminga murojaat qiling:\n\n`;
        msgText += `👤 <b>Admin:</b> <a href="${adminLink}">${assignedAdmin.fullName || 'Admin'}</a>\n`;
        if (assignedAdmin.phone && assignedAdmin.phone !== 'Kiritilmagan') {
            msgText += `📱 <b>Telefon:</b> <code>${assignedAdmin.phone}</code>`;
        }

        const keyboard = {
            inline_keyboard: [
                [{ text: '👤 Adminga yozish', url: adminLink }],
                [{ text: '⬅️ Ortga qaytish', callback_data: 'make_order' }]
            ]
        };

        await safeEditOrReply(ctx, msgText, keyboard);

    } catch (error) {
        console.log(`Xatolik (${ctx.match[0]}):`, error.message);
        await ctx.reply("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
});

// ==========================================
// ASOSIY MENYU VA ORTGA QAYTISH
// ==========================================
bot.action(['back_to_start', 'back_to_start_from_video'], async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = null;
        await safeEditOrReply(ctx, START_MENU_TEXT, START_MENU_KEYBOARD);
    } catch (error) {
        console.log('Xatolik (back_to_start):', error.message);
    }
});

// ==========================================
// KATEGORIYALAR (cat_...) — hozircha hech qanday tugma bu handlerni chaqirmaydi
// (kelajakda ishlatish uchun qoldirildi), lekin izchillik uchun shu yerda ham
// xuddi yuqoridagi kabi tuzatildi.
// ==========================================
bot.action(/^cat_/, async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const categoryName = ctx.match.input.replace('cat_', '');
        const userId = ctx.from.id;

        const assignedAdmin = await getNextAvailableAdmin();

        if (!assignedAdmin) {
            return await safeEditOrReply(ctx, "Hozirda bog'lanish uchun adminlar mavjud emas. Iltimos, keyinroq urinib ko'ring.", {
                inline_keyboard: [[{ text: '⬅️ Ortga qaytish', callback_data: 'back_to_start' }]]
            });
        }

        await Order.create({
            userId: userId,
            recipientType: categoryName,
            clientPhone: 'Korsatilmagan',
            assignedAdmin: assignedAdmin.telegramId,
            status: 'pending',
            createdAt: new Date()
        });

        const adminLink = `tg://user?id=${assignedAdmin.telegramId}`;

        let msgText = `📌 <b>Tanlangan yo'nalish:</b> <code>${categoryName}</code>\n\n`;
        msgText += `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n`;
        msgText += `Batafsil ma'lumot berish va buyurtmani kelishish uchun quyidagi ma'lumotlar orqali adminga murojaat qiling:\n\n`;
        msgText += `👤 <b>Admin:</b> <a href="${adminLink}">${assignedAdmin.fullName || 'Admin'}</a>\n`;
        if (assignedAdmin.phone && assignedAdmin.phone !== 'Kiritilmagan') {
            msgText += `📱 <b>Telefon:</b> <code>${assignedAdmin.phone}</code>`;
        }

        const keyboard = {
            inline_keyboard: [
                [{ text: '👤 Adminga yozish', url: adminLink }],
                [{ text: '⬅️ Ortga qaytish', callback_data: 'back_to_start' }]
            ]
        };

        await safeEditOrReply(ctx, msgText, keyboard);

    } catch (error) {
        console.log('Xatolik (category):', error.message);
        await ctx.reply("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
});

// Matn kelganda bosqichma-bosqich qabul qilish
bot.on('text', async (ctx, next) => {
    // ✅ TUZATISH #7: agar bu foydalanuvchida faol "session bosqichi" bo'lmasa
    // (masalan u /addadmin kabi buyruq yuborgan bo'lsa), next() chaqirilishi SHART —
    // aks holda pastdagi bot.command(...) handlerlari HECH QACHON ishga tushmaydi,
    // chunki Telegraf middleware zanjiri shu yerda to'xtab qolardi.
    if (!ctx.session || !ctx.session.step) return next();

    const text = ctx.message.text ? ctx.message.text.trim() : '';
    const userId = ctx.from.id;
    const userFirstName = ctx.from.first_name || 'Foydalanuvchi';
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Username yo\'q';

    try {
        await ctx.deleteMessage().catch(() => {});
    } catch (e) {}

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
        if (!edited) {
            const sentMsg = await ctx.reply(messageText, extra);
            ctx.session.lastMessageId = sentMsg.message_id;
        }
    };

    // ==========================================
    // ✍️ FIKR-MULOHAZANI QABUL QILISH
    // ==========================================
    if (ctx.session.step === 'waiting_for_feedback') {
        if (text.length < 3) return;

        try {
            const admins = await Admin.find({});
            const allAdminIds = [SUPER_ADMIN_ID, ...admins.map(a => Number(a.telegramId))];

            const adminMessage =
                `💬 <b>YANGI FIKR-MULOHAZA / TAKLIF!</b>\n` +
                `────────────────────────\n` +
                `👤 <b>Foydalanuvchi:</b> ${userFirstName} (${username})\n` +
                `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
                `────────────────────────\n` +
                `✍️ <b>Xabar:</b>\n${text}\n` +
                `────────────────────────`;

            for (const adminId of allAdminIds) {
                try {
                    await bot.telegram.sendMessage(adminId, adminMessage, { parse_mode: 'HTML' });
                } catch (err) {}
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
    // SANA UCHUN ISMNI KUTISH
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
    // SANANI KUTISH VA SAQLASH
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
                        inline_keyboard: [[{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]]
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
// Namunaviy videolar bazasi
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
};

// 📂 "Namunaviy videolar" tugmasi bosilganda
bot.action('samples', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const msgText = `📂 <b>Namunaviy videolar bo'limi</b>\n────────────────────────\n👇 <i>Qaysi yo'nalishdagi videolarni ko'rmoqchisiz?</i>`;
        const keyboard = {
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
                [{ text: '⬅️ Ortga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, msgText, keyboard);
    } catch (error) {
        console.log('Xatolik (samples):', error.message);
    }
});

bot.action('sample_Boshqa', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const msgText = `⚡ <b>Barcha boshqa yo'nalishdagi namunaviy videolar</b>\n────────────────────────\n💬 <i>Opamga, ustozimizga va boshqa barcha turdagi tayyor tabrik videolarini bizning maxsus kanalimizda ko'rishingiz mumkin!</i>\n\n👇 Quyidagi tugmani bosing va barcha videolardan bahramand bo'ling:`;
        const keyboard = {
            inline_keyboard: [
                [{ text: '🎬 Barcha videolarni ko\'rish', url: 'https://t.me/Dil_izhorim_M' }],
                [{ text: '⬅️ Videolar bo\'limiga qaytish', callback_data: 'samples' }],
                [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, msgText, keyboard);
    } catch (error) {
        console.log('Xatolik (sample Boshqa):', error.message);
    }
});

bot.action(/^sample_/, async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const sampleKey = ctx.match.input.replace('sample_', '');
        const sampleData = sampleVideos[sampleKey];

        if (sampleData) {
            try { await ctx.deleteMessage(); } catch (e) {}

            await ctx.replyWithVideo(sampleData.videoUrl, {
                caption: sampleData.caption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⬅️ Videolar bo\'limiga qaytish', callback_data: 'samples' }],
                        [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
                    ]
                }
            });
        } else {
            await ctx.answerCbQuery("⚠️ Hozircha bu yo'nalishda video mavjud emas.", { show_alert: true });
        }
    } catch (error) {
        console.log('Xatolik (sample video):', error.message);
    }
});

// ==========================================
// QO'SHIMCHA BO'LIMLAR (Chegirma, Sanalar, Aloqa)
// ==========================================
bot.action('discounts', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const msgText = `🎁 <b>AKSIYALAR VA MAXSUS BONUSLAR</b>\n\n` +
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
            `Buyurtmangizni hoziroq rasmiylashtiring va <b>“Dil izhorim by Munira”</b>ning maxsus chegirma va bonuslariga ega bo‘ling! 💌`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '🎁 Hozir buyurtma berish', callback_data: 'make_order' }],
                [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, msgText, keyboard);
    } catch (error) {
        console.log('Xatolik (discounts):', error.message);
    }
});

// 📅 "Muhim sanalar" menyusi
bot.action('birthdays_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const msgText = `📅 <b>YAQINLARINGIZNING MUHIM SANALARINI UNUTMANG!</b>\n\n` +
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
            `🔔 <i>Biz esa muhim sana yaqinlashganda sizga eslatma yuboramiz.</i>`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '➕ Sanani qo\'shish', callback_data: 'add_birthday_start' }],
                [{ text: '📋 Saqlangan sanalarim', callback_data: 'view_my_birthdays' }],
                [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, msgText, keyboard);
    } catch (error) {
        console.log('Xatolik (birthdays_menu):', error.message);
    }
});

bot.action('add_birthday_start', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = { step: 'waiting_for_bday_name' };
        await safeEditOrReply(ctx,
            `✍️ <b>1-Qadam:</b> Bu sana kimga tegishli?\n────────────────────────\n<i>(Masalan: Onamga, Dadamga, Turmush o'rtog'imga va hokazo)</i>`,
            { inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'birthdays_menu' }]] }
        );
    } catch (error) {
        console.log('Xatolik (add_birthday_start):', error.message);
    }
});

bot.action('view_my_birthdays', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const myBirthdays = await Birthday.find({ userId: ctx.from.id });

        if (!myBirthdays || myBirthdays.length === 0) {
            return await ctx.answerCbQuery('⚠️ Siz hali hech qanday sana saqlamadingiz.', { show_alert: true });
        }

        let msg = `📋 <b>Siz saqlagan muhim sanalar:</b>\n\n`;
        const months = ['', 'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

        myBirthdays.forEach((bday, index) => {
            msg += `${index + 1}. <b>${bday.recipientName}</b>: ${bday.day}-${months[bday.month]}\n`;
        });

        await safeEditOrReply(ctx, msg, { inline_keyboard: [[{ text: '⬅️ Ortga qaytish', callback_data: 'birthdays_menu' }]] });
    } catch (error) {
        console.log('Xatolik (view_my_birthdays):', error.message);
    }
});

// Har kuni soat 09:00 da ishlaydi va ertangi kun uchun eslatma yuboradi
cron.schedule('0 9 * * *', async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tDay = tomorrow.getDate();
        const tMonth = tomorrow.getMonth() + 1;

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

bot.action('contact_admin', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        const msgText = `📞 <b>BIZ BILAN BOG'LANISH</b>\n\n` +
            `Savollaringiz bormi yoki buyurtma bo'yicha murojaat qilmoqchimisiz? Biz har doim aloqadamiz! 👇\n\n` +
            `👤 <b>Admin:</b> <a href="https://t.me/Elnurovna_777">@Elnurovna_777</a>\n` +
            `📱 <b>Telefon raqam:</b> <code>+998 87 951 03 97</code>\n` +
            `⏰ <b>Ish vaqti:</b> 24/7 dam olish kunisiz\n\n` +
            `💬 <i>Murojaatingizni yozib qoldirishingiz mumkin, admin tez orada javob beradi!</i>`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '✍️ Adminga yozish', url: 'https://t.me/Elnurovna_777' }],
                [{ text: '🏠 Bosh sahifaga qaytish', callback_data: 'back_to_start' }]
            ]
        };
        await safeEditOrReply(ctx, msgText, keyboard);
    } catch (error) {
        console.log('Xatolik (contact_admin):', error.message);
    }
});

bot.action('feedback_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => {});
        ctx.session = {
            step: 'waiting_for_feedback',
            lastMessageId: ctx.callbackQuery.message.message_id
        };
        await safeEditOrReply(ctx,
            `✍️ <b>FIKR-MULOHAZA</b>\n\nXizmatlarimiz haqida fikr yoki taklifingizni yozib yuboring:`,
            { inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'back_to_start' }]] }
        );
    } catch (error) {
        console.log('Xatolik (feedback_menu):', error.message);
    }
});

// ==========================================
// 👑 ADMINLARNI BOSHQARISH BUYRUQLARI
// ==========================================

// 1. Yangi admin qo'shish: /addadmin 12345678 Ism Familiya
// ✅ TUZATISH #5: SUPER_ADMIN_ID konstantasidan foydalanamiz (qattiq kodlangan son emas),
// ism bir necha so'zdan iborat bo'lsa ham to'liq olinadi, va eng muhimi — xatolik
// yuz berganda HAQIQIY sababni ko'rsatamiz (ilgari bu yashiringan edi)
bot.command('addadmin', async (ctx) => {
  if (ctx.from.id !== SUPER_ADMIN_ID) return;

  const args = ctx.message.text.split(' ');
  const newAdminId = Number(args[1]);
  const adminName = args.slice(2).join(' ') || 'Admin';

  if (!newAdminId || isNaN(newAdminId)) {
    return ctx.reply("❌ Xatolik! ID va ismni kiriting.\nMasalan: `/addadmin 12345678 Alisher`", { parse_mode: 'Markdown' });
  }

  try {
    await Admin.create({
      telegramId: newAdminId,
      fullName: adminName,
      phone: "Kiritilmagan",
      isActive: true
    });
    ctx.reply(`✅ Yangi admin (ID: ${newAdminId}, Ism: ${adminName}) muvaffaqiyatli qo'shildi!`);
  } catch (err) {
    console.error('❌ Admin qo\'shishda xatolik:', err);
    if (err.code === 11000) {
      ctx.reply("⚠️ Bu ID allaqachon adminlar ro'yxatida bor.");
    } else {
      ctx.reply(`⚠️ Xatolik yuz berdi: ${err.message}`);
    }
  }
});

// 2. Admin o'chirish: /deladmin 12345678
bot.command('deladmin', async (ctx) => {
  if (ctx.from.id !== SUPER_ADMIN_ID) return;

  const args = ctx.message.text.split(' ');
  const adminId = Number(args[1]);

  if (!adminId || isNaN(adminId)) {
    return ctx.reply("❌ Xatolik! O'chiriladigan admin ID sini kiriting.\nMasalan: `/deladmin 12345678`", { parse_mode: 'Markdown' });
  }

  try {
    const result = await Admin.deleteOne({ telegramId: adminId });
    if (result.deletedCount > 0) {
      ctx.reply(`❌ Admin (ID: ${adminId}) bazadan o'chirildi!`);
    } else {
      ctx.reply(`⚠️ Bunday ID raqamdagi admin bazadan topilmadi.`);
    }
  } catch (err) {
    console.error('❌ Admin o\'chirishda xatolik:', err);
    ctx.reply(`⚠️ Xatolik yuz berdi: ${err.message}`);
  }
});

// 3. ✅ YANGI: Adminlar ro'yxatini ko'rish — /addadmin ishlayotganini tekshirish
// va navbat (activeOrdersCount) qanday taqsimlanayotganini ko'rish uchun
bot.command('adminlar', async (ctx) => {
  if (ctx.from.id !== SUPER_ADMIN_ID) return;
  try {
    const admins = await Admin.find({}).sort({ activeOrdersCount: 1, _id: 1 });
    if (!admins.length) {
      return ctx.reply("⚠️ Hozircha bazada birorta ham yordamchi admin yo'q.\nQo'shish uchun: /addadmin <telegram_id> <ism>");
    }
    let msg = `👥 <b>Adminlar ro'yxati (${admins.length} ta):</b>\n\n`;
    admins.forEach((a, i) => {
      msg += `${i + 1}. <b>${a.fullName}</b> — <code>${a.telegramId}</code>\n`;
      msg += `   📱 ${a.phone} | 📦 Buyurtmalar: ${a.activeOrdersCount || 0} | ${a.isActive ? '✅ Faol' : '❌ Faol emas'}\n\n`;
    });
    ctx.reply(msg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('❌ Adminlarni olishda xatolik:', err);
    ctx.reply(`⚠️ Xatolik: ${err.message}`);
  }
});

// ==========================================
// ✅ TUZATISH #6: Telegraf global xatolik ushlagichi — bironta ham kutilmagan
// xato butun botni "yiqitmasligi" uchun, va server logida aniq ko'rinishi uchun
// ==========================================
bot.catch((err, ctx) => {
  console.error(`❌ Botda kutilmagan xatolik (update turi: ${ctx.updateType}):`, err);
});

// Botni ishga tushirish
bot.launch()
    .then(() => console.log('🤖 Bot muvaffaqiyatli ishga tushdi!'))
    .catch((err) => {
        console.error('❌ Botni ishga tushirishda xatolik:', err);
        if (err.response && err.response.error_code === 409) {
            console.error('⚠️ 409 Conflict: Ehtimol shu tokenni ishlatuvchi ESKI bot jarayoni serverda hali ham ishlab turibdi. `pm2 list` bilan tekshirib, eskisini to\'liq o\'chiring.');
        } else if (err.response && err.response.error_code === 401) {
            console.error('⚠️ 401 Unauthorized: BOT_TOKEN noto\'g\'ri yoki .env fayldan to\'g\'ri o\'qilmayapti.');
        }
    });

// Dastur to'xtaganda bazani yopish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));