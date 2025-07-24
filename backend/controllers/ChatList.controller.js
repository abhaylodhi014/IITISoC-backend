import User from "../models/User.models.js";
import ChatList from "../models/ChatList.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    // Fetch all users from the database and exclude the password field
    const allUsers = await ChatList.find();

    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const saveuser = async (req, res) =>{
   try {
      const {userID, username, avatar, email  } = req.body;

      const newChatListItem = new ChatList({
      userID : userID,
      username : username,
      avatar: avatar || "/profile.jpg",
      email : email ,
    });
    await newChatListItem.save();

    return res.status(201).json({ message: "ChatList item saved successfully", chatList: newChatListItem });
   } catch (error) {
    console.error("Error in saveUserToChatList:", error.message);
    res.status(500).json({ message: "Internal server error" });
   }
}
