import mongoose from "mongoose";
import Gallery from "../models/galleryModel.js";
import News from "../models/newsModel.js";
import { uploadFile } from "../services/s3Services.js";
import Users from "../models/userModel.js";
import Assets from "../models/assetsModel.js";
import { sendNewsAddedEmail } from "../services/mails.js";
import { generateUniqueSlug } from "../middlewares/slugGenerator.js";
import Videos from "../models/videoModel.js";

export const addNews = async (req, res) => {
  try {
    const { title, description, category, subCategory, tags, movieRating } =
      req.body;
    const { user } = req.user;

    if (!title) {
      return res.status(404).send({ status: "fail", message: "Write title!" });
    }

    if (!description) {
      return res
        .status(404)
        .send({ status: "fail", message: "Write something in description!" });
    }

    if (!category) {
      return res
        .status(404)
        .send({ status: "fail", message: "Select category!" });
    }

    if (!tags) {
      return res.status(404).send({ status: "fail", message: "Add tags!" });
    }

    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser?.role === "admin" || currentUser?.role === "writer") &&
      currentUser?.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to post!",
      });
    }

    const uploadResult = await uploadFile(req.file);
    const mainUrl = uploadResult.Location;

    // Generate unique newsId from title
    const newsId = await generateUniqueSlug(News, title);

    const newPost = new News({
      postedBy: user?._id,
      title,
      newsId,
      mainUrl,
      description,
      category,
      subCategory,
      tags,
      movieRating,
    });

    await newPost.save();

    const users = await Users.find({
      role: { $in: ["admin", "writer"] },
      _id: { $ne: user?._id },
    });

    users.forEach((u) => {
      sendNewsAddedEmail({
        res,
        email: u.email,
        fullName: u.fullName,
        postedBy: user?.fullName,
        category: category,
        imgSrc: mainUrl,
        newsTitle: title,
        postLink: `${process.env.CLIENT_URL}/${newPost?.category}/${newPost?.newsId}`,
      });
    });

    return res.status(200).json({
      status: "success",
      message: "News added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched News successfully",
      news,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getLatestNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10) // Limit to latest 10 news
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched latest 10 News successfully",
      news,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getTrendingNews = async (req, res) => {
  try {
    // 7 days ago date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const trendingNews = await News.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }, // only news from last 7 days
        },
      },
      // Lookup comments count
      {
        $lookup: {
          from: "comments", // your comments collection name
          localField: "_id",
          foreignField: "news", // field in Comments that links to News
          as: "commentsData",
        },
      },
      {
        $addFields: {
          commentsCount: { $size: "$commentsData" },
          reactionsCount: { $size: "$reactions" }, // assuming reactions is an array
        },
      },
      {
        $sort: {
          reactionsCount: -1,
          commentsCount: -1,
        },
      },
      {
        $limit: 10, // get top 10
      },
    ]);

    // Populate postedBy manually after aggregation
    const populatedNews = await News.populate(trendingNews, {
      path: "postedBy",
      select: "fullName profileUrl",
    });

    return res.status(200).json({
      status: "success",
      message: "Trending news fetched successfully",
      news: populatedNews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getHomeNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .limit(9)
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched Home News successfully",
      news,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getNewsById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId || postId.length !== 24) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    const post = await News.findById(postId)
      .populate("postedBy", "fullName profileUrl")
      .exec();

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News not found",
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const suggestedNews = await News.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(postId) }, // Corrected to use 'new'
          createdAt: { $gte: oneWeekAgo }, // Only posts from the last week
        },
      },
      { $sample: { size: 20 } },
    ]);

    return res.status(200).json({
      status: "success",
      message: "News fetched successfully",
      news: post,
      suggestedNews,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while fetching the news!",
    });
  }
};

