import { asyncHandler } from "../utils/ayncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    message: "OK",
  });
});
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
