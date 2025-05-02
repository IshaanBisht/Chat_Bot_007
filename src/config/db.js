const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // No need for options in Mongoose 6+
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error("Full error object:", error); // Log full error details
        process.exit(1);
    }
};

// Event listeners for debugging
mongoose.connection.on("connecting", () => console.log("Connecting to MongoDB..."));
mongoose.connection.on("disconnected", () => console.log("Disconnected from MongoDB!"));

module.exports = connectDB;