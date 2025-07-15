import mongoose from "mongoose";
import Users from "../models/userModel.js";
import { sendAdEmail, sendContactUsEmail } from "../services/mails.js";
import { uploadFile } from "../services/s3Services.js";

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id?.length !== 24) {
      return res.status(500).json({
        status: "fail",
        message: "Invalid Id!",
      });
    }

    const user = await Users?.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found!",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "User Exist!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { user } = req?.user;

    if (!user) {
      return res.status(404).send({
        status: "fail",
        message: "No user!",
      });
    }

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      return res.status(400).send({
        status: "fail",
        message: "Invalid Id!",
      });
    }

    const thisUser = await Users.findOne({ _id: user?._id }).select(
      "-password -otp"
    );

    if (!thisUser) {
      return res.status(404).send({
        status: "fail",
        message: "User not found!",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "User fetched successfully",
      user: {
        _id: thisUser?._id,
        fullName: thisUser?.fullName,
        email: thisUser?.email,
        profileUrl: thisUser?.profileUrl,
        role: thisUser?.role,
        isActive: thisUser?.isActive,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: "Internal Server Error!",
    });
  }
};

export const addProfilePic = async (req, res) => {
  try {
    const { user } = req.user;

    if (!user?._id) {
      return res.status(400).send({
        status: "fail",
        message: "User Id not found!",
      });
    }

    const currentUser = await Users.findOne({ _id: user?._id });
    if (!currentUser) {
      return res.status(400).send({
        status: "fail",
        message: "User not found!",
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).send({
        status: "fail",
        message: "No file uploaded!",
      });
    }

    const file = req.file;

    // Upload file to S3
    const uploadResult = await uploadFile(file);

    // Update user's profile URL
    currentUser.profileUrl = uploadResult.Location;
    await currentUser.save();

    return res.status(200).send({
      status: "success",
      message: "Profile Pic added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "fail",
      message: "Internal Server Error!",
    });
  }
};

export const editProfilePic = async (req, res) => {
  try {
    const { user } = req.user;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send({
        status: "fail",
        message: "User Id not found!",
      });
    }

    if (userId.length !== 24) {
      return res.status(400).send({
        status: "fail",
        message: "Invalid User Id!",
      });
    }

    if (user?.role !== "admin") {
      return res.status(400).send({
        status: "fail",
        message: "You don't have access to change profile!",
      });
    }

    const currentUser = await Users.findOne({ _id: userId });
    if (!currentUser) {
      return res.status(400).send({
        status: "fail",
        message: "User not found!",
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).send({
        status: "fail",
        message: "No file uploaded!",
      });
    }

    const file = req.file;

    // Upload file to S3
    const uploadResult = await uploadFile(file);

    // Update user's profile URL
    currentUser.profileUrl = uploadResult.Location;
    await currentUser.save();

    return res.status(200).send({
      status: "success",
      message: "Profile Pic updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "fail",
      message: "Internal Server Error!",
    });
  }
};

export const getAdminsWriters = async (req, res) => {
  try {
    const { user } = req.user;

    const users = await Users.find({
      role: { $in: ["admin", "writer"] },
      _id: { $ne: user?._id },
    });

    return res.status(200).json({
      status: "success",
      message: "Fetched Writers and Admins",
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const userActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { user } = req.user;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "Provide UserId!",
      });
    }

    if (user?.role !== "admin") {
      return res.status(400).json({
        status: "fail",
        message: "You don't have access to change!",
      });
    }

    const updateUser = await Users.findById(userId);

    if (!updateUser) {
      return res.status(400).json({
        status: "fail",
        message: "User not found!",
      });
    }

    updateUser.isActive = !updateUser.isActive;

    await updateUser.save();

    return res.status(200).json({
      status: "success",
      message: "Active status updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const updateDetails = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const { userId } = req.params;
    const { user } = req.user;

    if (!userId || userId.length !== 24) {
      return res.status(400).send({
        status: "fail",
        message: "UserId not found!",
      });
    }

    if (user?._id !== userId) {
      return res.status(400).send({
        status: "fail",
        message: "You can't update!",
      });
    }

    if (!fullName) {
      return res.status(400).send({
        status: "fail",
        message: "Name is required!",
      });
    }

    if (!fullName && !email) {
      return res.status(400).send({
        status: "fail",
        message: "No data to update",
      });
    }

    const userExist = await Users.findOne({ email });

    if (userExist) {
      return res.status(404).json({
        status: "fail",
        message: "User already exists with this email.",
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    const cuser = await Users.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!cuser) {
      return res.status(400).send({
        status: "fail",
        message: "User not found!",
      });
    }

    await cuser.save();

    return res.status(200).send({
      status: "success",
      message: "Details updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: "Internal Server Error!",
    });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    const { userId } = req.params;
    const { user } = req.user;

    if (!userId || userId.length !== 24) {
      return res.status(400).send({
        status: "fail",
        message: "UserId not found!",
      });
    }

    if (user?._id !== userId && user?.role !== "admin") {
      return res.status(400).send({
        status: "fail",
        message: "You can't update!",
      });
    }

    if (!fullName) {
      return res.status(400).send({
        status: "fail",
        message: "Name is required!",
      });
    }

    if (!fullName && !email && !role) {
      return res.status(400).send({
        status: "fail",
        message: "No data to update",
      });
    }

    const userExist = await Users.findOne({ email });

    if (userExist) {
      return res.status(404).json({
        status: "fail",
        message: "User already exists with this email.",
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const cuser = await Users.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!cuser) {
      return res.status(400).send({
        status: "fail",
        message: "User not found!",
      });
    }

    await cuser.save();

    return res.status(200).send({
      status: "success",
      message: "Details updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "fail",
      message: "Internal Server Error!",
    });
  }
};

export const contactUsMail = async (req, res) => {
  try {
    const { email, fullName, subject, message } = req.body;

    if ((!email, !fullName, !subject, !message)) {
      return res.status(404).json({
        status: "fail",
        message: "Enter all details.",
      });
    }

    sendContactUsEmail({ email, fullName, subject, message, res });

    return res.status(200).json({
      status: "success",
      message: "Message sent successfully :)",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};

export const adMail = async (req, res) => {
  try {
    const { email, fullName, subject, message, page, adSize } = req.body;

    if (page == "") {
      return res.status(404).json({
        status: "fail",
        message: "Select page.",
      });
    }

    if (adSize == "") {
      return res.status(404).json({
        status: "fail",
        message: "Select Ad Size.",
      });
    }

    if ((!email, !fullName, !subject, !message)) {
      return res.status(404).json({
        status: "fail",
        message: "Enter all details.",
      });
    }

    sendAdEmail({ email, fullName, subject, message, page, adSize, res });

    return res.status(200).json({
      status: "success",
      message: "Message sent successfully :)",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Server Error!",
    });
  }
};
