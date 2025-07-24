import multer from 'multer';

  // Import the configured Cloudinary instance

// Multer storage configuration (we'll use memory storage so we can upload directly to Cloudinary)
const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads'); // Temporary local folder
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uuidv4() + ext);
//   }
// });

const upload = multer({ storage: storage });
export default upload;

