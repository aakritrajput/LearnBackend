import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    try {
        const {channelId} = req.params
        const totalSubscribers = await Subscription.countDocuments({
            channel : channelId
        })
        const VideosOnChannel = await Video.aggregate([
            {
                $match : {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $project:{
                    '_id':1
                }
            }
        ]);
        console.log(VideosOnChannel)
        const allVideos = [];
        VideosOnChannel.map((video)=>{allVideos.push(video._id)})
        console.log("all videos:", allVideos)
        const totalLikesOnAllVideos = await Like.countDocuments({
            video : { $in : allVideos}
        })
    
        const stats = {
            totalSubscribers,
            totalVideos : allVideos.length,
            totalLikesOnAllVideos
        }
    
        res.status(200).json(new ApiResponse(200, stats, "fetched channel statistics successfully!!"))
    } catch (error) {
        throw new ApiError(500, error.message || "error getting channel statistics !!!")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
        const {channelId} = req.params
        const videos = await Video.find({
            owner: channelId
        })
        res.status(200).json(new ApiResponse(200, videos, "channel videos fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "error fetching channel videos !!")
    }

})

export {
    getChannelStats, 
    getChannelVideos
    }