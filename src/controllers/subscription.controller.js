import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
        const user = req.user?._id
    
        const toggle = await Subscription.find({
            subscriber : user ,
            channel: channelId
        })
    
        if(toggle.length){
            await Subscription.findByIdAndDelete(toggle[0]._id)
            console.log(`channel with channelId ${channelId} unsubscribed!!`)
    
            const result = {
                subscribed : false 
            }
    
            res.status(200).json(new ApiResponse(200, result , `channel with channelId ${channelId} unsubscribed!!` ))
        }else{
            await Subscription.create({
                subscriber : user,
                channel : channelId
            })
            console.log(`channel with channelId ${channelId} subscribed!!`)
    
            const result = {
                subscribed : true 
            }
    
            res.status(200).json(new ApiResponse(200, result , `channel with channelId ${channelId} subscribed!!` ))
        }
    } catch (error) {
        throw new ApiError(500, "error toggling channel subscription")
    }
    
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
        
        if(!channelId){
            throw new ApiError(400, "Please provide the valid channelId")
        }
        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel : new mongoose.Types.ObjectId(channelId),
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber",
                    pipeline:[
                        {
                            $project: {
                                _id : 1,
                                username : 1,
                                avatar : 1,
    
                            }
                        }
                    ]
                 }
            }
        ])
        const result = {
            totalSubscribers: subscribers.length,
            subscribers,
        }
        res.status(200).json(new ApiResponse(200, result, `The given channel has ${result.totalSubscribers} subscribers !!`));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error getting channel subscribers!!")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(400, "Please provide valid subscriberId")
    }
    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber : new mongoose.Types.ObjectId(subscriberId) ,
            }
        },
        {
            $lookup:{
                from:"users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline:[
                    {
                        $project: {
                            _id : 1,
                            username : 1,
                            avatar : 1,

                        }
                    }
                ]
             }
        }
    ])
    const result = {
        totalChannelsSubscribed: channels.length,
        channels,
    }
    res.status(200).json(new ApiResponse(200, result, `The given subscriber has ${result.totalChannelsSubscribed} channels subscribed !!`));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}