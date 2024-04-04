import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnClound } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("email :", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsoray");
  }
  console.log(req.files);
  const avatarPath = req.files?.avatar[0]?.path;

  const coverImagePath = req.files?.coverImage[0]?.path;

  if (!avatarPath) {
    throw new ApiError(404, "AvatarPath Not Found");
  }
  const avatar = await uploadOnClound(avatarPath);
  const coverImage = await uploadOnClound(coverImagePath);

  if (!avatar) {
    throw new ApiError(404, "AVATAR not found");
  }

  const userDetail = await User.create({
    fullname: fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    userName: username.toLowerCase(),
  });

  const createdUser = await userDetail.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Succesfully!!"));
});

// const existedUser = User.findOne({
//   $or: [{ username }, { email }],
// });
// if (existedUser) {
//   throw new apiError(409, "User Already exist");
// } 

export { registerUser };

/*
User details from front end
validation on backend - not null
if user is already registered : email , username
check for images and avatar
upload on cloudinary
create user object entry in db
remove password and refresh token
user creation
return response

 */
