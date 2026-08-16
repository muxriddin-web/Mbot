require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const Admin = require('./models/Admin'); // Admin modelini ulash

const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB-ga ulanish
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB muvaffaqiyatli ulandi'))
  .catch(err => console.error('❌ MongoDB ulanishida xatolik:', err));

// ==================== YORDAMCHI FUNKSIYA (ADMINLARGA XABAR YUBORISH) ====================

async function notifyAllAdmins(messageText) {
  try {
    // Bazadagi faol (isActive: true) adminlarni olish
    const dbAdmins = await Admin.find({ isActive: true });
    const adminIds = dbAdmins.map(a => a.telegramId);

    // .env faylidagi Super Admin ID-sini ham qo'shish
    if (process.env.SUPER_ADMIN_ID) {
      adminIds.push(Number(process.env.SUPER_ADMIN_ID));
    }

    // Takrorlanmas ID-lar ro'yxati
    const uniqueAdmins = [...new Set(adminIds)];

    // Barcha adminlarga ketma-ket xabar yuborish
    for (const id of uniqueAdmins) {
      try {
        await bot.telegram.sendMessage(id, messageText, { parse_mode: 'HTML' });
      } catch (err) {
        console.log(`Adminga (${id}) xabar yuborishda xatolik:`, err.message);
      }
    }
  } catch (error) {
    console.error('notifyAllAdmins xatosi:', error.message);
  }
}

// ==================== ADMINLARNI BOSHQARISH BUYRUQLARI ====================

// Admin qo'shish: /addadmin 12345678 Alisher
bot.command('addadmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const newAdminId = Number(args[1]);
  const fullName = args.slice(2).join(' ') || 'Admin';

  if (!newAdminId) {
    return ctx.reply("❌ Xatolik! ID kiriting.\nMasalan: /addadmin 12345678 Alisher");
  }

  try {
    await Admin.create({
      telegramId: newAdminId,
      fullName: fullName,
      phone: 'Kiritilmagan',
      isActive: true
    });
    ctx.reply(`✅ Yangi admin (<b>${fullName}</b>) muvaffaqiyatli qo'shildi!`, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply("⚠️ Bu ID allaqachon adminlar ro'yxatida bor yoki xatolik yuz berdi.");
  }
});

// Adminni faolsizlantirish: /deladmin 12345678
bot.command('deladmin', async (ctx) => {
  if (ctx.from.id !== Number(process.env.SUPER_ADMIN_ID)) return;

  const args = ctx.message.text.split(' ');
  const adminId = Number(args[1]);

  if (!adminId) return ctx.reply("❌ ID kiriting.\nMasalan: /deladmin 12345678");

  try {
    await Admin.updateOne({ telegramId: adminId }, { isActive: false });
    ctx.reply(`❌ Admin (ID: <code>${adminId}</code>) faolsizlantirildi!`, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply("⚠️ Xatolik yuz berdi.");
  }
});

// ==================== BUYURTMA HODISASI (ORDER EVENT) ====================

// Buyurtma tasdiqlanganda / yuborilganda ishlaydigan qism
bot.action('confirm_order', async (ctx) => {
  await ctx.answerCbQuery();

  const user = ctx.from;
  const userName = user.first_name || 'Mijoz';
  const userUsername = user.username ? `@${user.username}` : 'Mavjud emas';

  // 1. Adminlar uchun tayyorlanadigan bildirishnoma matni
  const orderNotification = `
🛍 <b>YANGI BUYURTMA KELDI!</b>

👤 <b>Mijoz:</b> ${userName}
🔗 <b>Username:</b> ${userUsername}
🆔 <b>Telegram ID:</b> <code>${user.id}</code>
⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

📝 <i>Iltimos, mijoz bilan tezroq bog'laning!</i>
  `;

  // 2. Bazadagi barcha faol adminlarga xabarni yuborish
  await notifyAllAdmins(orderNotification);

  // 3. Mijozning o'ziga tasdiq xabarini ko'rsatish
  await ctx.reply("✅ Buyurtmangiz qabul qilindi! Tez orada operatorlarimiz siz bilan bog'lanishadi.");
});

// ==================== BOTNI ISHGA TUSHIRISH ====================

bot.launch().then(() => console.log('🚀 Bot muvaffaqiyatli ishga tushdi!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));