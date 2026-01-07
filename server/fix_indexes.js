const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Drop the shipments collection to clear old indexes
        try {
            await mongoose.connection.db.dropCollection('shipments');
            console.log('Shipments collection dropped to clear old indexes.');
        } catch (err) {
            console.log('Shipments collection might not exist, skipping drop.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
