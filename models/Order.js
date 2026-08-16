const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    recipientType: { type: String, required: true },
    clientPhone: { type: String, required: true },
    assignedAdmin: { type: Number }, // Buyurtma tushgan adminning Telegram ID si
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);