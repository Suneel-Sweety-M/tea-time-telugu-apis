import mongoose, { Schema } from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    mainUrl: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    galleryPics: {
      type: Array,
    },
    tags: {
      type: Array,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comments",
      },
    ],
  },
  { timestamps: true, default: 0 }
);

const Gallery = mongoose.model("Gallery", gallerySchema);

export default Gallery;
