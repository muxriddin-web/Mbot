const mongoose = require('mongoose');

// Faqat eslatmalar uchun alohida bazaga ulanish
const birthdayConnection = mongoose.createConnection(
    process.env.MONGO_BIRTHDAYS_URI || process.env.MONGO_URI
);

birthdayConnection.on('connected', () => {
    console.log('📅 Tug\'ilgan kunlar bazasiga alohida ulandi!');
});

const birthdaySchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    recipientName: { type: String, required: true },
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = birthdayConnection.model('Birthday', birthdaySchema);