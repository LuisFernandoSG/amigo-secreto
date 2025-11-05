import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';

export const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error conectando a MongoDB', error);
    throw error;
  }
};