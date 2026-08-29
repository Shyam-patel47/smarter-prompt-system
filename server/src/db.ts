import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    if (!uri || uri === 'your_mongodb_atlas_connection_string') {
      console.log('No MONGODB_URI provided, starting in-memory MongoDB for testing...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    
    await mongoose.connect(uri);
    console.log(`MongoDB connected successfully to ${mongoServer ? 'In-Memory DB' : 'Atlas'}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
