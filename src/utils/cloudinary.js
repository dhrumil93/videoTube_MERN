import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // env file //
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnClound = async (localfilepath) => {
  try {
    console.log(localfilepath);
    if (!localfilepath) return null;
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
      upload_preset: "videoTube",
    });

    console.log("File uploaded on cloud", response.url);
    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    console.error(error);
    fs.unlinkSync(localfilepath); // remove the locally stored temporary file as the upload operation get failed
    return null;
  }
};

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function(error, result) {console.log(result); });

export { uploadOnClound };
