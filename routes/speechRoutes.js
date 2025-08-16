import express from "express";
import { textToAudio } from "../controllers/speechController.js";
const router = express.Router();

router.post("/text-to-speech", textToAudio);

export default router;
