const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    username: { type: String },
    isActive: { type: Boolean, default: true },
    activeOrdersCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Admin', adminSchema);