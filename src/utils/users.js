const users = [];

const addUser = ({ id, username, room }) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if (!room || !username) {
        return {
            error: "username and room are required",
        };
    }
    // Check for username in room
    const exists = users.find(
        (user) => user.username === username && user.room === room
    );
    if (exists || username === "announcements") {
        return { error: "username already exists" };
    }

    // Store user
    const user = { id, username, room };
    users.push(user);
    return { user };
};

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
    return { error: "user doesn't exist" };
};

// search for user using id in the users array
const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (roomName) =>
    users.filter((user) => user.room === roomName);

module.exports = {
    getUsersInRoom,
    getUser,
    addUser,
    removeUser,
};
