import {v2 as cloudinary} from 'cloudinary';
import { response } from 'express';
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: 'dic4znqm7',  // env file //
  api_key: '422172529123144', 
  api_secret: 'nyiagg3z7mU9qt7wwpuDP0oi8IE' 
});

const uploadOnClound = async(localfilepath) => {
  try {
    if(!localfilepath) return null
    const response = await cloudinary.uploader.upload ( localfilepath , {
      resource_type : "auto"
    })
    console.log("File uploaded on cloud" , response.url); 
    return response
    
  } catch (error) {
    fs.unlinkSync(localfilepath) // remove the locally stored temporary file as the upload operation get failed
    return null
  }
}

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });

export {uploadOnClound}