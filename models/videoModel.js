import mongoose, { Schema } from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    title: {
      type: String,
      required: [true, "First Name is Required!"],
    },
    mainUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      default: "videos",
    },
    subCategory: {
      type: String,
    },
    tags: {
      type: Array,
    },
  },
  { timestamps: true, default: 0 }
);

const Videos = mongoose.model("Videos", videoSchema);

export default Videos;
