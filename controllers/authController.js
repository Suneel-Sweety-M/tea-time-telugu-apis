import JWT from "jsonwebtoken";
import {
  compareString,
  createJWT,
  createRefreshJWT,
  hashString,
} from "../middlewares/jwt.js";
import Users from "../models/userModel.js";
import passport from "passport";

export const register = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res
        .status(404)
        .json({ status: "fail", message: "Provide all fields!" });
    }

    const userExist = await Users.findOne({ email });

    if (userExist) {
      return res.status(404).json({
        status: "info",
        message: "User already exists with this email, Please login.",
      });
    }

    const hashedPassword = await hashString(password);

    const user = await Users.create({
      fullName,
      email,
      role,
      password: hashedPassword,
    });

    const tokenUser = {
      _id: user?._id,
      fullName: user?.fullName,
      profileUrl: user?.profileUrl,
      email: user?.email,
      role: user?.role,
    };

    const token = createJWT(tokenUser);
    const refreshToken = createRefreshJWT(tokenUser);

    user.refreshToken = refreshToken;

    res.status(201).json({
      status: "success",
      message: "Registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(504).json({ status: "fail", message: error.message });
  }
};

export const joinWithGoogle = (req, res) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
};

export const googleCallback = (req, res) => {
  passport.authenticate("google", { session: false }, async (err, data) => {
    if (err || !data) {
      return res
        .status(404)
        .json({ status: "fail", message: "Authentication failed!" });
    }

    const { user } = data;
    const cUser = await Users.findById(user?._id);
    const refreshToken = createRefreshJWT(user);
    user.refreshToken = refreshToken;
    await cUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(
      `${process.env.CLIENT_URL}?userId=${user?._id}&fullName=${user?.fullName}&profileUrl=${user?.profileUrl}&role=${user?.role}`
    );
  })(req, res);
};

export const registerByAdmin = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    const admin = req.user.user;

    if (admin?.role !== "admin") {
      return res
        .status(404)
        .json({ status: "fail", message: "You can't add account!" });
    }

    if (!fullName || !email || !password) {
      return res
        .status(404)
        .json({ status: "fail", message: "Provide all fields!" });
    }

    const userExist = await Users.findOne({ email });

    if (userExist) {
      return res.status(404).json({
        status: "info",
        message: "User already exists with this email, Please login.",
      });
    }

    const hashedPassword = await hashString(password);

    const user = await Users.create({
      fullName,
      email,
      role,
      password: hashedPassword,
    });

    const tokenUser = {
      _id: user?._id,
      fullName: user?.fullName,
      profileUrl: user?.profileUrl,
      email: user?.email,
      role: user?.role,
    };

    const token = createJWT(tokenUser);
    const refreshToken = createRefreshJWT(tokenUser);

    user.refreshToken = refreshToken;

    return res.status(201).json({
      status: "success",
      message: "Registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ status: "fail", message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({
        status: "fail",
        message: "Please provide user credentials.",
      });
    }

    const user = await Users.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found!" });
    }

    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Invalid credentials." });
    }

    const token = createJWT(user);
    const refreshToken = createRefreshJWT(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    user.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ success: "fail", message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  return res
    .status(200)
    .send({ status: "success", message: "Logged out successfully" });
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res
        .status(403)
        .send({ status: "fail", message: "No token provided!" });
    }

    const user = await Users.findOne({ refreshToken });

    if (!user) {
      return res
        .status(403)
        .send({ status: "fail", message: "Invalid token!" });
    }

    JWT.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
      (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .send({ status: "fail", message: "Invalid token!" });
        }

        const newToken = createJWT(decoded.user);

        res.status(201).json({
          status: "success",
          token: newToken,
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: "fail", message: "Server error!" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, cnewPassword } = req.body;
    const { user } = req.user;

    if (newPassword.length < 6) {
      return res.status(400).send({
        status: "fail",
        message: "Password must be more than 6 charecters!",
      });
    }

    if (newPassword !== cnewPassword) {
      return res.status(401).send({
        status: "fail",
        message: "Password and Confirm password not mached!",
      });
    }

    const hashedpassword = await hashString(newPassword);

    const cuser = await Users.findById(user?._id);

    if (!cuser) {
      return res.status(401).send({
        status: "fail",
        message: "Invalid or expired reset token",
      });
    }

    cuser.password = hashedpassword;

    await cuser.save();

    return res.status(200).send({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    return res
      .status(501)
      .send({ status: "fail", message: "Password reset error!", error });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword, cnewPassword } = req.body;
    const { user } = req.user;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send({
        status: "fail",
        message: "Provide user id!",
      });
    }

    if (userId?.length !== 24) {
      return res.status(400).send({
        status: "fail",
        message: "Invalid user id!",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({
        status: "fail",
        message: "Password must be more than 6 charecters!",
      });
    }

    if (newPassword !== cnewPassword) {
      return res.status(401).send({
        status: "fail",
        message: "Password and Confirm password not mached!",
      });
    }

    if (user?.role !== "admin") {
      return res.status(401).send({
        status: "fail",
        message: "You are not authorized to change password!  ",
      });
    }

    const hashedpassword = await hashString(newPassword);

    const cuser = await Users.findById(userId);

    if (!cuser) {
      return res.status(401).send({
        status: "fail",
        message: "Invalid or expired reset token",
      });
    }

    cuser.password = hashedpassword;

    await cuser.save();

    return res.status(200).send({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    return res
      .status(501)
      .send({ status: "fail", message: "Password reset error!", error });
  }
};
