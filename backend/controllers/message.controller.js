import cloudinary from "../libs/cloudinary.js";
import { getReceiverSocketId, io } from "../libs/socket.js";
import MessageModel from "../models/Message.model.js";
import UserModel from "../models/User.model.js";

// lấy danh sách người dùng để hiển thị trên sidebar, ngoại trừ tài khoản đang đăng nhập
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    /*
    Tìm tất cả người dùng trong database
    Sử dụng MongoDB query { _id: { $ne: loggedInUserId } }:
    $ne (not equal): Loại bỏ người dùng có _id trùng với loggedInUserId.
    .select("-password"):
Không trả về trường password (bảo mật thông tin tài khoản).
    */
    const filterUsers = await UserModel.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filterUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//lấy danh sách tin nhắn giữa người dùng hiện tại và một người dùng khác trong cuộc trò chuyện
export const getMessages = async (req, res) => {
  try {
    // Lấy ID của người muốn chat (userToChatId) từ request params (req.params).
    const { id: userToChatId } = req.params;

    //ID của người đang đăng nhập
    const myId = req.user._id;

    /*
    Message.find({...}): Tìm tất cả tin nhắn giữa người đang đăng nhập (myId) và người được chat (userToChatId).
    Sử dụng $or: Lấy tin nhắn mà:
    + Người đăng nhập (myId) là người gửi, và người chat (userToChatId) là người nhận.
    + Hoặc ngược lại: userToChatId là người gửi, myId là người nhận.
    */
    const messages = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    // Lấy nội dung tin nhắn (text) và ảnh (image) từ request body.
    const { text, image } = req.body;

    //Lấy ID của người nhận từ URL
    const { id: receiverId } = req.params;

    // Lấy ID của người gửi từ req.user._id
    const senderId = req.user._id;

    // Xử lý ảnh
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new MessageModel({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
