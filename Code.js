const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    usedBy: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Code', CodeSchema);
