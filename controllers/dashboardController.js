import { v4 as uuidv4 } from "uuid";
import Assets from "../models/assetsModel.js";
import News from "../models/newsModel.js";
import { uploadFile } from "../services/s3Services.js";
import Users from "../models/userModel.js";

export const getDashboardData = async (req, res) => {
  try {
    const newsCount = await News.countDocuments();
    const usersCount = await Users.countDocuments();
    const writersCount = await Users.countDocuments({ role: "writer" });
    const adminsCount = await Users.countDocuments({ role: "admin" });

    return res.status(200).json({
      status: "success",
      message: "Data fetched successfully",
      newsCount,
      usersCount,
      writersCount,
      adminsCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// export const setHomeGrid = async (req, res) => {
//   try {
//     const { items } = req.body;
//     const { user } = req.user;

//     if (!items || items.length === 0) {
//       return res
//         .status(404)
//         .json({ status: "fail", message: "Add at least one item!" });
//     }

//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: "fail", message: "User not found!" });
//     }

//     if (user.role !== "admin" && user.role !== "writer") {
//       return res
//         .status(403)
//         .json({ status: "fail", message: "Unauthorized action!" });
//     }

//     let homeAssets = await Assets.findOne();

//     // Check if home assets exist
//     if (!homeAssets) {
//       // If no assets exist, create a new document
//       homeAssets = new Assets({
//         topFiveGrid: items,
//       });
//     } else {
//       // If assets exist, update the topFiveGrid with the new items
//       homeAssets.topFiveGrid = items;
//     }

//     await homeAssets.save();

//     return res.status(200).json({
//       status: "success",
//       message: "Added successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// };

export const setHomeGrid = async (req, res) => {
  try {
    const { items } = req.body; // [{ news: ObjectId, position: 1 }, ...]
    const { user } = req.user;

    if (!items || items.length !== 5) {
      return res.status(400).json({
        status: "fail",
        message: "Exactly 5 items with positions must be selected!",
      });
    }

    if (!user || (user.role !== "admin" && user.role !== "writer")) {
      return res.status(403).json({ status: "fail", message: "Unauthorized" });
    }

    let homeAssets = await Assets.findOne();

    if (!homeAssets) {
      homeAssets = new Assets({ topFiveGrid: items });
    } else {
      homeAssets.topFiveGrid = items;
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Grid saved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// export const getHomeGrid = async (req, res) => {
//   try {
//     const homeAssets = await Assets.findOne();

//     if (!homeAssets) {
//       // If no assets are found, create a new document
//       const newHomeAssets = new Assets({
//         topFiveGrid: [],
//       });
//       await newHomeAssets.save();
//       return res.status(200).json({
//         status: "success",
//         message: "No home assets found. Created a new document.",
//         topFiveGrid: [],
//       });
//     }

//     // If assets are found, retrieve news posts corresponding to topFiveGrid IDs
//     const news = await News.find({
//       _id: { $in: homeAssets.topFiveGrid },
//     }).populate("postedBy", "fullName profileUrl");
//     // .sort({ createdAt: -1 });

//     return res.status(200).json({
//       status: "success",
//       message: "Fetched successfully",
//       news,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// }; 

export const getHomeGrid = async (req, res) => {
  try {
    const homeAssets = await Assets.findOne().populate({
      path: "topFiveGrid.news",
      populate: { path: "postedBy", select: "fullName profileUrl" },
    });

    if (!homeAssets) {
      const newHomeAssets = new Assets({ topFiveGrid: [] });
      await newHomeAssets.save();
      return res.status(200).json({
        status: "success",
        message: "No home assets found. Created a new document.",
        topFiveGrid: [],
      });
    }

    const sortedNews = homeAssets.topFiveGrid
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ ...item.news._doc, position: item.position }));

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      news: sortedNews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// export const setTopNine = async (req, res) => {
//   try {
//     const { items } = req.body;
//     const { user } = req.user;

//     if (!items || items.length === 0) {
//       return res
//         .status(404)
//         .json({ status: "fail", message: "Add at least one item!" });
//     }

//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: "fail", message: "User not found!" });
//     }

//     if (user.role !== "admin" && user.role !== "writer") {
//       return res
//         .status(403)
//         .json({ status: "fail", message: "Unauthorized action!" });
//     }

//     let homeAssets = await Assets.findOne();

//     // Check if home assets exist
//     if (!homeAssets) {
//       // If no assets exist, create a new document
//       homeAssets = new Assets({
//         topNine: items,
//       });
//     } else {
//       // If assets exist, update the topNine with the new items
//       homeAssets.topNine = items;
//     }

//     await homeAssets.save();

//     return res.status(200).json({
//       status: "success",
//       message: "Added successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// };

export const setTopNine = async (req, res) => {
  try {
    const { items } = req.body; // [{ news: ObjectId, position: 1 }, ...]
    const { user } = req.user;

    if (!items || items.length !== 9) {
      return res.status(400).json({
        status: "fail",
        message: "Exactly 9 posts with positions are required!",
      });
    }

    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res.status(403).json({ status: "fail", message: "Unauthorized action!" });
    }

    let homeAssets = await Assets.findOne();

    if (!homeAssets) {
      homeAssets = new Assets({ topNine: items });
    } else {
      homeAssets.topNine = items;
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Top 9 updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// export const getTopNine = async (req, res) => {
//   try {
//     const homeAssets = await Assets.findOne();

//     if (!homeAssets) {
//       // If no assets are found, create a new document
//       const newHomeAssets = new Assets({
//         topNine: [],
//       });
//       await newHomeAssets.save();
//       return res.status(200).json({
//         status: "success",
//         message: "No data found!",
//         topNine: [],
//       });
//     }

//     // If assets are found, retrieve news posts corresponding to topNine IDs
//     const news = await News.find({
//       _id: { $in: homeAssets.topNine },
//     }).populate("postedBy", "fullName profileUrl");
//     // .sort({ createdAt: -1 });

//     return res.status(200).json({
//       status: "success",
//       message: "Fetched successfully",
//       news,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// };

export const getTopNine = async (req, res) => {
  try {
    const homeAssets = await Assets.findOne().populate({
      path: "topNine.news",
      populate: { path: "postedBy", select: "fullName profileUrl" },
    });

    if (!homeAssets) {
      const newHomeAssets = new Assets({ topNine: [] });
      await newHomeAssets.save();
      return res.status(200).json({
        status: "success",
        message: "No top 9 found",
        news: [],
      });
    }

    const sortedNews = homeAssets.topNine
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ ...item.news._doc, position: item.position }));

    return res.status(200).json({
      status: "success",
      message: "Top 9 fetched successfully",
      news: sortedNews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};


export const setTrends = async (req, res) => {
  try {
    const { items } = req.body;
    const { user } = req.user;

    if (!items || items.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add at least one item!" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    let homeAssets = await Assets.findOne();

    // Check if home assets exist
    if (!homeAssets) {
      // If no assets exist, create a new document
      homeAssets = new Assets({
        trends: items,
      });
    } else {
      // If assets exist, update the trends with the new items
      homeAssets.trends = items;
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getTrends = async (req, res) => {
  try {
    const homeAssets = await Assets.findOne();

    if (!homeAssets) {
      // If no assets are found, create a new document
      const newHomeAssets = new Assets({
        trends: [],
      });
      await newHomeAssets.save();
      return res.status(200).json({
        status: "success",
        message: "No data found!",
        trends: [],
      });
    }

    // If assets are found, retrieve news posts corresponding to trends IDs
    const news = await News.find({
      _id: { $in: homeAssets.trends },
    }).populate("postedBy", "fullName profileUrl");
    // .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      news,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const setFilesLink = async (req, res) => {
  try {
    const { user } = req.user;

    if (!req.file) {
      return res
        .status(404)
        .json({ status: "fail", message: "Upload a file!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    const uploadResult = await uploadFile(req.file);
    const mainUrl = uploadResult.Location;

    const assets = await Assets.findOneAndUpdate(
      {},
      { $push: { filesLinks: mainUrl } },
      { new: true, upsert: true }
    );

    if (assets.filesLinks.length > 10) {
      // Keep only the last 10 links
      assets.filesLinks = assets.filesLinks.slice(-10);
      await assets.save();
    }

    return res.status(200).json({
      status: "success",
      message: "File added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getFilesLinks = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "filesLinks");

    if (!assets || !assets.filesLinks) {
      return res
        .status(404)
        .json({ status: "fail", message: "No file links found!" });
    }

    return res.status(200).json({
      status: "success",
      message: "Files fetched successfully",
      filesLinks: assets.filesLinks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addMovieReleases = async (req, res) => {
  try {
    const { movie, date, category } = req.body;
    const { user } = req.user;

    if (!movie) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add movie name!" });
    }

    if (!date) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add release date!" });
    }

    if (!category) {
      return res.status(404).json({ status: "fail", message: "Add category!" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    let homeAssets = await Assets.findOne();

    const newRelease = {
      id: uuidv4(),
      movie,
      date,
      category,
    };

    if (!homeAssets) {
      homeAssets = new Assets({
        movieReleases: [newRelease],
      });
    } else {
      homeAssets.movieReleases = [...homeAssets.movieReleases, newRelease];
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getMovieReleases = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "movieReleases");

    if (!assets || !assets.movieReleases) {
      return res
        .status(404)
        .json({ status: "fail", message: "No data found!" });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      movieReleases: assets.movieReleases.slice().reverse(),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editMovieRelease = async (req, res) => {
  try {
    const { movie, date, category, id } = req.body;
    const { user } = req.user;

    if (!movie && !date && !category) {
      return res
        .status(400)
        .json({ status: "fail", message: "Nothing to update!" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    const homeAssets = await Assets.findOne();

    if (!homeAssets) {
      return res
        .status(404)
        .json({ status: "fail", message: "Assets not found!" });
    }

    const movieRelease = homeAssets.movieReleases.find(
      (release) => release.id.toString() === id.toString()
    );

    if (!movieRelease) {
      return res
        .status(404)
        .json({ status: "fail", message: "Movie release not found!" });
    }

    // Update fields if they are provided
    if (movie) movieRelease.movie = movie;
    if (date) movieRelease.date = date;
    if (category) movieRelease.category = category;

    homeAssets.markModified("movieReleases");

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteMovieRelease = async (req, res) => {
  try {
    const { user } = req.user;
    const { id } = req.params;

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    const homeAssets = await Assets.findOne();

    if (!homeAssets) {
      return res
        .status(404)
        .json({ status: "fail", message: "Assets not found!" });
    }

    const initialLength = homeAssets.movieReleases.length;
    homeAssets.movieReleases = homeAssets.movieReleases.filter(
      (release) => release.id.toString() !== id.toString()
    );

    if (homeAssets.movieReleases.length === initialLength) {
      return res
        .status(404)
        .json({ status: "fail", message: "Movie release not found!" });
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addMovieCollections = async (req, res) => {
  try {
    const { movie2, category2, amount } = req.body;
    const { user } = req.user;

    if (!movie2) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add movie name!" });
    }

    if (!amount) {
      return res
        .status(404)
        .json({ status: "fail", message: "Add release amount!" });
    }

    if (!category2) {
      return res.status(404).json({ status: "fail", message: "Add category!" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    let homeAssets = await Assets.findOne();

    const newRelease = {
      id: uuidv4(),
      movie: movie2,
      amount,
      category: category2,
    };

    if (!homeAssets) {
      homeAssets = new Assets({
        movieCollections: [newRelease],
      });
    } else {
      homeAssets.movieCollections = [
        ...homeAssets.movieCollections,
        newRelease,
      ];
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getMovieCollections = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "movieCollections");

    if (!assets || !assets.movieCollections) {
      return res
        .status(404)
        .json({ status: "fail", message: "No data found!" });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      movieCollections: assets.movieCollections.slice().reverse(),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editMovieCollection = async (req, res) => {
  try {
    const { movie, amount, category, id } = req.body;
    const { user } = req.user;

    if (!movie && !amount && !category) {
      return res
        .status(400)
        .json({ status: "fail", message: "Nothing to update!" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    const homeAssets = await Assets.findOne();

    if (!homeAssets) {
      return res
        .status(404)
        .json({ status: "fail", message: "Assets not found!" });
    }

    const movieCollection = homeAssets.movieCollections.find(
      (release) => release.id.toString() === id.toString()
    );

    if (!movieCollection) {
      return res
        .status(404)
        .json({ status: "fail", message: "Movie release not found!" });
    }

    // Update fields if they are provided
    if (movie) movieCollection.movie = movie;
    if (amount) movieCollection.amount = amount;
    if (category) movieCollection.category = category;

    homeAssets.markModified("movieCollections");

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteMovieCollection = async (req, res) => {
  try {
    const { user } = req.user;
    const { id } = req.params;

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    if (user.role !== "admin" && user.role !== "writer") {
      return res
        .status(403)
        .json({ status: "fail", message: "Unauthorized action!" });
    }

    const homeAssets = await Assets.findOne();

    if (!homeAssets) {
      return res
        .status(404)
        .json({ status: "fail", message: "Assets not found!" });
    }

    const initialLength = homeAssets.movieCollections.length;

    homeAssets.movieCollections = homeAssets.movieCollections.filter(
      (collection) => collection.id.toString() !== id.toString()
    );

    if (homeAssets.movieCollections.length === initialLength) {
      return res
        .status(404)
        .json({ status: "fail", message: "Movie collection not found!" });
    }

    await homeAssets.save();

    return res.status(200).json({
      status: "success",
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getPopupPoster = async (req, res) => {
  try {
    const assets = await Assets.find({}, "posters");

    if (!assets || assets.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    const { popupPoster } = assets[0].posters;

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      popupPoster,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setPopupPoster = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "posters.popupPoster": { img, link } } },
      { new: true }
    );

    if (!updatedAsset) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found to update!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Popup poster updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const getMoviePoster = async (req, res) => {
  try {
    const assets = await Assets.find({}, "posters");

    if (!assets || assets.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    const { moviePoster } = assets[0].posters;

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      moviePoster,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setMoviePoster = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "posters.moviePoster": { img, link } } },
      { new: true }
    );

    if (!updatedAsset) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found to update!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Movie poster updated successfully!",
      data: updatedAsset.posters.moviePoster,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const getNavbarAd = async (req, res) => {
  try {
    const assets = await Assets.find({}, "posters");

    if (!assets || assets?.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    const { navbarAd } = assets[0].posters;

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      navbarAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setNavbarAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'image' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "posters.navbarAd": { img, link } } },
      { new: true }
    );

    if (!updatedAsset) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found to update!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Ad updated successfully!",
      data: updatedAsset?.posters?.navbarAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for Home Long Ad
export const getHomeLongAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.homeLongAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      homeLongAd: assets.ads?.homeLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setHomeLongAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.homeLongAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Home Long Ad updated successfully!",
      data: updatedAsset.ads?.homeLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for Home Short Ad
export const getHomeShortAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.homeShortAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      homeShortAd: assets.ads?.homeShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setHomeShortAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.homeShortAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Home Short Ad updated successfully!",
      data: updatedAsset.ads?.homeShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for Category Long Ad
export const getCategoryLongAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.categoryLongAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      categoryLongAd: assets.ads?.categoryLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setCategoryLongAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.categoryLongAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Category Long Ad updated successfully!",
      data: updatedAsset.ads?.categoryLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for Category Short Ad
export const getCategoryShortAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.categoryShortAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      categoryShortAd: assets.ads?.categoryShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setCategoryShortAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.categoryShortAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Category Short Ad updated successfully!",
      data: updatedAsset.ads?.categoryShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for News Long Ad
export const getNewsLongAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.newsLongAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      newsLongAd: assets.ads?.newsLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setNewsLongAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.newsLongAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "News Long Ad updated successfully!",
      data: updatedAsset.ads?.newsLongAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

// Getter and Setter for News Short Ad
export const getNewsShortAd = async (req, res) => {
  try {
    const assets = await Assets.findOne({}, "ads.newsShortAd");

    if (!assets) {
      return res.status(404).json({
        status: "fail",
        message: "No assets found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Fetched successfully",
      newsShortAd: assets.ads?.newsShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const setNewsShortAd = async (req, res) => {
  try {
    const { img, link } = req.body;

    if (!img || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Both 'img' and 'link' are required!",
      });
    }

    const updatedAsset = await Assets.findOneAndUpdate(
      {},
      { $set: { "ads.newsShortAd": { img, link } } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      message: "News Short Ad updated successfully!",
      data: updatedAsset.ads?.newsShortAd,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};