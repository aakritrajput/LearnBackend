//import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
//import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };
        const matchQuery = JSON.parse(query);
        console.log(matchQuery)
        const sort = {
            [sortBy] : sortType === 'asc' ? 1 : -1 
        }
    
        const aggregate = await Video.aggregate([
            {
                $match: matchQuery
            },
            {
                $lookup : {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner',
                    pipeline: [
                        {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            _id: 0
                        }}
                    ]
                }
            },
            {
                $sort: sort ,
            }
            
        ]);
    
        if(!aggregate.length){
            console.log(aggregate.length)
            throw new ApiError(404, " no videos found")
        }
    
        const videos = await Video.aggregatePaginate(aggregate, options)

        const result = { 
            totalDocs: videos.totalDocs, 
            totalPages: videos.totalPages, 
            page: videos.page, 
            limit: videos.limit, 
            docs: videos.docs, 
        }
    
        return res.status(201).json(new ApiResponse(201, result , "Video's fetched successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Unable to get the videos")
    }

})

const publishVideo = asyncHandler(async (req, res) => {
    // console.log('Request received'); 
    // console.log('Files:', req.files); 
    // console.log('Body:', req.body);
    const { title, description} = req.body
    //const userId = req.user?._id;

    //console.log(req.files)
    
    const videoLocalPath = req.files?.video[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(500, " didn't get the video path from multer middleware")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(500, " didn't get the thumbnail path from multer middleware")
    }

    const videoOnCloud = await uploadOnCloudinary(videoLocalPath)
    if(!videoOnCloud){
        throw new ApiError(500, " unable to upload video on cloudenary")
    }
    const thumbnailOnCloud = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailOnCloud){
        throw new ApiError(500, " unable to upload thumbnail on cloudenary")
    }


    const video = await Video.create({
        title,
        description,
        videoFile: videoOnCloud.url,
        thumbnail: thumbnailOnCloud.url,
        duration: videoOnCloud.duration,
        isPublished: true
    })

    if(!video){
        throw new ApiError(500, "Something went wrong while publishing the video")
    }

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "invalid video id")
    }

    res.status(200).json( new ApiResponse(200, video , " fetched the video by id "))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body;
    console.log('Request received'); 
    console.log('Files:', req.files); 
    console.log('File:', req.file); // For single file uploads console.log('Body:', req.body);
    const newThumbnailLocalPath = req.file?.path;
    //console.log(req.files)
    console.log(newThumbnailLocalPath)
    if(newThumbnailLocalPath){
        const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
        if(!newThumbnail){
            throw new ApiError(500, "error uploading new thumbnail to cloud")
        }

        const video = await Video.findById(videoId);

        const updatedFields = {
            title,
            description,
            thumbnail: newThumbnail.url
        }

        Object.keys(updatedFields).forEach((key) =>{
            if(updatedFields[key] !== undefined){
                video[key] = updatedFields[key];
            }
        });

        await video.save()
        console.log("fields updated successfully")

        res.status(202).json(new ApiResponse(202, video, "video details upddated successfully"))
    }
    
    if(!(title || description)){
        throw new ApiError(400, "Atleast one of the update is needed !!")
    }
    const video = await Video.findById(videoId);

    const updatedFields = {
        title,
        description
    }

    Object.keys(updatedFields).forEach((key) =>{
        if(updatedFields[key] !== undefined){
            video[key] = updatedFields[key];
        }
    });

    await video.save()
    console.log("fields updated successfully")

    res.status(202).json(new ApiResponse(202, video, "video details upddated successfully"))
    

    //TODO: update video details like title, description, thumbnail
    // const video = await Video.findByIdAndUpdate(
    //     videoId,
    //     {
    //         $set: {
    //            title,
    //            description,
    //            thumbnail,
    //         }
    //      },
    //      {
    //         new:true    // by this parameter the info after update is returned 
    //      }
    // )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "error deleting the video")
    }
    res.status(200).json( new ApiResponse(200, deletedVideo, "Video deleeeted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(500, "unable to find the video ")
        }
        //console.log(`video.owner: ${video.owner} and req.user._id : ${req.user._id}`)
        if(video.owner.toString() === req.user._id.toString()){
            if(video.isPublished == true){
            video.isPublished = false
            await video.save()
            //console.log(`toggled to false from true`)
           }else{
            video.isPublished = true
            await video.save()
            //console.log(`toggled to true from false`)
           }
           res.status(200).json(new ApiResponse(200, video, "successfully toggled the published status !!"))
           //console.log("response genarated !!")
        }else{
            res.status(500).json(new ApiError(500, "unauthorised to toggle the publish for this video"))
            //throw new ApiError(401, "unauthorised to toggle the publish for this video")
        }
        
        
    } catch (error) {
        //console.log("error:", error)
        throw new ApiError(500, " error toggling the publish status")
    }
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}