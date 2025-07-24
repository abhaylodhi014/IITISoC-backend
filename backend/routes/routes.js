import express from 'express';

import { authGoogle , updateProfile , checkAuth ,logout} from '../controllers/User.controller.js';

import { newContactUs } from '../controllers/ContactUs.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.js';
import { getUsersForSidebar ,saveuser } from '../controllers/ChatList.controller.js';
import { getMessages , sendMessage  , } from '../controllers/Chat.controller.js';
const router = express.Router();
import { addParticipant , addEmotion , addMessage , createMeeting , getMeetingById , getMeetingsForUser ,addleaveTime} from '../controllers/MeetingCall.controller.js';

// routes for signin
router.post('/google-auth' , authGoogle);
router.put("/updateProfile" , protectRoute ,upload.single('file') , updateProfile)

router.get("/check", protectRoute, checkAuth);
router.post("/logout" , logout);



// routes related to chat 
router.get("/chatlist" ,getUsersForSidebar);

router.post("/saveuser" , saveuser);
router.get("/create/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);


//routes for contactus
router.post('/contactUs' , newContactUs);

//routes for meeting chat


//routes for meetings
router.post("/createmeeting/:id",protectRoute , createMeeting);
router.get("/getmeetings/:id",protectRoute , getMeetingById);


router.put("/meeting/add-participant/:id", protectRoute ,addParticipant);
router.put("/meeting/add-leaveTime/:id", protectRoute ,addleaveTime);

router.put("/meeting/add-message/:id", protectRoute, addMessage);
router.put("/meeting/add-emotion/:id",protectRoute, addEmotion);
router.get("/usermeetings" , protectRoute , getMeetingsForUser);
export default router;