import express from "express";
import axios from "axios";
import VideoJob from "../models/VideoJob.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const replicate = axios.create({
  baseURL: "https://api.replicate.com/v1",
  headers: {
    Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// ✅ Option B: hardcode model here
const DEFAULT_MODEL = "google/imagen-4"; // <-- replace this

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: "Missing REPLICATE_API_TOKEN in .env" });
    }
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // 1) Create DB job
    const job = await VideoJob.create({
      prompt,
      status: "queued",
      provider: "replicate",
    });

    // 2) Get latest version of the DEFAULT_MODEL
    const modelInfo = await replicate.get(`/models/${DEFAULT_MODEL}`);
    const latestVersionId = modelInfo.data.latest_version?.id;

    if (!latestVersionId) {
      return res.status(500).json({ error: "Could not fetch latest version for model" });
    }

    // 3) Create prediction (generate)
    job.status = "processing";
    await job.save();

    const create = await replicate.post("/predictions", {
      version: latestVersionId,
      input: { prompt }, // some models need more fields
    });

    job.providerJobId = create.data.id;
    await job.save();

    res.json({
      jobId: job._id,
      providerJobId: job.providerJobId,
      model: DEFAULT_MODEL,
      usedVersion: latestVersionId,
    });
  } catch (err) {
    console.log("GENERATE ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: err.message,
      providerError: err.response?.data || null,
    });
  }
});

router.get("/status/:jobId", async (req, res) => {
  try {
    const job = await VideoJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (["succeeded", "failed"].includes(job.status)) return res.json(job);

    const pred = await replicate.get(`/predictions/${job.providerJobId}`);
    const pStatus = pred.data.status;

    if (pStatus === "succeeded") {
      const output = pred.data.output;
      const videoUrl = Array.isArray(output) ? output[0] : output;

      job.status = "succeeded";
      job.outputUrl = videoUrl;
      await job.save();
    } else if (pStatus === "failed" || pStatus === "canceled") {
      job.status = "failed";
      job.error = pred.data.error || "Provider failed";
      await job.save();
    } else {
      job.status = "processing";
      await job.save();
    }

    res.json(job);
  } catch (err) {
    console.log("STATUS ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
