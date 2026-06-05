import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn('⚠️  Google OAuth chưa cấu hình — bỏ qua Google Strategy');
    return;
  }

  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

  console.log(`🔐 Google OAuth callback URL: ${callbackURL}`);
  console.log('   → Thêm URI này vào Google Cloud Console → Credentials → Authorized redirect URIs');

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) {
            return done(new Error('Google không cung cấp email'), null);
          }

          const googleId = profile.id;
          const name =
            profile.displayName?.trim() ||
            profile.name?.givenName ||
            email.split('@')[0];
          const avatar = profile.photos?.[0]?.value || null;

          let user = await User.findOne({ googleId });

          if (!user) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = googleId;
              if (!user.avatar && avatar) user.avatar = avatar;
              if (!user.name && name) user.name = name;
              await user.save();
            } else {
              user = await User.create({
                email,
                name,
                avatar,
                googleId,
                role: 'student',
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}
