import mongoose, { Mongoose } from "mongoose";

const VideoJobSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "succeeded", "failed"],
      default: "queued",
    },
    provider: { type: String, default: "replicate" },
    providerJobId: { type: String },
    outputUrl: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("VideoJob",VideoJobSchema);