import express from "express";
import multer from "multer";
import {
  addGallery,
  deleteGallery,
  editGallery,
  getGallery,
  getGalleryById,
  getGalleryByQuery,
} from "../controllers/galleryController.js";
import userAuth from "../middlewares/verifyUser.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getGallery);
router.get("/search", getGalleryByQuery);
router.get("/:postId", getGalleryById);

router.put("/:id/edit", userAuth, editGallery);

router.delete("/:id/delete", userAuth, deleteGallery);

router.post("/add-gallery", userAuth, upload.array("mediaFiles"), addGallery);

export default router;
