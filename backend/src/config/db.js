import mongoose from 'mongoose'
import {ApiError} from '../utils/ApiError.js';

const DB_NAME = "ecommerce";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch {
        console.error('MONGODB connection error: ', error);
        // Throw a more specific error or exit the process
        throw new ApiError(500, 'Database connection failed', [error.message]);
    }
}

export default connectDB;