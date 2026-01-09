const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get Admin Analytics Dashboard Data
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
router.get('/dashboard', protect, async (req, res) => {
    // Check for admin role
    if (req.user.role !== 'admin') {
        res.status(401);
        return res.json({ message: 'Not authorized as admin' });
    }

    try {
        console.log('Fetching analytics data...');
        // 1. Shipment Status Distribution
        const statusDistribution = await Shipment.aggregate([
            {
                $group: {
                    _id: '$currentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Status Distribution:', statusDistribution);

        // 2. Revenue (Total Cost)
        const totalRevenue = await Shipment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$cost' }
                }
            }
        ]);

        // 3. Driver Performance (Delivered Shipments per Driver)
        const driverPerformance = await Shipment.aggregate([
            { $match: { currentStatus: 'Delivered', driver: { $ne: null } } },
            {
                $group: {
                    _id: '$driver',
                    deliveries: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'driverInfo'
                }
            },
            { $unwind: '$driverInfo' },
            {
                $project: {
                    driverName: '$driverInfo.name',
                    deliveries: 1
                }
            }
        ]);

        // 4. Monthly Shipments Trend (Last 12 Months? Or just simplified grouping by month)
        // Group by Month of Creation
        const monthlyTrend = await Shipment.aggregate([
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                    cost: { $sum: '$cost' }
                }
            },
            { $sort: { _id: 1 } } // Sort by month
        ]);

        // 5. Avg Delivery Time (Only for Delivered Items)
        // Note: we need 'Delivered' timestamp. accessing statusHistory array
        // This is complex. For dashboard V1, we might skip this or use a simplified approximation using createdAt and updatedAt of 'Delivered' items.
        // Let's rely on updatedAt for Delivered items for now.
        const avgDeliveryTime = await Shipment.aggregate([
            { $match: { currentStatus: 'Delivered' } },
            {
                $group: {
                    _id: null,
                    avgTimeMilliseconds: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
                }
            }
        ]);

        res.json({
            statusDistribution,
            totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
            driverPerformance,
            monthlyTrend,
            avgDeliveryTime: avgDeliveryTime[0] ? avgDeliveryTime[0].avgTimeMilliseconds : 0
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Analytics Error' });
    }
});

module.exports = router;
