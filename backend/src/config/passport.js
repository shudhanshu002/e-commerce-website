import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.provider = 'google';
          user.isEmailVerified = true;
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          googleId: profile.id,
          provider: 'google',
          fullName: profile.displayName,
          email: profile.emails[0].value,
          username:
            profile.emails[0].value.split('@')[0] +
            Math.floor(Math.random() * 1000),
          phoneNumber: `G-${profile.id}`, // Placeholder
          isEmailVerified: true,
        });
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);
