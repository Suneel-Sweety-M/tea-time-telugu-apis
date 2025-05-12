import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import dbConnection from "./middlewares/db.js";
import router from "./routes/index.js";
import { createJWT, createRefreshJWT } from "./middlewares/jwt.js";
import Users from "./models/userModel.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

dbConnection();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(router);

/* ======== Register With Google ======*/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await Users.findOne({ email });

        if (!user) {
          // Register a new user
          user = await Users.create({
            fullName: profile.displayName,
            email: email,
            profileUrl: profile.photos[0].value,
            role: "user",
            googleId: profile.id,
          });
        }

        // Create JWT token here
        const tokenUser = {
          _id: user._id,
          fullName: user.fullName,
          profileUrl: user.profileUrl,
          email: user.email,
          role: user.role,
        };

        const token = createJWT(tokenUser);
        const refreshToken = createRefreshJWT(tokenUser);
        user.refreshToken = refreshToken;

        done(null, { user, token });
      } catch (error) {
        console.log("Error during Google Authentication:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
/* ====================================*/

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
