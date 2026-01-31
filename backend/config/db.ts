import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const uri: string | undefined = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI env variable is not defined');
        }
        const conn = await mongoose.connect(uri);
        console.log(`Database connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("DB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;