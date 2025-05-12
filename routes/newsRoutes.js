import express from "express";
import multer from "multer";
import userAuth from "../middlewares/verifyUser.js";
import {
  addNews,
  deleteNews,
  editNews,
  filterNews,
  getFilteredNews,
  getNews,
  getNewsById,
  getSearchedNews,
} from "../controllers/newsController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getFilteredNews);
router.get("/search", getSearchedNews);
router.get("/filtered", filterNews);
router.get("/:postId", getNewsById);

router.post("/add-news", userAuth, upload.single("mainFile"), addNews);
router.post("/:id/edit-news", userAuth, editNews);
router.post("/:id/delete-news", userAuth, deleteNews);

export default router;
