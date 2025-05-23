import mongoose from "mongoose";
import Gallery from "../models/galleryModel.js";
import News from "../models/newsModel.js";
import { uploadFile } from "../services/s3Services.js";
import Users from "../models/userModel.js";
import Assets from "../models/assetsModel.js";
import { sendNewsAddedEmail } from "../services/mails.js";

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

    const newPost = new News({
      postedBy: user?._id,
      title,
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
        postLink: `${process.env.CLIENT_URL}/gossips/${newPost?._id}`,
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

export const getSearchedNews = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm) {
      return res
        .status(400)
        .json({ status: "fail", message: "Search term is required." });
    }

    const newsResults = await News.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    });

    // Fetch gallery items matching the search term from the Gallery model
    const galleryResults = await Gallery.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    });

    // Initialize an object to store categories
    const categorizedResults = {
      news: [],
      politics: [],
      movies: [],
      videos: [],
      gallery: [],
      ott: [],
      shows: [],
      collections: [],
      reviews: [],
      gossips: [],
    };

    // Sort News model results into categories
    newsResults.forEach((article) => {
      const category = article.category.toLowerCase();
      if (categorizedResults[category]) {
        categorizedResults[category].push(article);
      }
    });

    // Add gallery results to the "gallery" category
    categorizedResults.gallery = galleryResults;

    // Return categorized news results with gallery items
    return res
      .status(200)
      .json({ status: "success", data: categorizedResults });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
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

    // Update the fields with new data
    newsToEdit.title = title;
    newsToEdit.description = description;
    newsToEdit.category = category;
    newsToEdit.subCategory = subCategory;
    newsToEdit.tags = tags;

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
