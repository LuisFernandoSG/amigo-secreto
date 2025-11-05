import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secret-santa';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
