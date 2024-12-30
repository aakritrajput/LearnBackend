import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const user = req.user._id
    const video = await Like.find({video: videoId})
    if(video.length == 0){
        const likedVideo = await Like.create({
            video: videoId,
            likedBy: user
        })

        if(!likedVideo){
            throw new ApiError(500, 'Error liking the video !!')
        }

        const data = {
            liked: true
        }

        res.status(200).json(new ApiResponse(200, data , "Video liked successfully!!"))
    }else{
        try {
            await Like.findByIdAndDelete(video[0]._id)
            const data = {
                liked: false
            }
            res.status(200).json(new ApiResponse(200, data, "Video unliked successfully!!"))
        } catch (error) {
            throw new ApiError(500, "error unliking the video !!")
        }
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const user = req.user._id
    const comment = await Like.find({comment: commentId})
    if(comment.length == 0){
        const likedComment = await Like.create({
            comment: commentId,
            likedBy: user
        })

        if(!likedComment){
            throw new ApiError(500, 'Error liking the comment !!')
        }

        const data = {
            liked: true
        }

        res.status(200).json(new ApiResponse(200, data , "comment liked successfully!!"))
    }else{
        try {
            await Like.findByIdAndDelete(comment[0]._id)
            const data = {
                liked: false
            }
            res.status(200).json(new ApiResponse(200, data, "Comment unliked successfully!!"))
        } catch (error) {
            throw new ApiError(500, "error unliking the comment !!")
        }
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const user = req.user._id
    const tweet = await Like.find({tweet: tweetId})
    if(tweet.length == 0){
        const likedTweet = await Like.create({
            tweet: tweetId,
            likedBy: user
        })

        if(!likedTweet){
            throw new ApiError(500, 'Error liking the tweet !!')
        }

        const data = {
            liked: true
        }

        res.status(200).json(new ApiResponse(200, data , "Tweet liked successfully!!"))
    }else{
        try {
            await Like.findByIdAndDelete(tweet[0]._id)
            const data = {
                liked: false
            }
            res.status(200).json(new ApiResponse(200, data, "Tweet unliked successfully!!"))
        } catch (error) {
            throw new ApiError(500, "error unliking the tweet !!")
        }
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const user = req.user._id
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(user),
                    video: {$ne: undefined}
                }
            },
            {
                $lookup: {
                    from : "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video"
                }
            },
            {
                $unwind:"$video"
            }
        ])
    
        if(!likedVideos){
            throw new ApiError(500, "error getting liked videos !!")
        }
    
        res.status(200).json(new ApiResponse(200, likedVideos, "fetched liked videos successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "error getting liked videos !!")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}