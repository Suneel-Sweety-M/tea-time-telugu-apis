import JWT from "jsonwebtoken";
import {
  compareString,
  createJWT,
  createRefreshJWT,
  hashString,
} from "../middlewares/jwt.js";
import Users from "../models/userModel.js";
import passport from "passport";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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
      // secure: process.env.NODE_ENV === "production",
      secure: true, // For testing purposes, set to true
      sameSite: "None",
      // sameSite: "Strict",
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
      // secure: process.env.NODE_ENV === "production",
      secure: true, // For testing purposes, set to true
      sameSite: "None",
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
    // secure: process.env.NODE_ENV === "production",
    // sameSite: "Strict",
    secure: true, // For testing purposes, set to true
    sameSite: "None",
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


export const adminForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).send({
        status: "fail",
        message: "Please provide an email address.",
      });
    }

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).send({
        status: "fail",
        message: "User not found with this email.",
      });
    }

    if (user?.role !== "admin") {
      return res.status(404).send({
        status: "fail",
        message: "You are not an admin!",
      });
    }

    // Here you would typically send a reset password link to the user's email
    // 🔐 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    // 🧠 Store in DB
    user.resetToken = resetToken;
    user.resetTokenExpires = tokenExpiry;
    await user.save();

    // 🔗 Reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // 📧 Send email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Tea Time Telugu Support" <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: "Password Reset Link",
      html: `<p>Hi ${user.fullName},</p>
             <p>Click the link below to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>This link will expire in 1 hour.</p>`,
    };

    await transporter.sendMail(mailOptions);
    // Note: In a real application, you would handle errors from the email service
    // and possibly log them or notify the user if the email failed to send.

    // For simplicity, we will just return a success message
    return res.status(200).send({
      status: "success",
      message: "Reset password link sent to your email.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: "Server error while processing forgot password request.",
    });
  }
};

export const writerForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).send({
        status: "fail",
        message: "Please provide an email address.",
      });
    }

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).send({
        status: "fail",
        message: "User not found with this email.",
      });
    }

    if (user?.role !== "writer") {
      return res.status(404).send({
        status: "fail",
        message: "You are not a writer!",
      });
    }

    const adminsMails = await Users.find({ role: "admin" }, "email");
    if (adminsMails.length === 0) {
      return res.status(404).send({
        status: "fail",
        message: "No admin found to handle this request.",
      });
    }

    // Send email to admin
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Tea Time Telugu Notification" <${process.env.AUTH_EMAIL}>`,
      to: adminsMails.map((admin) => admin.email).join(", "), // comma-separated list of admins
      subject: "Writer Password Reset Request",
      html: `<p><strong>Writer Name:</strong> ${user?.fullName}</p>
             <p><strong>Writer Email:</strong> ${email}</p>
             <p>This writer has requested to reset their password. Please take necessary action.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).send({
      status: "success",
      message:
        "Your request has been sent to the admin. You will be contacted shortly.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: "Server error while processing forgot password request.",
    });
  }
};

export const resetAdminPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Validate inputs
    if (!token || !password) {
      return res.status(400).send({
        status: "fail",
        message: "Token and new password are required.",
      });
    }

    // Find user by token and check if it's still valid
    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send({
        status: "fail",
        message: "Invalid or expired reset token.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).send({
        status: "fail",
        message: "You are not admin to reset this password.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    return res.status(200).send({
      status: "success",
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset Error:", error);
    return res.status(500).send({
      status: "fail",
      message: "Something went wrong while resetting the password.",
    });
  }
};
