
import { request, response } from "express";
import User from "../models/User.models.js";
import { generateToken } from "../libs/utils.js";
import dotenv from "dotenv"
import cloudinary from "../libs/cloudinary.js";
import ChatList from "../models/ChatList.model.js";
dotenv.config();

export const authGoogle = async(req , res) => {
  const { name, email, photoURL } = req.body;
 
  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        username: name,
        email: email,
        photoURL: photoURL,
      });
      await user.save();

      // ✅ Create a ChatList entry for this new user
        const newChatList = new ChatList({
          userID : user._id ,
          username: name,
           avatar: photoURL && photoURL.trim() !== "" ? photoURL : "/profile.jpg",
          email : email,
         
        });
        await newChatList.save();


    }
     //generatewebtoken
     generateToken(user._id, res);

    ;
     res.status(200).json({ msg: "User logged in", user });

  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(500).json({ msg: 'Error saving user', error: error.message });
}
}

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { username, position, company, bio, phone } = req.body;
    const userId = req.user._id;

    let updateFields = { username, position, company, bio, phone };

    if (req.file) {
      // helper function to wrap upload_stream in a promise
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'profile_pics' },  // use a meaningful folder name
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);
      updateFields.photoURL = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });
    return res.status(200).json(updatedUser);

  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
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
