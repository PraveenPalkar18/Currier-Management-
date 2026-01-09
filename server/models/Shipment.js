const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true,
    },
    packageName: {
        type: String,
        required: true,
    },
    sender: {
        name: String,
        address: String,
        phone: String,
    },
    receiver: {
        name: String,
        address: String,
        phone: String,
    },
    currentStatus: {
        type: String,
        enum: ['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    cost: { type: Number, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    statusHistory: [{
        status: String,
        location: String,
        date: { type: Date, default: Date.now }
    }],
    currentLocation: {
        lat: Number,
        lng: Number,
        updatedAt: { type: Date }
    },
    proofOfDelivery: {
        signature: String, // Base64 or URL
        photo: String,     // URL to uploaded file
        timestamp: { type: Date }
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Shipment', shipmentSchema);
