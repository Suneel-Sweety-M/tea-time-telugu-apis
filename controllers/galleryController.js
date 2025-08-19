import { generateUniqueSlug } from "../middlewares/slugGenerator.js";
import Gallery from "../models/galleryModel.js";
import Users from "../models/userModel.js";
import { uploadFile } from "../services/s3Services.js";

export const addGallery = async (req, res) => {
  try {
    const { title, name, description, category } = req.body;
    const { user } = req.user;

    if (!title) {
      return res.status(404).send({ status: "fail", message: "Write title!" });
    }

    if (!name) {
      return res.status(404).send({ status: "fail", message: "Write name!" });
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
      (currentUser.role === "admin" || currentUser.role === "writer") &&
      currentUser.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to post!",
      });
    }

    const galleryPics = [];

    for (const file of req.files) {
      const uploadResult = await uploadFile(file);
      galleryPics.push({
        url: uploadResult.Location,
      });
    }

    // Generate unique newsId from title
    const newsId = await generateUniqueSlug(Gallery, title);

    const newPost = new Gallery({
      postedBy: user?._id,
      title,
      name,
      description,
      category,
      galleryPics,
      newsId,
    });

    await newPost.save();

    res.status(200).json({
      status: "success",
      message: "Gallery added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getGallery = async (req, res) => {
  try {
    const posts = await Gallery.find()
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched gallery",
      gallery: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getGalleryPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const total = await Gallery.countDocuments();
    const posts = await Gallery.find()
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched gallery",
      gallery: posts,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getGalleryByQuery = async (req, res) => {
  try {
    const { category, searchText, postedTime } = req.query;
    const filter = {};

    // Filter by category if provided
    if (category) {
      filter.category = category;
    }

    // Filter by searchText in title or description if provided
    if (searchText) {
      filter.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { title: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
      ];
    }

    // Filter by postedTime if provided
    if (postedTime) {
      const now = new Date();
      let startDate;

      switch (postedTime) {
        case "last24h":
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case "last1week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last1month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "last6months":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case "above6months":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          filter.createdAt = { $lt: startDate };
          break;
        default:
          startDate = null;
      }

      if (startDate && postedTime !== "above6months") {
        filter.createdAt = { $gte: startDate };
      }
    }

    const posts = await Gallery.find(filter)
      .populate("postedBy", "fullName profileUrl")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      status: "success",
      message: "Fetched gallery",
      gallery: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getGalleryById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId || postId?.length !== 24) {
      return res.status(404).json({
        status: "fail",
        message: "post not found",
      });
    }

    const post = await Gallery.findById(postId)
      .populate("postedBy", "fullName profileUrl")
      .exec();

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Gallery post not found",
      });
    }

    const suggestedPosts = await Gallery.find({
      _id: { $ne: postId },
    })
      .sort({ createdAt: -1 })
      .limit(16);

    return res.status(200).json({
      status: "success",
      message: "Gallery post fetched successfully",
      gallery: post,
      suggestedPosts,
    });
  } catch (error) {
    console.error("Error fetching gallery post:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while fetching the gallery post",
    });
  }
};

export const getGalleryBynewsId = async (req, res) => {
  try {
    const { newsId } = req.params;

    if (!newsId) {
      return res.status(400).json({
        status: "fail",
        message: "newsId parameter is required",
      });
    }

    const post = await Gallery.findOne({ newsId })
      .populate("postedBy", "fullName profileUrl")
      .exec();

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Gallery post not found",
      });
    }

    const suggestedPosts = await Gallery.find({
      newsId: { $ne: newsId }, // Changed from _id to newsId
    })
      .sort({ createdAt: -1 })
      .limit(16);

    return res.status(200).json({
      status: "success",
      message: "Gallery post fetched successfully",
      gallery: post,
      suggestedPosts,
    });
  } catch (error) {
    console.error("Error fetching gallery post:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while fetching the gallery post",
    });
  }
};

export const fileLink = async (req, res) => {
  try {
    const { title, name, description, category } = req.body;

    res.status(200).json({
      status: "success",
      message: "Gallery added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, name, description, category } = req.body;

    let removedImages = req.body["removedImages"];
    if (removedImages && !Array.isArray(removedImages)) {
      removedImages = [removedImages]; // wrap single value into array
    }
    const { user } = req.user;

    if (!title || !name || !description || !category) {
      return res
        .status(404)
        .send({ status: "fail", message: "All fields are required!" });
    }

    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }

    const currentUser = await Users.findById(user?._id);

    if (
      (currentUser.role === "admin" || currentUser.role === "writer") &&
      currentUser.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to edit!",
      });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res
        .status(404)
        .send({ status: "fail", message: "Gallery not found!" });
    }

    if (
      gallery.postedBy.toString() !== user._id.toString() &&
      currentUser.role !== "admin" &&
      currentUser.role !== "writer"
    ) {
      return res
        .status(403)
        .send({ status: "fail", message: "Unauthorized action!" });
    }

    // ✅ Remove deleted images from gallery.galleryPics
    if (removedImages?.length) {
      gallery.galleryPics = gallery.galleryPics.filter(
        (img) => !removedImages.includes(img.url)
      );

      for (const imgUrl of removedImages) {
        try {
          if (imgUrl && typeof imgUrl === "string") {
            await deleteFile(imgUrl);
          }
        } catch (err) {
          console.log("AWS delete error:", err.message);
        }
      }
    }

    // ✅ Add new uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadFile(file);
        gallery.galleryPics.push({ url: uploadResult.Location });
      }
    }

    if (title) {
      const newsId = await generateUniqueSlug(Gallery, title, id);
      gallery.newsId = newsId;
    }

    gallery.title = title;
    gallery.name = name;
    gallery.description = description;
    gallery.category = category;

    await gallery.save();

    res.status(200).json({
      status: "success",
      message: "Gallery updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.user;

    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }

    const currentUser = await Users.findById(user._id);

    if (
      (currentUser.role === "admin" || currentUser.role === "writer") &&
      currentUser.isActive === false
    ) {
      return res.status(404).send({
        status: "fail",
        message: "You don't have permission to delete!",
      });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res
        .status(404)
        .send({ status: "fail", message: "Gallery not found!" });
    }

    if (
      gallery.postedBy.toString() !== user._id.toString() &&
      currentUser.role !== "admin" &&
      currentUser.role !== "writer"
    ) {
      return res
        .status(403)
        .send({ status: "fail", message: "Unauthorized action!" });
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Gallery deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
