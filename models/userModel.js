import mongoose from "mongoose";

//schema
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "First Name is Required!"],
    },
    email: {
      type: String,
      required: [true, "Email is Required!"],
      unique: true,
    },
    number: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    password: {
      type: String,
    },
    profileUrl: {
      type: String,
      default:
        "https://res.cloudinary.com/demmiusik/image/upload/v1711703262/s66xmxvaoqky3ipbxskj.jpg",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetToken: String,
    resetTokenExpires: Date,
  },
  { timestamps: true, default: 0 }
);

const Users = mongoose.model("Users", userSchema);

export default Users;
