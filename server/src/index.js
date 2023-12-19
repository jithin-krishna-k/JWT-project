require("dotenv/config");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("./tokens.js");

const { fakeDB } = require("./fakeDB.js");
const { isAuth } = require("../src/isAuth");

// 1. Register a user
// 2. Login a user
// 3. Logout a user
// 4. Setup a protected route
// 5. Get a new accesstoken with a refresh token

const app = express();
const PORT = process.env.PORT || 4000;
//Use express middleware for easier cookie handling
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

//Needed to be able to read body data
app.use(express.json()); //to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); //to support URL-encoded bodies

//Home page
app.get("/", (req, res) => {
  res.status(200).json("Welcome To Home Page!");
  console.log("Home Page!");
});

// 1. Register a user
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if the user exist
    const user = fakeDB.find((user) => user.email === email);
    if (user) throw new Error("User already exist");
    // 2. If not user exist already, hash the password
    const hashedPassword = await hash(password, 10);
    // 3. Insert the user in "Database"
    const newUser = {
      id: fakeDB.length,
      email,
      password: hashedPassword,
    };
    fakeDB.push(newUser);


     // 4. Create Access Token for the newly registered user
     const accesstoken = createAccessToken(newUser.id);
     const refreshtoken = createRefreshToken(newUser.id);

     
     // 5. Send the Access Token as a response
     sendAccessToken(res, req, accesstoken);
     
     newUser.refreshtoken = refreshtoken;

    console.log(fakeDB);
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

// 2. login a user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find user in array. If not exist send error
    const user = fakeDB.find((user) => user.email === email);
    if (!user) throw new Error("User does not exist!");
    // 2. Compare crypted password and see if it checks out. Send error if not
    const valid = await compare(password, user.password);
    if (!valid) throw new Error("Password not correct!");
    // 3. Create Refresh- and Accesstoken
    const accesstoken = createAccessToken(user.id);
    const refreshtoken = createRefreshToken(user.id);
    // 4. Store Refreshtoken with user in "db"
    // Could also use different version numbers instead.
    // Then just increase the version number on the revoke endpoint
    user.refreshtoken = refreshtoken;
    // 5. Send token. Refreshtoken as a cookie and accesstoken as a regular response
    sendRefreshToken(res, refreshtoken);
    sendAccessToken(res, req, accesstoken);
    console.log(fakeDB);
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

// 3. logout a user
app.post("/logout", (_req, res) => {
  res.clearCookie("refreshtoken", { path: "/refresh_token" });
  return res.send({
    message: "Logged out.",
  });
});

// 4. protected route
app.post("/protected", async (req, res) => {
  try {
    const userId = isAuth(req);
    if (userId !== null) {
      res.send({
        data: "This is a protected route!",
      });
    }
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

// 5. Get a new access token with a refresh token
app.post("/refresh_token", (req, res) => {
  const token = req.cookies.refreshtoken;
  // If we don't have a token in our request
  if (!token) return res.send({ accesstoken: "" });
  // We have a token, let's verify it!
  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.log({ accesstoken: "" })
    return res.send({ accesstoken: "" });
  }
  // token is valid, check if user exist
  const user = fakeDB.find((user) => user.id === payload.userId);
  if (!user) return res.send({ accesstoken: "" });
  // user exist, check if refreshtoken exist on user
  if (user.refreshtoken !== token) return res.send({ accesstoken: "" });
  // token exist, create new Refresh- and accesstoken
  const accesstoken = createAccessToken(user.id);
  const refreshtoken = createRefreshToken(user.id);
  // update refreshtoken on user in db
  // Could have different versions instead!
  user.refreshtoken = refreshtoken;
  // All good to go, send new refreshtoken and accesstoken
  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
