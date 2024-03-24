import mongoose, { connect, mongo } from "mongoose";
import { DB_NAME } from "./constants";

const connectDB = async () => {
  try {
    const connectionDB = await mongoose.connect(
      `${process.env.MONGODB_URI} / ${DB_NAME}`
    );
    console.log(`\n MongoDB Connected !! DB Host: ${connectionDB}`);
  } catch (error) {
    console.log("MongoDB Connection Error", error);
    process.exit(1);
  }
};
