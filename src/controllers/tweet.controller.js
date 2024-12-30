import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    try {
        const user = req.user._id
        const {content} = req.body
    
        const tweet = await Tweet.create({
            content,
            owner: user
        })
    
        if(!tweet){
            throw new ApiError(500 , "error creating tweet !!")
        }
        
        res.status(201).json(new ApiResponse(201, tweet, "tweet created successfully!!"))
    } catch (error) {
        throw new ApiError(500 , error.message || "error creating tweet !!")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const user = req.user._id
    const tweets = await Tweet.find(
        {
            owner: user
        }
    )
    if(!tweets){
        throw new ApiError(500, "error getting user tweets !!")
    }
    res.status(200).json(new ApiResponse(200, tweets, "successfully fetched user's tweets"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
   try {
     const {tweetId} = req.params
     const {content} = req.body
 
     const updatedTweet = await Tweet.findByIdAndUpdate(
         tweetId,
         {
             content,
         },
         {
             new: true,
         }
     )
 
     if(!updateTweet){
         throw new ApiError(500, "error updating the tweet")
     }
 
     res.status(200).json(new ApiResponse(200, updatedTweet, "tweet updated successfully !!"))
   } catch (error) {
       throw new ApiError(500, error.message || "error updating the tweet")
   }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const {tweetId} = req.params
        await Tweet.findByIdAndDelete(tweetId)
        res.status(200).json(new ApiResponse(200, {}, "tweet deleted successfully !!"))
    } catch (error) {
        throw new ApiError(500, error.message || "error deleting the tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}