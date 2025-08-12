import express from "express";
import userAuth from "../middlewares/verifyUser.js";
import { addComment, addGalleryReaction, addReaction, addReplyComment, deleteComment, dislikeComment, getComments, getNewsComments, likeComment } from "../controllers/commentController.js";

const router = express.Router();

router.get("/:newsId", getComments);
router.get("/:newsId/news-comments", getNewsComments);

router.post("/:newsId/add-reaction", userAuth, addReaction);
router.post("/:galleryId/add-gallery-reaction", userAuth, addGalleryReaction);
router.post("/:newsId/add-comment", userAuth, addComment);
router.post("/:newsId/add-reply-comment", userAuth, addReplyComment);

router.post("/:commentId/like-comment", userAuth, likeComment);
router.post("/:commentId/dislike-comment", userAuth, dislikeComment);

router.delete("/:commentId", userAuth, deleteComment);

export default router;
