import express from "express";
import {
  addMovieCollections,
  addMovieReleases,
  deleteMovieCollection,
  deleteMovieRelease,
  editMovieCollection,
  editMovieRelease,
  getCategoryLongAd,
  getCategoryShortAd,
  getDashboardData,
  getFilesLinks,
  getHomeGrid,
  getHomeLongAd,
  getHomeShortAd,
  getMovieCollections,
  getMoviePoster,
  getMovieReleases,
  getNavbarAd,
  getNewsLongAd,
  getNewsShortAd,
  getPopupPoster,
  getTopNine,
  getTrends,
  setCategoryLongAd,
  setCategoryShortAd,
  setFilesLink,
  setHomeGrid,
  setHomeLongAd,
  setHomeShortAd,
  setMoviePoster,
  setNavbarAd,
  setNewsLongAd,
  setNewsShortAd,
  setPopupPoster,
  setTopNine,
  setTrends,
} from "../controllers/dashboardController.js";
import userAuth from "../middlewares/verifyUser.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/data", getDashboardData);
router.get("/get-home-grid", getHomeGrid);
router.get("/get-top-nine", getTopNine);
router.get("/get-trends", getTrends);
router.get("/get-files-links", getFilesLinks);
router.get("/get-movie-releases", getMovieReleases);
router.get("/get-movie-collections", getMovieCollections);

/*=== Ads & Posters ===*/
router.get("/get-popup-poster", getPopupPoster);
router.post("/set-popup-poster", setPopupPoster);
router.get("/get-movie-poster", getMoviePoster);
router.post("/set-movie-poster", setMoviePoster);
router.get("/get-navbar-ad", getNavbarAd);
router.post("/set-navbar-ad", setNavbarAd);
// Home Ads
router.get("/get-home-long-ad", getHomeLongAd);
router.post("/set-home-long-ad", setHomeLongAd);
router.get("/get-home-short-ad", getHomeShortAd);
router.post("/set-home-short-ad", setHomeShortAd);
// Category Ads
router.get("/get-category-long-ad", getCategoryLongAd);
router.post("/set-category-long-ad", setCategoryLongAd);
router.get("/get-category-short-ad", getCategoryShortAd);
router.post("/set-category-short-ad", setCategoryShortAd);
// News Ads
router.get("/get-news-long-ad", getNewsLongAd);
router.post("/set-news-long-ad", setNewsLongAd);
router.get("/get-news-short-ad", getNewsShortAd);
router.post("/set-news-short-ad", setNewsShortAd);

router.put("/edit-movie-release", userAuth, editMovieRelease);
router.put("/edit-movie-collection", userAuth, editMovieCollection);

router.delete("/delete-movie-release/:id", userAuth, deleteMovieRelease);
router.delete("/delete-movie-collection/:id", userAuth, deleteMovieCollection);

router.post("/add-movie-releases", userAuth, addMovieReleases);
router.post("/add-movie-collections", userAuth, addMovieCollections);
router.post("/set-home-grid", userAuth, setHomeGrid);
router.post("/set-top-nine", userAuth, setTopNine);
router.post("/set-trends", userAuth, setTrends);
router.post("/set-files-links", userAuth, upload.single("file"), setFilesLink);

export default router;
