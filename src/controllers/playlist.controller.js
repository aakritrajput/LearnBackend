import {Playlist} from "../models/playlist.model.js"
import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const {name, description=''} = req.body
        const user = req.user?._id
        if(!isValidObjectId(user)){
            throw new ApiError(400, "The given user id is not a valid object id !!!")
        }
    
        const playlist = await Playlist.create({
            name,
            description,
            videos : [],
            owner : user
        })
    
        if(!playlist){
            throw new ApiError(500, `error creating the ${name} playlist`)
        }
    
        res.status(201).json(new ApiResponse(201, playlist , `${name} playlist created successfully !!`))
    } catch (error) {
        throw new ApiError(500, error.message || "error creating the playlist")
    }

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
        const {userId} = req.params
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "The given user id is not a valid object id !!!")
        }
        //TODO: get user playlists
        const userPlaylists = await Playlist.aggregate([
            {
                $match : {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $unwind: "$videos"
            },
              // Step 3: Lookup to get video details from the "videos" collection
            {
              $lookup: {
                from: "videos",
                localField: "videos",  // Field from the playlist document (the video ID array)
                foreignField: "_id",   // Field in the "videos" collection to match
                as: "videoDetails"     // Name for the output array containing the video details
              }
            },
            // Step 4: Group back the video details into an array
            {
              $group: {
                _id: "$_id",  // Group by playlist ID to return the playlist document
                videos: { $push: { $arrayElemAt: ["$videoDetails", 0] } }, // Add each video's details back
                // Include any other necessary fields from the playlist document
                title: { $first: "$title" },
                description: { $first: "$description" },
                owner: {$first: "$owner"}
              }
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
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$owner"
            }
        ])
    
        if(!userPlaylists){
            throw new ApiError(500, "error getting users playlist")
        }
    
        res.status(200).json(new ApiResponse(200, userPlaylists, "Got user's playlists !!"))
   
})

const getPlaylistById = asyncHandler(async (req, res) => {
   
    //TODO: get playlist by id
    
        const {playlistId} = req.params
        if(!isValidObjectId(playlistId)){
            throw new ApiError(400, "The given playlistId is not a valid object id !!!")
        }
        
        //TODO: get user playlists
        //console.log(playlistId)
        const playlist = await Playlist.aggregate([
            {
                $match: {
                    _id : new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $unwind: "$videos"
                
            },
              // Step 3: Lookup to get video details from the "videos" collection
            {
              $lookup: {
                from: "videos",
                localField: "videos",  // Field from the playlist document (the video ID array)
                foreignField: "_id",   // Field in the "videos" collection to match
                as: "videoDetails"     // Name for the output array containing the video details
              }
            },
            // Step 4: Group back the video details into an array
            {
              $group: {
                _id: "$_id",  // Group by playlist ID to return the playlist document
                videos: { $push: { $arrayElemAt: ["$videoDetails", 0] } }, // Add each video's details back
                // Include any other necessary fields from the playlist document
                name: { $first: "$name" },
                description: { $first: "$description" },
                owner: {$first: "$owner"}
              }
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
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$owner"
            }
        ])
    
        if(!playlist){
            throw new ApiError(500, "error getting the playlist")
        }
        console.log(playlist)
        res.status(200).json(new ApiResponse(200, playlist, "Got the playlist !!"))
   

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        console.log(`playlist id: ${playlistId} and video id: ${videoId}`)
        const newPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet : {videos : videoId}
            },
            {
                new:true
            }
        )
        if(!newPlaylist){
            throw new ApiError(500, "error adding video to the playlist")
        }
    
        res.status(200).json( new ApiResponse(200, newPlaylist, "video added to the playlist"))
    } catch (error) {
        throw new ApiError(500, error.message || "error adding video to the playlist")
    }
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        const newPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } }, // Remove video2 from the array
            { new: true } 
        )
        if(!newPlaylist){
            throw new ApiError(500, "error adding video to the playlist")
        }
    
        res.status(200).json( new ApiResponse(200, newPlaylist, "video removed from the playlist"))
    } catch (error) {
        throw new ApiError(500, error.message || "error removing video from the playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
   try {
     const {playlistId} = req.params
     // TODO: delete playlist
     await Playlist.findByIdAndDelete(playlistId)
 
     res.status(200).json(new ApiResponse(200, {}, "playlist deleted successfully!!!"))
   } catch (error) {
     throw new ApiError(500, error.message || "error deleting the playlist :(")
   }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try{
       const {playlistId} = req.params
       const {name, description} = req.body
       //TODO: update playlist
       const newPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
               name,
               description,
            },
            {
                new:true
            }
    )
    if(!newPlaylist){
        throw new ApiError(500, "error updating the playlist")
    }

    res.status(200).json( new ApiResponse(200, newPlaylist, " Playlist updated successfully!!"))
} catch (error) {
    throw new ApiError(500, error.message || "error updating the playlist")
}

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}