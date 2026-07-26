
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function (passport) {
    // Local strategy (unchanged)
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    return done(null, false, { message: 'That email is not registered' });
                }
                if (!user.password) {
                    return done(null, false, { message: 'Please log in using Google' });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'Password incorrect' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    // Google strategy 
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // If email already registered locally, link the account
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                    if (email) {
                        user = await User.findOne({ email: email.toLowerCase() });
                        if (user) {
                            user.googleId = profile.id;
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        username: profile.displayName || (email ? email.split('@')[0] : `user_${profile.id}`),
                        email: email ? email.toLowerCase() : `${profile.id}@no-email.google`
                    });

                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};

