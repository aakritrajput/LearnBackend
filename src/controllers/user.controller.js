import {asyncHandler} from '../utils/asyncHandler.js';   
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessTAndRefreshToken = async(userId) => {
   const user = await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   try {
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})
   } catch (error) {
      throw new ApiError(500, "Failed to generate access token and refresh token")
   }

   return{accessToken, refreshToken}
}

const registerUser = asyncHandler(async (req, res)=> {
   // get user details from frontend ...
   // validation!! --not empty
   // check if user already exist: username, email
   // check for images, check for avatar 
   // upload them to cloudinary, avtaar4555555
   // create a user object - create entry in db
   // remove password and refresh token field from response 
   // check for user creation 
   // return response


   //data can be found in request 
   const {fullName,email, username, password} = req.body
   console.log("email:", email)

   if(
    [fullName, email, username, password].some((field) => field.trim() === "")
   ){
    throw new ApiError(400, "Full Name is required")
   }

   const existedUser = await User.findOne({
      $or: [{ email }, { username }]
   })
   if(existedUser){
      throw new ApiError(409, "User with this email or username already exist")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required !!")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(500, "Failed to upload image on cloudinary")
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      username: username.toLowerCase(),
      password
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
   // req body-> data
   //username, email
   //find the user
   //compare password
   //access token, refresh token => genrate thme and send both of them to users 
   //send in cookios 
   //return response=> successfully login 

   const {email, username, password} = req.body
   if(!email && !username){
      throw new ApiError(400, "Email or username is required")
   }

   const user = await User.findOne({$or: [{email},{username}]})
   console.log(user)

   if(!user){
      throw new ApiError(404, "User does not exist")
   }

   const isPasswordCorrect = await user.isPasswordCorrect(password)

   if(!isPasswordCorrect){
      throw new ApiError(401, "Invalid user credentials")
   }

   const {accessToken, refreshToken} = await generateAccessTAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {  // cookies can not be modified by frontend but only from the server by this setting or options 
      httpOnly: true,
      secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"))


})

const logoutUser = asyncHandler(async (req, res) => { 
   // remove the refresh token from the user
   // remove the refresh token from the cookies
   // send response
  await User.findByIdAndUpdate(
   req.user._id, 
   {
      $unset: {
         refreshToken: 1 //this removes the field from the document
      }
   },
   {
      new: true
   }
  )
  const options = {  // cookies can not be modified by frontend but only from the server by this setting or options 
   httpOnly: true,
   secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out"))
 })

const refreshAccessToken = asyncHandler(async (req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if( !incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }

  try {
    const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
    )

    console.log(decodedToken)
    
    const user = await User.findById(decodedToken._id)

    console.log("user:", user)
    console.log("user refresh token :", user.refreshToken, "incoming refresh token:", incomingRefreshToken)
    if(!user){
       throw new ApiError(401, "Invalid refresh token")
    }
 
    if(incomingRefreshToken !== user.refreshToken){
       throw new ApiError(401, "refresh token is expired or used")
    }
 
    const options = {
       httpOnly: true,
       secure: true
    }
 
    const {accessToken, newRefreshToken} = await generateAccessTAndRefreshToken(user._id)
 
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed successfully"))
    
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)  // ? means optionally checks 
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
      throw new ApiError(401, "Invalid old password")
   }
   user.password = newPassword;
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(ApiResponse(200, {}, "Password changed successfully"))
})

const getcurrentUser = asyncHandler(async(req, res)=>{
   return res
   .status(200)
   .json (new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
   const {fullName, email} = req.body
   //console.log(`fullname ${fullName}, and email is ${email}`)
   if(!fullName && !email){
      throw new ApiError(400, "All fields are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email
         }
      },
      {
         new:true    // by this parameter the info after update is returned 
      }
   ).select("-password ")

   //console.log(user)

   res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
      throw new ApiError(500, "Failed to upload image on cloudinary")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, " Avatar image updated successfully")
   )
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath){
      throw new ApiError(400, "Cover Image file is required")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
      throw new ApiError(500, "Failed to upload cover image on cloudinary")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, " Cover image updated successfully")
   )
})

const getchannelProfile = asyncHandler(async(req, res)=>{
   const {username} = req.params
   
   if(!username?.trim){
      throw new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },
      {
         $addFields:{
            subscribersCount: {
               $size: "$subscribers"
            },
            channelsSubscribedToCount: {
               $size: "$subscribedTo"
            },
            isSubscribed:{
               $cond: {
                  if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                  then: true,
                  else: false
               }
            }
         }
      },
      {
         $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
      }
   ])

   if(!channel?.length){
      throw new ApiError(404, "channel does not exist")
   }

   return res.status(200).json( new ApiResponse(200, channel[0],"User channel fetched successfully"))

   //console.log(channel)
})

const getWatchHistory = asyncHandler(async(req, res)=> {
   const user = await User.aggregate([
      {
         $match:{                    // got the particular user who's history is being studied or watched 
            _id: new mongoose.Types.ObjectId(req.user?._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localfield: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
               {
                  $lookup: {
                     from : "users",
                     localField: "owner",
                     foreignField: "_id",
                     as: "owner",
                     pipeline: [
                        {
                           $projects: {
                              fullName: 1,
                              username: 1,
                              avatar: 1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner: {
                        $first: "$owner"
                     }
                  }
               }
            ]
         }
      }
   ])
   return res
   .status(200)
   .json(
      new ApiResponse(
         200,
         user[0].watchHistory,
         "Watch history fetched successfully"
      )
   )
})

export {
   registerUser, 
   loginUser, 
   logoutUser, 
   refreshAccessToken,
   changeCurrentPassword,
   getcurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getchannelProfile,
   getWatchHistory
}
