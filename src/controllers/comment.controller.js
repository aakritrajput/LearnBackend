import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const offset = (Number(page) - 1)*Number(limit)
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from : 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            _id:1,
                            username:1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $skip: offset
        },
        {
            $limit : Number(limit)
        }
    ])

    if(!comments){
        throw new ApiError(500, " Error getting video comments !!")
    }

    res.status(200).json( new ApiResponse(200, comments, `successfully fetched ${limit} documents for page ${page}`))
})

const addComment = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        const {content} = req.body
        const user = req.user._id
        
        const comment = await Comment.create({
            content,
            video: videoId,
            owner: user
        })
    
        if(!comment){
            throw new ApiError(500, "error adding comment to the video")
        }
    
        res.status(201).json(new ApiResponse(201, comment, "successfully commented on the video !!"))
    } catch (error) {
        throw new ApiError(500, error.message || "error adding comment to the video")
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },
        {
            new: true
        }
    )

    if(!comment){
        throw new ApiError(500, "Error updating the comment !!")
    }

    res.status(200).json( new ApiResponse(200, comment, "comment successfully updated !!"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    try {
        const {commentId} = req.params
        await Comment.findByIdAndDelete(commentId)
        res.status(200).json( new ApiResponse(200, {}, "comment deleted successfully !!"))
    } catch (error) {
        throw new ApiError(500, "Error deleting the comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }