import express from "express";
import multer from "multer";
import userAuth from "../middlewares/verifyUser.js";
import {
  addNews,
  deleteNews,
  editNews,
  filterNews,
  getCategoryNews,
  getFilteredNews,
  getNews,
  getNewsById,
  getNewsByNewsId,
  getSearchedNews,
} from "../controllers/newsController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getFilteredNews); 
router.get("/search", getSearchedNews); 
router.get("/filtered", filterNews);
router.get("/category", getCategoryNews);
router.get("/:postId", getNewsById);
router.get("/n/:newsId", getNewsByNewsId);

router.post("/add-news", userAuth, upload.single("mainFile"), addNews);
router.post("/:id/edit-news", userAuth, editNews);
router.post("/:id/delete-news", userAuth, deleteNews);

export default router;
