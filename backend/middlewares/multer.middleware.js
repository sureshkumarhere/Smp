import multer from "multer";

 const multerUploader = multer({
    limits: {
        fileSize: 1024 * 1024 * 5 , // max size of uploadable file is 5 mb
    }
 })


const singleAvatar = multerUploader.single("avatar");


export { singleAvatar };