import mongoose from "mongoose";
import "@/models/registerAll";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI ortam değişkeni tanımlı değil (.env.local içine ekleyin)");
    }
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
