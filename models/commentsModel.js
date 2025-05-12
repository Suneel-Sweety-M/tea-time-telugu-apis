import mongoose, { Schema } from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    newsId: {
      type: String,
      required: [true, "News ID is required!"],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    comment: {
      type: String,
      required: [true, "Comment text is required!"],
    },
    parentComment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Comments" 
    },
    replies: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Comments" 
      }
    ],
    likes: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      default: []
    },
    dislikes: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      default: []
    },
  },
  { timestamps: true }
);

const Comments = mongoose.model("Comments", commentSchema);

export default Comments;
