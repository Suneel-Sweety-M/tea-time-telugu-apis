import mongoose, { Schema } from "mongoose";

//schema
const newsSchema = new mongoose.Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    title: {
      type: String,
      required: [true, "First Name is Required!"],
    },
    newsId: {
      type: String,
      unique: true,
      index: true,
    },
    mainUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
    },
    movieRating: {
      type: Number,
      default: 0,
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        type: { type: String, required: true },
      },
    ],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comments" }],
    tags: {
      type: Array,
    },
  },
  { timestamps: true, default: 0 }
);

const News = mongoose.model("News", newsSchema);

export default News;
