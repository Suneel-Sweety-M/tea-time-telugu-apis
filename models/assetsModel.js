import mongoose, { Schema } from "mongoose";

const assetsSchema = new mongoose.Schema(
  {
    gallery: {
      type: Schema.Types.ObjectId,
      ref: "Gallery",
    },
    andhra: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    telangana: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    movies: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    gossips: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    latestStories: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    trailers: [
      {
        type: Schema.Types.ObjectId,
        ref: "News",
      },
    ],
    trends: [
      {
        news: {
          type: Schema.Types.ObjectId,
          ref: "News",
        },
        position: Number, // 1 to 5
      },
    ],
    topFiveGrid: [
      {
        news: {
          type: Schema.Types.ObjectId,
          ref: "News",
        },
        position: Number, // 1 to 5
      },
    ],

    hotTopics: [
      {
        news: {
          type: Schema.Types.ObjectId,
          ref: "News",
        },
        position: Number, // 1 to 5
      },
    ],
    topNine: [
      {
        news: {
          type: Schema.Types.ObjectId,
          ref: "News",
        },
        position: Number, // 1–9
      },
    ],

    filesLinks: [
      {
        type: String,
      },
    ],
    movieReleases: {
      type: Array,
    },
    posters: {
      popupPoster: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
      },
      moviePoster: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
      },
      navbarAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
      },
    },
    ads: {
      homeLongAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      homeShortAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      categoryLongAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      categoryShortAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      newsLongAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      newsShortAd: {
        img: {
          type: String,
          default: "",
        },
        link: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    },
    movieCollections: {
      type: Array,
    },
  },
  { timestamps: true, default: 0 }
);

const Assets = mongoose.model("Assets", assetsSchema);

export default Assets;
