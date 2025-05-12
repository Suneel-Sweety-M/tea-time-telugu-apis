import express from "express";
import multer from "multer";
import userAuth from "../middlewares/verifyUser.js";
import {
  addProfilePic,
  adMail,
  contactUsMail,
  editProfilePic,
  getAdminsWriters,
  getCurrentUser,
  getUser,
  updateDetails,
  updateUserDetails,
  userActive,
} from "../controllers/userController.js";

const router = express.Router();

// Initialize multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/add-profile-pic",
  userAuth,
  upload.single("profilePic"),
  addProfilePic
);

router.post(
  "/edit-profile-pic/:userId",
  userAuth,
  upload.single("profilePic"),
  editProfilePic
);

router.get("/me", userAuth, getCurrentUser);
router.get("/admins-and-writers", userAuth, getAdminsWriters);
router.get("/:id", userAuth, getUser);

router.post("/ad-mail", adMail);
router.post("/contact-mail", contactUsMail);
router.post("/:userId/update-details", userAuth, updateDetails);
router.post("/:userId/update-user-details", userAuth, updateUserDetails);
router.post("/:userId/update-active", userAuth, userActive);

export default router;
