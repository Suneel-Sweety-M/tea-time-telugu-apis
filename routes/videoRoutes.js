import express from "express";
import userAuth from "../middlewares/verifyUser.js";
import { addVideo, deleteVideo, getAllVideos, getCategoryVideos, getVideo } from "../controllers/videosController.js";

const router = express.Router();

router.get("/", getAllVideos);
router.get("/all", getCategoryVideos);
router.get("/:videoId", getVideo);

router.post("/add-video", userAuth, addVideo);

router.delete("/delete/:videoId", userAuth, deleteVideo);

export default router;
