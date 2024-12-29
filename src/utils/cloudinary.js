import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import { ApiError } from './ApiError.js';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload the file on cloudenary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been uploaded successfully
        //console.log("File uploaded successfully on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // taaki local file delete ho jaye agar error aata hai aur faltu ka space na le 
        console.log(` error uploading on cloudenary ${error}`)
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        const extractPublicId = (url) => { 
            const urlParts = url.split('/'); 
            const fileNameWithExt = urlParts[urlParts.length - 1]; // e.g., sample.jpg 
            const fileName = fileNameWithExt.split('.')[0]; // e.g., sample 
            return fileName; 
            }; 

            //const url = 'https://res.cloudinary.com/your-cloud-name/image/upload/v1618393423/sample.jpg'; 
            // console.log("url :",url)
            const publicId = extractPublicId(url); 
            //console.log("publicId :", publicId)
            cloudinary.uploader.destroy(publicId, function(result) { 
                console.log(result); 
            });
    } catch (error) {
        throw new ApiError(500, "unable to delete video from cloudinary")
    }
}

export {uploadOnCloudinary, deleteFromCloudinary};
