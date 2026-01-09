const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private
router.post('/', protect, async (req, res) => {
    const { trackingId, packageName, sender, receiver, from, to, cost } = req.body;

    console.log('Creating shipment for user:', req.user.id);

    try {
        const createdShipment = await Shipment.create({
            user: req.user.id,
            trackingId,
            packageName,
            sender,
            receiver,
            from,
            to,
            cost,
            statusHistory: [{ status: 'Pending', location: from }],
        });

        console.log('Shipment created successfully:', createdShipment._id);
        res.status(200).json(createdShipment);
    } catch (error) {
        console.error('Shipment creation failed:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Accept shipment (Driver)
// @route   PUT /api/shipments/:id/accept
// @access  Private (Driver)
// @desc    Accept shipment (Driver)
// @route   PUT /api/shipments/:id/accept
// @access  Private (Driver)
router.put('/:id/accept', protect, async (req, res) => {
    // Atomic update to prevent race conditions
    const shipment = await Shipment.findOneAndUpdate(
        { _id: req.params.id, driver: null }, // Only find if driver is null
        {
            driver: req.user.id,
            currentStatus: 'In Transit',
            $push: { statusHistory: { status: 'In Transit/Accepted', location: 'Driver Location' } }
        },
        { new: true }
    );

    if (shipment) {
        // Notification Logic
        const io = req.app.get('io');
        if (io) {
            io.to(shipment.user.toString()).emit('shipment_updated', {
                type: 'info',
                message: `Your shipment ${shipment.trackingId} has been accepted by a driver!`,
                shipment
            });
        }

        res.json(shipment);
    } else {
        // Find again to check if it was just taken
        const existingShipment = await Shipment.findById(req.params.id);
        if (existingShipment && existingShipment.driver) {
            res.status(400);
            return res.json({ message: 'Shipment already assigned to another driver' });
        }
        res.status(404);
        res.json({ message: 'Shipment not found' });
    }
});

// @desc    Update shipment status
// @route   PUT /api/shipments/:id/status
// @access  Private (Driver/Admin)
router.put('/:id/status', protect, async (req, res) => {
    const { status, location } = req.body;
    const shipment = await Shipment.findById(req.params.id);

    if (shipment) {
        shipment.currentStatus = status;
        shipment.statusHistory.push({ status, location });

        await shipment.save();

        // Notification Logic
        const io = req.app.get('io');
        if (io) {
            io.to(shipment.user.toString()).emit('shipment_updated', {
                type: 'success',
                message: `Shipment ${shipment.trackingId} is now ${status}`,
                shipment
            });
        }

        res.json(shipment);
    } else {
        res.status(404);
        res.json({ message: 'Shipment not found' });
    }
});

// @desc    Get user shipments
// @route   GET /api/shipments
// @access  Private
router.get('/', protect, async (req, res) => {
    console.log('Fetching shipments for user:', req.user.id);
    const shipments = await Shipment.find({ user: req.user.id });
    console.log('Found shipments:', shipments.length);
    res.status(200).json(shipments);
});

// @desc    Get Available & Assigned Shipments (Driver View)
// @route   GET /api/shipments/driver
// @access  Private (Driver)
router.get('/driver', protect, async (req, res) => {
    const shipments = await Shipment.find({
        $or: [
            { driver: null },
            { driver: req.user.id }
        ]
    });
    res.status(200).json(shipments);
});

// @desc    Get all shipments (Admin)
// @route   GET /api/shipments/all
// @access  Private
router.get('/all', protect, async (req, res) => {
    const shipments = await Shipment.find({});
    res.status(200).json(shipments);
});

// @desc    Get shipment by ID
// @route   GET /api/shipments/:id
// @access  Public (for tracking)
router.get('/:id', async (req, res) => {
    let shipment = await Shipment.findOne({ trackingId: req.params.id });

    if (!shipment) {
        try {
            shipment = await Shipment.findById(req.params.id);
        } catch (e) { /* ignore */ }
    }

    if (!shipment) {
        res.status(404);
        return res.json({ message: 'Shipment not found' });
    }

    res.status(200).json(shipment);
});

// Multer setup for file uploads
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/proofs/'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// @desc    Complete Delivery with POD
// @route   POST /api/shipments/:id/deliver
// @access  Private (Driver)
router.post('/:id/deliver', protect, upload.single('photo'), async (req, res) => {
    const { signature } = req.body;
    const shipment = await Shipment.findById(req.params.id);

    if (shipment) {
        if (shipment.driver.toString() !== req.user.id) {
            res.status(401);
            return res.json({ message: 'Not authorized' });
        }

        shipment.currentStatus = 'Delivered';
        shipment.proofOfDelivery = {
            signature: signature, // Base64 string
            photo: req.file ? `/uploads/proofs/${req.file.filename}` : null,
            timestamp: Date.now()
        };
        shipment.statusHistory.push({ status: 'Delivered', location: 'Destination' });

        await shipment.save();

        // Notification Logic
        const io = req.app.get('io');
        if (io) {
            io.to(shipment.user.toString()).emit('shipment_updated', {
                type: 'success',
                message: `Shipment ${shipment.trackingId} has been DELIVERED!`,
                shipment
            });
        }

        res.json(shipment);
    } else {
        res.status(404);
        res.json({ message: 'Shipment not found' });
    }
});

module.exports = router;
