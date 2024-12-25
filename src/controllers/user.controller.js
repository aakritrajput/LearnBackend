import {asyncHandler} from '../utils/asyncHandler.js';   
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';



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

   const existedUser = User.findOne({
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
      username: username.toLowercase(),
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

export {registerUser}