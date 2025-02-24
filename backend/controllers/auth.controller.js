import cloudinary from "../libs/cloudinary.js";
import { generateToken } from "../libs/util.js";
import UserModel from "../models/User.model.js";
import bcryptjs from "bcryptjs";
import axios from "axios";

export const verifyCaptcha = async (captchaToken) => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY, // Lấy từ file .env
          response: captchaToken,
        },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return false;
  }
};

export const Signup = async (req, res) => {
  try {
    const { email, username, password, avatar, recaptchaToken } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!email || !username || !password) {
      return res.status(400).json({ message: "Please enter your information" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (!recaptchaToken) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    // Xác minh Google reCAPTCHA
    const captchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY, // Lấy từ .env
          response: recaptchaToken, // Sửa lại cho đúng tên biến
        },
      }
    );

    if (!captchaRes.data.success) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Tạo user mới
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        message: "User registered successfully",
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const Signin = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  //console.log("Received reCAPTCHA token:", recaptchaToken);

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter your information" });
  }

  // Kiểm tra token reCAPTCHA trước khi tiếp tục
  const isCaptchaValid = await verifyCaptcha(recaptchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Captcha verification failed" });
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
      username: checkUser.username,
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
    res.clearCookie("jwt");
    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);
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

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    if (!userData) {
      return res.status(400).json({ message: "Please fill your information" });
    }
    const updateUser = await UserModel.findByIdAndUpdate(id, userData, {
      new: true,
    });

    res.status(200).json({
      updateUser,
      message: "Update user info successfully",
    });
  } catch (error) {
    console.log("Error in update user controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, newPass, confirmNewPass } = req.body;
    if (newPass !== confirmNewPass) {
      return res.status(400).json({ message: "New passwords do not match" });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const salt = await bcryptjs.genSalt(10);
    // hash: pass, salt
    const hassPassword = await bcryptjs.hash(newPass, salt);
    user.password = hassPassword;
    await user.save();
    res.status(200).json({
      message: "Update password successfully",
    });
  } catch (error) {
    console.log("Error in update password controller", error.message);
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
