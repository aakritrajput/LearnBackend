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
   console.log("email:", email)
   console.log("username:", username)
   console.log("password:", password)
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
      $set: {
         refreshToken: undefined
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
   if( incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }

  try {
    const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = User.findById(decodedToken?._id)
    if(!user){
       throw new ApiError(401, "Invalid refresh token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
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
export {registerUser, loginUser, logoutUser, refreshAccessToken}
