import Comments from "../models/commentsModel.js";
import News from "../models/newsModel.js";
import Gallery from "../models/galleryModel.js";

export const getComments = async (req, res) => {
  try {
    const { newsId } = req.params;

    if (!newsId) {
      return res.status(400).send({
        status: "fail",
        message: "Post id not found!",
      });
    }

    const comments = await Comments.find({ newsId })
      .populate("postedBy", "fullName profileUrl")
      .populate({
        path: "replies",
        populate: {
          path: "postedBy",
          select: "fullName profileUrl",
        },
      })
      .sort({ createdAt: -1 });

    comments.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => b.createdAt - a.createdAt);
      }
    });

    return res.status(200).send({
      status: "success",
      message: "Comments fetched successfully",
      comments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const getNewsComments = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { directCommentsLimit, replyCommentsLimit, directCommentsSkip } = req.query;

    if (!newsId) {
      return res.status(400).send({
        status: "fail",
        message: "Post id not found!",
      });
    }

    const comments = await Comments.find({ newsId, parentComment: { $exists: false } })
      .skip(parseInt(directCommentsSkip) || 0)
      .limit(parseInt(directCommentsLimit) || 4)
      .populate("postedBy", "fullName profileUrl")
      .populate({
        path: "replies",
        options: {
          limit: parseInt(replyCommentsLimit) || 4,
          sort: { createdAt: -1 }
        },
        populate: {
          path: "postedBy",
          select: "fullName profileUrl",
        },
      })
      .sort({ createdAt: -1 });

    const totalCommentsCount = await Comments.countDocuments({ newsId, parentComment: { $exists: false } });

    return res.status(200).send({
      status: "success",
      message: "Comments fetched successfully",
      comments,
      totalCommentsCount
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { userId, type } = req.body;

    if (!newsId) {
      return res
        .status(404)
        .send({ status: "fail", message: "News id not found!" });
    }

    if (!type) {
      return res
        .status(404)
        .send({ status: "fail", message: "Reaction type is not found!" });
    }

    if (!userId) {
      return res
        .status(404)
        .send({ status: "fail", message: "User id not found!" });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return res
        .status(404)
        .send({ status: "fail", message: "News post not found" });
    }

    const existingReactionIndex = news.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId.toString()
    );

    if (existingReactionIndex >= 0) {
      news.reactions[existingReactionIndex].type = type;
    } else {
      news.reactions.push({ userId, type });
    }

    await news.save();

    res.status(200).send({
      status: "success",
      message: "Reaction added/updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const addGalleryReaction = async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { userId, type } = req.body;

    if (!galleryId) {
      return res
        .status(404)
        .send({ status: "fail", message: "Gallery id not found!" });
    }

    if (!type) {
      return res
        .status(404)
        .send({ status: "fail", message: "Reaction type is not found!" });
    }

    if (!userId) {
      return res
        .status(404)
        .send({ status: "fail", message: "User id not found!" });
    }

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res
        .status(404)
        .send({ status: "fail", message: "Gallery post not found" });
    }

    const existingReactionIndex = gallery.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId.toString()
    );

    if (existingReactionIndex >= 0) {
      gallery.reactions[existingReactionIndex].type = type;
    } else {
      gallery.reactions.push({ userId, type });
    }

    await gallery.save();

    res.status(200).send({
      status: "success",
      message: "Reaction added/updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { comment } = req.body;
    const { user } = req.user;

    if (!newsId) {
      return res.status(400).send({
        status: "fail",
        message: "News id not found!",
      });
    }

    if (!comment) {
      return res.status(400).send({
        status: "fail",
        message: "Write something!",
      });
    }

    const newComment = new Comments({
      newsId,
      postedBy: user?._id,
      comment,
      likes: [],
      dislikes: [],
    });

    await newComment.save();

    return res.status(201).send({
      status: "success",
      message: "Comment added successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const addReplyComment = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { parentCommentId, comment } = req.body;
    const { user } = req.user;

    if (!parentCommentId) {
      return res.status(400).send({
        status: "fail",
        message: "Post id not found!",
      });
    }

    if (!comment) {
      return res.status(400).send({
        status: "fail",
        message: "Write something!",
      });
    }

    const newReply = new Comments({
      newsId,
      parentComment: parentCommentId,
      postedBy: user?._id,
      comment,
      likes: [],
      dislikes: [],
    });

    await newReply.save();
    await Comments.findByIdAndUpdate(parentCommentId, {
      $push: { replies: newReply._id },
    });

    return res.status(201).send({
      status: "success",
      message: "Reply added successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user } = req.user;

    if (!commentId) {
      return res.status(400).send({
        status: "fail",
        message: "Comment ID is required",
      });
    }

    const comment = await Comments.findById(commentId);

    if (!comment) {
      return res.status(404).send({
        status: "fail",
        message: "Comment not found",
      });
    }

    if (JSON.stringify(comment?.postedBy?._id) !== JSON.stringify(user?._id)) {
      return res.status(404).send({
        status: "fail",
        message: "You can't delete this comment",
      });
    }

    if (comment.replies && comment.replies.length > 0) {
      await Comments.deleteMany({ _id: { $in: comment.replies } });
    }

    await Comments.findByIdAndDelete(commentId);

    return res.status(200).send({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "fail",
      message: "An error occurred while deleting the comment",
    });
  }
};

export const likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req?.user?.user?._id;

  try {
    if (!commentId) {
      return res.status(404).send({
        status: "fail",
        message: "Comment id not found",
      });
    }

    const comment = await Comments.findById(commentId);

    if (!comment) {
      return res.status(404).send({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check if the user has already liked the comment
    const hasLiked = comment.likes.includes(userId);
    const hasDisliked = comment.dislikes.includes(userId);

    if (hasLiked) {
      // If the user has liked, remove the like
      comment.likes.pull(userId);
    } else {
      // If the user has disliked, remove the dislike first
      if (hasDisliked) {
        comment.dislikes.pull(userId);
      }
      // Add the like
      comment.likes.push(userId);
    }

    await comment.save();

    return res.status(200).send({
      status: "success",
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "fail",
      message: "An error occurred while updating the comment",
    });
  }
};

export const dislikeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.user?._id;

  try {
    if (!commentId) {
      return res.status(404).send({
        status: "fail",
        message: "Comment id not found",
      });
    }

    const comment = await Comments.findById(commentId);

    if (!comment) {
      return res.status(404).send({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check if the user has already disliked the comment
    const hasDisliked = comment.dislikes.includes(userId);
    const hasLiked = comment.likes.includes(userId);

    if (hasDisliked) {
      // If the user has disliked, remove the dislike
      comment.dislikes.pull(userId);
    } else {
      // If the user has liked, remove the like first
      if (hasLiked) {
        comment.likes.pull(userId);
      }
      // Add the dislike
      comment.dislikes.push(userId);
    }

    // Save the updated comment
    await comment.save();

    return res.status(200).send({
      status: "success",
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "fail",
      message: "An error occurred while updating the comment",
    });
  }
};
