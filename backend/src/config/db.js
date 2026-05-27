import mongoose from "mongoose";

export const connectDB = async (mongoURL) => {
    if (!mongoURL) {
        console.error("MONGODB_URL is missing");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURL);
        console.log("Đã kết nối đến database thành công");
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
};