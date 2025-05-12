import express from "express";
import userAuth from "../middlewares/verifyUser.js";
import { addComment, addReaction, addReplyComment, deleteComment, dislikeComment, getComments, likeComment } from "../controllers/commentController.js";

const router = express.Router();

router.get("/:newsId", getComments);

router.post("/:newsId/add-reaction", userAuth, addReaction);
router.post("/:newsId/add-comment", userAuth, addComment);
router.post("/:newsId/add-reply-comment", userAuth, addReplyComment);

router.post("/:commentId/like-comment", userAuth, likeComment);
router.post("/:commentId/dislike-comment", userAuth, dislikeComment);

router.delete("/:commentId", userAuth, deleteComment);

export default router;
