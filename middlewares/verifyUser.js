import JWT from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const token = req.cookies.refreshToken; 
  
  if (!token) {
    return res.status(401).send({ status: "fail", message: "No token provided!" });
  }
 
  try {
    const decoded = JWT.verify(token, process.env.JWT_REFRESH_SECRET_KEY);
    req.user = { user: decoded.user };
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).send({ status: "fail", message: "Invalid or expired token!" });
  }
};

export default userAuth;
