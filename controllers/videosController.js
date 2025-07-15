import { generateUniqueSlug } from "../middlewares/slugGenerator.js";
import Assets from "../models/assetsModel.js";
import Users from "../models/userModel.js";
import Videos from "../models/videoModel.js";

export const addVideo = async (req, res) => {
  try {
    const { title, subCategory, ytId } = req.body;
    const { user } = req.user;

    if (!title) {
      return res.status(500).json({ status: "fail", message: "Enter title!" });
    }

    if (!ytId) {
      return res
        .status(500)
        .json({ status: "fail", message: "Enter YouTube Video ID!" });
    }

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser.role === "admin" || currentUser.role === "writer") &&
      currentUser.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to post!",
      });
    }

    // Generate unique newsId from title
    const newsId = await generateUniqueSlug(Videos, title);

    const newVideo = new Videos({
      postedBy: user?._id,
      title,
      videoUrl: `https://www.youtube.com/embed/${ytId}`,
      mainUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      subCategory,
      newsId,
    });

    await newVideo.save();

    return res.status(200).json({
      status: "success",
      message: "Video added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getCategoryVideos = async (req, res) => {
  try {
    // Fetching videos by subcategories
    const trailers = await Videos.find({
      category: "videos",
      subCategory: "trailers",
    }).sort({ createdAt: -1 });

    const latestVideos = await Videos.find({
      category: "videos",
      $or: [
        { subCategory: { $exists: false } }, // Videos without subCategory
        { subCategory: { $eq: "" } }, // Videos with empty subCategory
      ],
    }).sort({ createdAt: -1 });

    const videoSongs = await Videos.find({
      category: "videos",
      subCategory: "video songs",
    }).sort({ createdAt: -1 });

    const lyricalSongs = await Videos.find({
      category: "videos",
      subCategory: "lyrical videos",
    }).sort({ createdAt: -1 });

    const shows = await Videos.find({
      category: "videos",
      subCategory: "shows",
    }).sort({ createdAt: -1 });

    const ott = await Videos.find({
      category: "videos",
      subCategory: "ott",
    }).sort({ createdAt: -1 });

    const events = await Videos.find({
      category: "videos",
      subCategory: "events",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "All Category wise videos",
      data: {
        trailers,
        latestVideos,
        videoSongs,
        lyricalSongs,
        shows,
        ott,
        events,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};

export const getPaginatedCategoryVideos = async (req, res) => {
  try {
    let { category, subCategory, skip = 0, limit = 9 } = req.query;
    skip = Number(skip);
    limit = Number(limit);

    const filter = {};
    if (category) filter.category = category;

    // Handle subCategory
    if (subCategory) {
      if (subCategory === "latestVideos") {
        // latestVideos means no subCategory
        filter.category = "videos";
        filter.$or = [
          { subCategory: { $exists: false } },
          { subCategory: { $eq: "" } },
        ];
      } else {
        filter.subCategory = subCategory; // must match DB exactly
      }
    }

    const videos = await Videos.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Videos.countDocuments(filter);

    return res.status(200).json({
      status: "success",
      data: {
        videos,
        total,
      },
    });
  } catch (error) {
    console.error("getPaginatedCategoryVideos error:", error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};

export const getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || videoId.length !== 24) {
      return res.status(404).json({ message: "Provide a valid video ID." });
    }

    // Fetch the main video by ID
    const video = await Videos.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    // Step 1: Extract potential keywords from the title
    // Assuming keywords are capitalized words or phrases (movie or person names)
    const keywords = video.title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);

    // Ensure keywords were extracted, then create a regex pattern for matching
    const keywordPattern = keywords ? keywords.join("|") : "";

    // Step 2: Find similar posts based on keyword pattern, excluding the current video
    const similarPosts = keywordPattern
      ? await Videos.find({
          _id: { $ne: videoId }, // Exclude the current video
          title: { $regex: keywordPattern, $options: "i" }, // Match titles with any keyword
        }).limit(6)
      : [];

    // Step 3: Additional data (related, suggested, video songs) if needed
    const relatedPosts = await Videos.find({
      _id: { $ne: videoId },
      subCategory: video.subCategory,
    }).limit(6);

    const suggestedPosts = await Videos.find({
      _id: { $ne: videoId },
    })
      .sort({ createdAt: -1 })
      .limit(6);

    const videoSongs = await Videos.find({
      _id: { $ne: videoId },
      subCategory: { $in: ["video songs", "lyrical videos"] },
    }).limit(6);

    return res.status(200).json({
      status: "success",
      message: "Fetched video and related content successfully",
      data: {
        video,
        similarPosts,
        relatedPosts,
        suggestedPosts,
        videoSongs,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};

export const getVideoByNewsId = async (req, res) => {
  try {
    const { newsId } = req.params;

    if (!newsId) {
      return res.status(400).json({
        status: "fail",
        message: "newsId parameter is required",
      });
    }

    // Fetch the main video by newsId
    const video = await Videos.findOne({ newsId });

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    // Step 1: Extract potential keywords from the title
    const keywords =
      video.title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) || [];

    // Create regex pattern for matching (if keywords exist)
    const keywordPattern = keywords.length > 0 ? keywords.join("|") : null;

    // Step 2: Find similar posts based on keyword pattern
    const similarPosts = keywordPattern
      ? await Videos.find({
          newsId: { $ne: newsId }, // Exclude current video by newsId
          title: { $regex: keywordPattern, $options: "i" },
        }).limit(6)
      : [];

    // Step 3: Find related posts by subCategory
    const relatedPosts = await Videos.find({
      newsId: { $ne: newsId },
      subCategory: video.subCategory,
    }).limit(6);

    // Suggested posts (newest first)
    const suggestedPosts = await Videos.find({
      newsId: { $ne: newsId },
    })
      .sort({ createdAt: -1 })
      .limit(6);

    // Video songs content
    const videoSongs = await Videos.find({
      newsId: { $ne: newsId },
      subCategory: { $in: ["video songs", "lyrical videos"] },
    }).limit(6);

    return res.status(200).json({
      status: "success",
      message: "Video content fetched successfully",
      data: {
        video,
        similarPosts,
        relatedPosts,
        suggestedPosts,
        videoSongs,
      },
    });
  } catch (error) {
    console.error("Error in getVideoByNewsId:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching video content",
    });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await Videos.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Fetched videos successfully",
      videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { user } = req.user;

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser.role === "admin" || currentUser.role === "writer") &&
      currentUser.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to delete!",
      });
    }

    await Videos.findByIdAndDelete(videoId);

    await Assets.updateMany(
      {},
      {
        $pull: {
          andhra: videoId,
          telangana: videoId,
          movies: videoId,
          reviews: videoId,
          gossips: videoId,
          latestStories: videoId,
          trailers: videoId,
          trends: videoId,
          topFiveGrid: videoId,
          featuredSlides: videoId,
          topNine: videoId,
        },
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch videos." });
  }
};
