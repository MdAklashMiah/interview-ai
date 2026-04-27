const jwt = require("jsonwebtoken");
const blacklistTokenModel = require("../models/blacklist.model");

async function authUserMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, token not found" });
  }

  const isTokenBlacklisted = await blacklistTokenModel.findOne({ token });

  if (isTokenBlacklisted) {
    return res.status(401).json({ message: "Unauthorized, token is invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized, invalid token" });
  }

}

module.exports = authUserMiddleware;