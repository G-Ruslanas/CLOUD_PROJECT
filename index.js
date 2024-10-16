const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoute = require("./routes/auth");
const bidRoute = require("./routes/bid");
const winnerRoute = require("./routes/winner");
const userRoute = require("./routes/user");
const stripeRoute = require("./routes/stripe");
const conversationRoute = require("./routes/conversation");
const messageRoute = require("./routes/message");
const automaticRoute = require("./routes/automatic");
const path = require("path");
const morgan = require("morgan");

const cors = require("cors");

const socketio = require("socket.io");
const http = require("http");

const app = express();

const server = http.createServer(app);
const io = socketio(server);

require("./passportGoogle");
require("./passportLocal");

const auctionRouter = require("./routes/auction");
const { addUser, removeUser, getUser } = require("./users");
const exp = require("constants");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successfully"))
  .catch((error) => console.log(error));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  cors({
    origin: "https://cloud-project-stjl.onrender.com",
    credentials: true,
  })
);

app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());

var users = [];

//socket
io.on("connection", (socket) => {
  //take UserId and socketId from user
  socket.on("addUser", (userId) => {
    socket.join(userId);
    users = addUser(userId, socket.id);
    socket.userId = userId;
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.userId).emit("getMessage", senderId, text);
    }
  });

  //when disconnect
  socket.on("disconnect", () => {
    users = removeUser(socket.userId);
    io.emit("getUsers", users);
    socket.disconnect();
  });

  socket.on("join-room", ({ room }) => {
    socket.join(room);
  });

  socket.on("bid", ({ bid, name, purchase, room }, callback) => {
    io.to(room).emit("message", bid, name, purchase, room);
  });
});

app.use("/auth", authRoute);
app.use("/auction", auctionRouter);
app.use("/bid", bidRoute);
app.use("/winner", winnerRoute);
app.use("/user", userRoute);
app.use("/stripe", stripeRoute);
app.use("/conversation", conversationRoute);
app.use("/message", messageRoute);
app.use("/automatic", automaticRoute);

app.use(express.static(path.join(__dirname, "./client/build")));

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
