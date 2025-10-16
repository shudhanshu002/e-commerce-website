import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';


const generateTokensAndSetCookies = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        },
        'Login successful',
      ),
    );
};

// ---  Auth Controllers ---
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password, phoneNumber } = req.body;
  if (
    [fullName, username, email, password, phoneNumber].some(
      (f) => !f || f.trim() === '',
    )
  ) {
    throw new ApiError(400, 'All fields are required');
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }, { phoneNumber }],
  });
  if (existedUser)
    throw new ApiError(
      409,
      'User with this email, username, or phone number already exists',
    );

  const user = new User({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    phoneNumber,
    provider: 'local',
  });
  const emailOtp = user.generateVerificationToken();
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your E-Commerce account',
      html: `<h1>Your verification OTP is: ${emailOtp}</h1>`,
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw new ApiError(
      500,
      'Failed to send verification email. Please try registering again.',
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { userId: user._id },
        'Registration successful. Please check your email for a verification OTP.',
      ),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');

  const user = await User.findOne({
    email,
    emailVerificationToken: otp,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired OTP');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        'Email verified successfully. You can now log in.',
      ),
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email)
    throw new ApiError(400, 'Username or email is required');

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new ApiError(404, 'User not found');
  if (!user.isEmailVerified)
    throw new ApiError(403, 'Please verify your email before logging in.');
  if (user.provider !== 'local')
    throw new ApiError(400, `Please log in using ${user.provider}.`);

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

  return generateTokensAndSetCookies(user, res);
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

const googleAuthCallback = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Google authentication failed');
  return generateTokensAndSetCookies(req.user, res);
});

// --- Password Management Controllers ---
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found with this email');

  const resetToken = user.generateForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  // This URL will be handled by your frontend application
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      html: `<h1>Password Reset Request</h1><p>You have requested a password reset. Click this <a href="${resetUrl}" target="_blank">link</a> to reset your password. This link is valid for 10 minutes.</p>`,
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, {}, 'Password reset token sent to your email.'),
      );
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Email could not be sent. Please try again later.');
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) throw new ApiError(400, 'New password is required.');

  // Hash the token from the URL to match the one in the database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token.');
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        'Password has been reset successfully. You can now log in.',
      ),
    );
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  googleAuthCallback,
  forgotPassword,
  resetPassword,
};
