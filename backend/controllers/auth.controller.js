import cloudinary from "../libs/cloudinary.js";
import { generateToken } from "../libs/util.js";
import UserModel from "../models/User.model.js";
import bcryptjs from "bcryptjs";

export const Signup = async (req, res) => {
  try {
    const { email, username, password, avatar } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Please enter your information",
      });
    }
    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }
    const salt = await bcryptjs.genSalt(10);
    // hash: pass, salt
    const hassPassword = await bcryptjs.hash(password, salt);
    const newUser = new UserModel({ username, email, password: hassPassword });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        message: "User registed successfully",
      });
    }
  } catch (err) {
    console.error(err.message);
  }
};

export const Signin = async (req, res) => {
  const { email, password } = req.body;
  const reg =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  const isCheckMail = reg.test(email);
  if (!email || !password) {
    return res.status(400).json({
      message: "Please enter your information",
    });
  } else if (!isCheckMail) {
    return res.status(400).json({
      message: "Email is not valid",
    });
  }
  try {
    const checkUser = await UserModel.findOne({ email });

    if (!checkUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcryptjs.compare(
      password,
      checkUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Password is invalid" });
    }

    const accessToken = generateToken(checkUser._id, res);

    res.status(200).json({
      _id: checkUser._id,
      fullName: checkUser.fullName,
      email: checkUser.email,
      avatar: checkUser.avatar,
      message: "User login successfully",
      accessToken,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const Signout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    // console.log(avatar);

    const userId = req.user._id;
    if (!avatar) {
      return res.status(400).json({ message: "Profile pic is required" });
    }
    const uploadResponse = await cloudinary.uploader.upload(avatar);
    const updateUser = await UserModel.findByIdAndUpdate(
      userId,
      { avatar: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json({
      updateUser,
      message: "Update avatar successfully",
    });
  } catch (error) {
    console.log("Error in upate avatar controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
