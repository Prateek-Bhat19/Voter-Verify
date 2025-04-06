const mongoose = require('mongoose');

// Check if model already exists
const DigitalToken = mongoose.models.DigitalToken || mongoose.model('DigitalToken', new mongoose.Schema({
    voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    qrCode: {
        type: String,
        required: true
    },
    pdfData: {
        type: String,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    verifiedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'used', 'expired', 'revoked'],
        default: 'active'
    }
}, {
    timestamps: true
}));

// Add indexes if they don't exist
if (!DigitalToken.schema.indexes().length) {
    DigitalToken.schema.index({ voterId: 1 });
    DigitalToken.schema.index({ status: 1 });
}

// Add methods if they don't exist
if (!DigitalToken.prototype.verify) {
    DigitalToken.prototype.verify = async function() {
        this.verifiedAt = new Date();
        this.status = 'used';
        return await this.save();
    };
}

if (!DigitalToken.prototype.revoke) {
    DigitalToken.prototype.revoke = async function() {
        this.status = 'revoked';
        return await this.save();
    };
}

if (!DigitalToken.prototype.isValid) {
    DigitalToken.prototype.isValid = function() {
        return this.status === 'active';
    };
}

module.exports = DigitalToken; 