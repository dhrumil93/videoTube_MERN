import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnClound } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
import { mongoose } from "mongoose";

const generateRefreshAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "Something Went Wrong !!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  console.log("email :", email);

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsoray");
  }
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "AvatarPath Not Found");
  }
  const avatar = await uploadOnClound(avatarLocalPath);
  const coverImage = await uploadOnClound(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(404, "AVATAR not found");
  }

  const user = await User.create({
    fullname: fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
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
//   $or: [{ userName }, { email }],
// });
// if (existedUser) {
//   throw new apiError(409, "User Already exist");
// }

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, " userName or Email required !!");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Enter right credentials");
  }
  const { refreshToken, accessToken } = await generateRefreshAccessToken(
    user._id
  );

  const loggedInuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInuser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully!!"
      )
    );
});
const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged OUT!!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request!!");
  }

  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token!!");
    }

    if (incomingRefreshToken !== user?._refreshToken) {
      throw new ApiError(401, "Refresh Token is expired !");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await generateRefreshAccessToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshAccessToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Please Enter correct password!!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "PassWord Changed Succefully !!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current User Fetch Successfully!!");
});

const updateAccDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Fullname / Email is Required !!");
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Account Details Updated !!"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File Not Found !!");
  }

  const avatar = await uploadOnClound(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cloudinary");
  }
  const usesr = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "Avatar Updated Succefully!!");
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image Not Found !!");
  }

  const avatar = await uploadOnClound(coverImageLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "CoverImage Updated Succefully!!");
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "UserName is Missing!!");
  }
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        cpverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel Not Found !!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel Fetched Successfully!!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched Succesfully!!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAvatar,
  updateAccDetails,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

/*
User details from front end
validation on backend - not null
if user is already registered : email , userName
check for images and avatar
upload on cloudinary
create user object entry in db
remove password and refresh token
user creation
return response

 */

/*
req.body -> data
userName , email based login
find / match the user
check the password 
access / refresh token
send cookie
*/
