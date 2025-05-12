import express from "express";
import {
  addMovieCollections,
  addMovieReleases,
  deleteMovieCollection,
  deleteMovieRelease,
  editMovieCollection,
  editMovieRelease,
  getDashboardData,
  getFilesLinks,
  getHomeGrid,
  getMovieCollections,
  getMoviePoster,
  getMovieReleases,
  getPopupPoster,
  getTopNine,
  getTrends,
  setFilesLink,
  setHomeGrid,
  setMoviePoster,
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
router.get("/get-popup-poster", getPopupPoster);
router.get("/get-movie-poster", getMoviePoster);

router.post("/set-popup-poster", setPopupPoster);
router.post("/set-movie-poster", setMoviePoster);

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
