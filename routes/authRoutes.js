import express from "express";
import {
  googleCallback,
  joinWithGoogle,
  login,
  logout,
  refreshToken,
  register,
  registerByAdmin,
  resetPassword,
  resetUserPassword,
} from "../controllers/authController.js";
import userAuth from "../middlewares/verifyUser.js";

const router = express.Router();

router.get("/join-with-google", joinWithGoogle);
router.get("/google/callback", googleCallback);

router.post("/register", register);
router.post("/login", login);

router.post("/register-by-admin", userAuth, registerByAdmin);
router.post("/change-password", userAuth, resetPassword);
router.post("/change-password/:userId", userAuth, resetUserPassword);

router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
