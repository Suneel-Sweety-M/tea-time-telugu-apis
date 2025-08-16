import express from "express";
import authRoute from "./authRoutes.js";
import galleryRoute from "./galleryRoutes.js";
import newsRoute from "./newsRoutes.js";
import userRoute from "./userRoutes.js";
import dashboardRoute from "./dashboardRoutes.js";
import commentsRoute from "./commentsRoutes.js";
import videoRoute from "./videoRoutes.js";
import speechRoute from "./speechRoutes.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/gallery", galleryRoute);
router.use("/news", newsRoute);
router.use("/user", userRoute);
router.use("/dashboard", dashboardRoute);
router.use("/comments", commentsRoute);
router.use("/videos", videoRoute);
router.use("/speech", speechRoute);

export default router;