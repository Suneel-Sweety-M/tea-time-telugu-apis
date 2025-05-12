import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

export const hashString = async (useValue) => {
  const salt = await bcrypt.genSalt(10);

  const hashedpassword = await bcrypt.hash(useValue, salt);
  return hashedpassword;
};

export const compareString = async (password, userPassword) => {
  const isMatch = await bcrypt.compare(password, userPassword);
  return isMatch;
};

//JSON WEBTOKEN
export function createJWT(user) {
  return JWT.sign({ user }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1h",
  });
}

export function createRefreshJWT(user) {
  return JWT.sign({ user }, process.env.JWT_REFRESH_SECRET_KEY, {
    expiresIn: "90d",
  });
}
