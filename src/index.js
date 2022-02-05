const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require("./utils/users");

const port = process.env.PORT;
const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    socket.on("message", (msg, callback) => {
        const filter = new Filter();
        if (filter.isProfane(msg)) {
            return callback("[!] Profanity not allowed");
        }
        const user = getUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage(user.username, msg)
            );
            callback();
        } else {
            callback("[!] User doesn't exist");
        }
    });

    socket.on("disconnect", () => {
        const removedUser = removeUser(socket.id);

        if (removedUser) {
            // Announce that the user left and update sidebar data
            io.to(removedUser.room).emit(
                "message",
                generateMessage(
                    "Announcements",
                    `[-] User "${removedUser.username}" has left!`
                )
            );

            io.to(removedUser.room).emit("roomData", {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room),
            });
        }
    });

    socket.on("sendLocation", ({ lat, long }, clientCallback) => {
        if (!lat || !long) {
            return clientCallback("[!] Invalid coordinates");
        }
        const user = getUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "locationMessage",
                generateLocationMessage(user.username, lat, long)
            );
            clientCallback();
        } else {
            clientCallback("[!] User doesn't exist");
        }
    });

    socket.on("join", (options, clientCallback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            clientCallback(error);
        } else {
            const username = user.username;
            const room = user.room;

            // Add the new user to the room and welcome him
            socket.join(room);
            socket.emit(
                "message",
                generateMessage("Announcements", "Welcome!")
            );

            // Tell the rest of the room users that he joined
            socket.broadcast
                .to(room)
                .emit(
                    "message",
                    generateMessage(
                        "Announcements",
                        `[+] User "${username}" has joined the room!`
                    )
                );

            // Update room users list in the sidebar
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
            clientCallback();
        }
    });
});
server.listen(port, () => {
    console.log("[+] Server listening on port: " + port);
});
