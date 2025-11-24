// Simple multer middleware to parse multipart/form-data for image uploads
import multer from "multer";


const storage = multer.memoryStorage();
const upload = multer({ storage });


export default upload; // use as middleware upload.single('image') or upload.array('images')