const socketIo = require("socket.io");
const userViewModel = require("../viewmodel/userViewModel");

function initSocket(server) {
    const io = socketIo(server);

    io.on("connection", (socket) => {
        socket.on("sendData", async (data) => {
            try {
                const response = await userViewModel.storejofinish(req);
                socket.broadcast.emit("receiveData", response);
            } catch (error) {
                socket.emit("error", { message: "Failed to process order" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected: ", socket.id);
        });
    });

    return io;
}

module.exports = initSocket;