
import MeetingCall from "../models/MeetingCall.model.js";

// Create a new meeting
export const createMeeting = async (req, res) => {
  try {
     const { title ,type } = req.body;
     const userId = req.user._id;
     const meetingId = req.params.id;
    const meeting = new MeetingCall({
      meetingId,
      title,
      type: type || "group",
      host: userId,
      hostname: req.user.username,
      startTime: new Date(),
      participants: [
        {
          userId,
          name: req.user.username,
          avatar: req.user.photoURL || "/profile.jpg",
          joinTime: new Date(),
          emotions: [],
        },
      ],
      emotionAnalytics: {
        totalEmotions: 0,
        topEmotions: [],
      },
      chatMessages: [
        {
          sender: req.user.username,
          message: "Hi everyone 👋",
          createdAt: new Date(),
        }
      ],
    });
     await meeting.save();
    res.status(200).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Server error creating meeting" });
  }
};

// Get meeting by ID
export const getMeetingById = async (req, res) => {
  try {
    const meeting = await MeetingCall.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.status(200).json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Server error fetching meeting" });
  }
};


// Add participant to meeting
export const addParticipant = async (req, res) => {
  try {
     const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await MeetingCall.findOne({ meetingId });

    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    
    // Add user if not already participant
   const alreadyParticipant = meeting.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    if (!alreadyParticipant) {

      meeting.participants.push({ 
        userId, 
        name: req.user.username, 
        avatar: req.user.photoURL, 
        joinTime: new Date(),
        emotions: [],
       });
      await meeting.save();
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ message: "Server error adding participant" });
  }
};


// add leave time of participant 
// Add leave time of participant 
export const addleaveTime = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await MeetingCall.findOne({ meetingId });

    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const participant = meeting.participants.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found in this meeting" });
    }

    // ✅ Set leaveTime
    participant.leaveTime = new Date();

    // ✅ Save the meeting
    await meeting.save();

    res.json({ message: "Leave time updated", leaveTime: participant.leaveTime });

  } catch (error) {
    console.error("Error adding leave time:", error);
    res.status(500).json({ message: "Server error adding leave time" });
  }
};



// Add chat message to meeting
export const addMessage = async (req, res) => {
  try {
   const meetingId = req.params.id;
    const { message } = req.body;
    
    const meeting = await MeetingCall.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

      const newMsg = {
    sender: req.user.username,
    message,
    createdAt: new Date(), // ✅ set timestamp explicitly
  };
    meeting.chatMessages.push(newMsg);
    await meeting.save();
 
   // emit socket event if needed
   req.io?.to(meetingId).emit("newChatMessage", newMsg);

    res.json(newMsg);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: "Server error adding message" });
  }
};

// Add emotion to emotionAnalytics
export const addEmotion = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { emoji } = req.body;
    const userId = req.user._id;  

     const meeting = await MeetingCall.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
   
        // Find participant & add emotion
    const participant = meeting.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    if (participant) {
      participant.emotions.push(emoji);
    }

    // Increase totalEmotions
    meeting.emotionAnalytics.totalEmotions = (meeting.emotionAnalytics.totalEmotions || 0) + 1;

    // update topEmotions count
    const topEmoji = meeting.emotionAnalytics.topEmotions.find(e => e.emoji === emoji);
    if (topEmoji) {
      topEmoji.count += 1;
    } else {
      meeting.emotionAnalytics.topEmotions.push({ emoji, count: 1 });
    }

    await meeting.save();
     res.json({ message: "Emotion added", topEmotions: meeting.emotionAnalytics.topEmotions });

  } catch (error) {
    console.error("Error adding emotion:", error);
    res.status(500).json({ message: "Server error adding emotion" });
  }
};

export const getMeetingsForUser = async (req, res) => {
  try {
    // Assuming you have userId from req.user injected by auth middleware
    const userId = req.user.id;

    // Find meetings where participants include this userId
    const meetings = await MeetingCall.find({ "participants.userId": userId })
      .sort({ createdAt: -1 }); // optional: newest first

    res.json(meetings);
  } catch (error) {
    console.error("Error fetching user's meetings:", error);
    res.status(500).json({ message: "Server error fetching your meetings" });
  }
};
