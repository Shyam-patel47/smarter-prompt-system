import mongoose from 'mongoose';

let mongoServer: any = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    if (!uri || uri === 'your_mongodb_atlas_connection_string') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: MONGODB_URI is strictly required in production!');
      }
      console.log('No MONGODB_URI provided, starting in-memory MongoDB for testing...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
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
