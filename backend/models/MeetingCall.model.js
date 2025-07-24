import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  avatar: String,
  joinTime: Date,
  leaveTime : Date,
  emotions: [String],
});

const chatMessageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});



const MeetingCallSchema = new mongoose.Schema({
  meetingId:String ,
  title: String,
  type: { type: String, enum: ["group", "1-on-1"], default: "group" },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hostname:String,
  startTime: Date,
  endTime: Date,
  duration: String,

  participants: [participantSchema],
  chatMessages: [chatMessageSchema],
    emotionAnalytics: {
    totalEmotions: { type: Number, default: 0 },
    topEmotions: [
      {
        emoji: String,
        count: Number
      }
    ]
  },

}, { timestamps: true });

const MeetingCall  =  mongoose.model("MeetingCall", MeetingCallSchema);

 export default MeetingCall ;
