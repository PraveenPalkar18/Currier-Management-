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
router.put('/:id/accept', protect, async (req, res) => {
    const shipment = await Shipment.findById(req.params.id);

    if (shipment) {
        if (shipment.driver) {
            res.status(400);
            return res.json({ message: 'Shipment already assigned' });
        }

        shipment.driver = req.user.id;
        shipment.currentStatus = 'In Transit';

        await shipment.save();
        res.json(shipment);
    } else {
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

module.exports = router;
