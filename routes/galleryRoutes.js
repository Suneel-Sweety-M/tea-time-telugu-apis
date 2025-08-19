import express from "express";
import multer from "multer";
import {
  addGallery,
  deleteGallery,
  editGallery,
  getGallery,
  getGalleryById,
  getGalleryBynewsId,
  getGalleryByQuery,
  getGalleryPosts,
} from "../controllers/galleryController.js";
import userAuth from "../middlewares/verifyUser.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getGallery);
router.get("/posts", getGalleryPosts);
router.get("/search", getGalleryByQuery);
router.get("/:postId", getGalleryById);
router.get("/g/:newsId", getGalleryBynewsId);

router.put("/:id/edit", userAuth, upload.array("mediaFiles"), editGallery);

router.delete("/:id/delete", userAuth, deleteGallery);

router.post("/add-gallery", userAuth, upload.array("mediaFiles"), addGallery);

export default router;
