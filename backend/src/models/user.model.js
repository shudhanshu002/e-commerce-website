import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    provider: { type: String, required: true, default: 'local' },
    googleId: { type: String },
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === 'local';
      },
    },
    phone: { type: String, sparse: true, unique: true }, // Sparse allows multiple nulls
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    refreshToken: String,
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.provider !== 'local') return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  if (this.provider !== 'local' || !this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

userSchema.methods.generateVerificationToken = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationToken = otp;
  this.emailVerificationTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

userSchema.methods.generateForgotPasswordToken = function () {
  // Generate a random, more secure token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.forgotPasswordTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken; // Return the unhashed token to be sent via email
};

export const User = mongoose.model('User', userSchema);
