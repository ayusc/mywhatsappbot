import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  session: Object
});

const SessionModel = mongoose.model('Session', sessionSchema);

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
};

export const saveSession = async (session) => {
  await SessionModel.deleteMany({});
  await SessionModel.create({ session });
};

export const getSession = async () => {
  const record = await SessionModel.findOne();
  return record?.session || null;
};
