const { verify } = require("jsonwebtoken");

const isAuth = (req) => {
  const authorizatiton = req.headers["authorization"];
  if (!authorizatiton) throw new Error("You need to login");
  const token = authorizatiton.split(" ")[1];
  const { userId } = verify(token, process.env.ACCESS_TOKEN_SECRET);
  return userId;
};

module.exports= {
    isAuth
}