export const getNewsByNewsId = async (req, res) => {
  try {
    const { newsId } = req.params;

    if (!newsId) {
      return res.status(400).json({
        status: "fail",
        message: "newsId parameter is required",
      });
    }

    const post = await News.findOne({ newsId })
      .populate("postedBy", "fullName profileUrl")
      .exec();

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News not found",
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const suggestedNews = await News.aggregate([
      {
        $match: {
          newsId: { $ne: newsId }, // Changed to use newsId instead of _id
          createdAt: { $gte: oneWeekAgo },
        },
      },
      { $sample: { size: 20 } },
    ]);

    return res.status(200).json({
      status: "success",
      message: "News fetched successfully",
      news: post,
      suggestedNews,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching the news",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getFilteredNews = async (req, res) => {
  const { category, subcategory } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subCategory = subcategory;
  }

  try {
    const news = await News.find(filter)
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched News successfully",
      news,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getCategoryNews = async (req, res) => {
  const { category, subcategory, page = 1, limit = 12 } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subCategory = subcategory;
  }

  try {
    const total = await News.countDocuments(filter);
    const news = await News.find(filter)
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched News successfully",
      news,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// export const getSearchedNews = async (req, res) => {
//   try {
//     const searchTerm = req.query.q;

//     if (!searchTerm) {
//       return res
//         .status(400)
//         .json({ status: "fail", message: "Search term is required." });
//     }

//     const newsResults = await News.find({
//       $or: [
//         { title: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//       ],
//     });

//     // Fetch gallery items matching the search term from the Gallery model
//     const galleryResults = await Gallery.find({
//       $or: [
//         { name: { $regex: searchTerm, $options: "i" } },
//         { title: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//       ],
//     });

//     // Fetch gallery items matching the search term from the Gallery model
//     const videoResults = await Videos.find({
//       $or: [
//         { title: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//       ],
//     });

//     // Initialize an object to store categories
//     const categorizedResults = {
//       news: [],
//       politics: [],
//       movies: [],
//       videos: [],
//       gallery: [],
//       ott: [],
//       shows: [],
//       collections: [],
//       reviews: [],
//       gossips: [],
//     };

//     // Sort News model results into categories
//     newsResults.forEach((article) => {
//       const category = article.category.toLowerCase();
//       if (categorizedResults[category]) {
//         categorizedResults[category].push(article);
//       }
//     });

//     // Add gallery results to the "gallery" category
//     categorizedResults.gallery = galleryResults;
//     categorizedResults.videos = videoResults;

//     // Return categorized news results with gallery items
//     return res
//       .status(200)
//       .json({ status: "success", data: categorizedResults });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// };

// newsController.js
// newsController.js
export const getSearchedNews = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const skip = Number(req.query.skip) || 0;
    const limit = Number(req.query.limit) || 9;

    if (!searchTerm) {
      return res.status(400).json({
        status: "fail",
        message: "Search term is required.",
      });
    }

    // Fetch News items
    const allNews = await News.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    // Split into categories
    const categories = [
      "news",
      "politics",
      "movies",
      "ott",
      "gossips",
      "reviews",
      "collections",
      "shows",
    ];
    const categorizedNews = {};
    categories.forEach((c) => {
      categorizedNews[c] = [];
    });

    allNews.forEach((article) => {
      const cat = article.category?.toLowerCase() || "news";
      if (categorizedNews[cat]) {
        categorizedNews[cat].push(article);
      } else {
        categorizedNews.news.push(article); // default
      }
    });

    // Paginate each category
    const paginatedNews = {};
    categories.forEach((cat) => {
      const total = categorizedNews[cat].length;
      const items = categorizedNews[cat].slice(skip, skip + limit);
      paginatedNews[cat] = { items, total };
    });

    // Fetch gallery and videos with pagination
    const [galleryResults, videoResults, galleryCount, videoCount] =
      await Promise.all([
        Gallery.find({
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Videos.find({
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Gallery.countDocuments({
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        }),
        Videos.countDocuments({
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        }),
      ]);

    return res.status(200).json({
      status: "success",
      data: {
        ...paginatedNews,
        gallery: { items: galleryResults, total: galleryCount },
        videos: { items: videoResults, total: videoCount },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const editNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, subCategory, tags } = req.body;
    const { user } = req.user;

    if (!id) {
      return res
        .status(404)
        .send({ status: "fail", message: "News ID is required!" });
    }

    const newsToEdit = await News.findById(id);

    if (!newsToEdit) {
      return res
        .status(404)
        .send({ status: "fail", message: "News not found!" });
    }

    if (!title) {
      return res.status(404).send({ status: "fail", message: "Write title!" });
    }

    if (!description) {
      return res
        .status(404)
        .send({ status: "fail", message: "Write something in description!" });
    }

    if (!category) {
      return res
        .status(404)
        .send({ status: "fail", message: "Select category!" });
    }

    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser.role !== "admin" && currentUser.role !== "writer") ||
      currentUser.isActive === false
    ) {
      return res.status(403).send({
        status: "fail",
        message: "You don't have permission to edit this news!",
      });
    }

    if (req?.file) {
      const uploadResult = await uploadFile(req.file);
      const mainUrl = uploadResult.Location;
      newsToEdit.mainUrl = mainUrl;
    }

    // Update the fields with new data
    newsToEdit.title = title;
    newsToEdit.description = description;
    newsToEdit.category = category;
    newsToEdit.subCategory = subCategory;
    newsToEdit.tags = tags;
    newsToEdit.newsAudio = null;

    if (title) {
      newsToEdit.newsId = await generateUniqueSlug(News, title, id);
    }

    await newsToEdit.save();

    res.status(200).json({
      status: "success",
      message: "News updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.user;

    if (!id) {
      return res
        .status(404)
        .send({ status: "fail", message: "News ID is required!" });
    }

    const newsToDelete = await News.findById(id);

    if (!newsToDelete) {
      return res
        .status(404)
        .send({ status: "fail", message: "News not found!" });
    }

    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser.role !== "admin" && currentUser.role !== "writer") ||
      currentUser.isActive === false
    ) {
      return res.status(403).send({
        status: "fail",
        message: "You don't have permission to delete this news!",
      });
    }

    await newsToDelete.deleteOne();

    await Assets.updateMany(
      {},
      {
        $pull: {
          andhra: id,
          telangana: id,
          movies: id,
          reviews: id,
          gossips: id,
          latestStories: id,
          trailers: id,
          trends: id,
          topFiveGrid: id,
          featuredSlides: id,
          topNine: id,
        },
      }
    );

    return res.status(200).json({
      status: "success",
      message: "News deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const filterNews = async (req, res) => {
  const { category, time, searchText, writer } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (writer) {
    filter.postedBy = writer;
  }

  if (searchText) {
    filter.$or = [
      { title: { $regex: searchText, $options: "i" } },
      { description: { $regex: searchText, $options: "i" } },
    ];
  }

  if (time) {
    const currentDate = new Date();

    if (time === "1day") {
      const oneDayAgo = new Date(
        currentDate.setDate(currentDate.getDate() - 1)
      );
      filter.createdAt = { $gte: oneDayAgo };
    } else if (time === "1week") {
      const oneWeekAgo = new Date(
        currentDate.setDate(currentDate.getDate() - 7)
      );
      filter.createdAt = { $gte: oneWeekAgo };
    } else if (time === "1month") {
      const oneMonthAgo = new Date(
        currentDate.setMonth(currentDate.getMonth() - 1)
      );
      filter.createdAt = { $gte: oneMonthAgo };
    } else if (time === "6month") {
      const oneMonthAgo = new Date(
        currentDate.setMonth(currentDate.getMonth() - 6)
      );
      filter.createdAt = { $gte: oneMonthAgo };
    } else if (time === "older") {
      const oneMonthAgo = new Date(
        currentDate.setMonth(currentDate.getMonth() - 6)
      );
      filter.createdAt = { $lt: oneMonthAgo };
    }
  }

  try {
    const news = await News.find(filter)
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched News successfully",
      news,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
