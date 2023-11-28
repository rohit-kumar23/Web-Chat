const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
    },
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
    res.status(404).send('<h2 style="font-family: monospace;">Error 404: Resource not found.</h2>');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('<h2 style="font-family: monospace;">Internal Server Error</h2>');
});

// {chatID: chatName, ...}
const chatIDs = new Map();

// {socketID: {chatID, userName}, ...}
const socket2userInfo = {};

// {socketID: userName, ...}
const users = {};

function isRoomExist(roomName) {
    var room = io.sockets.adapter.rooms.get(roomName);
    return room && room.size > 0;
}

io.on('connection', (socket) => {

    socket.on('new-user-joined', (name) => {
        users[socket.id] = name;
    });

    socket.on('process-ID', () => {
        var output = generateUniqueId();
        socket.emit('output-ID', output);
    });

    socket.on('chat-created', (userName, chatName, chatID) => {
        chatIDs.set(chatID, chatName);
        socket2userInfo[socket.id] = { chatID: chatID, userName: userName };
        
        socket.join(chatID);
    });

    socket.on('query-chatID', (userName, chatID) => {
        if (chatIDs.has(chatID)) {
            socket.emit('query-response', 'true', userName, chatIDs.get(chatID), chatID);
        } else {
            socket.emit('query-response', 'false', '', '', '');
        }
    });

    socket.on('chat-joined', (userName, chatID) => {
        socket.join(chatID);
        socket2userInfo[socket.id] = { chatID: chatID, userName: userName };
        
        socket.to(chatID).emit('receive', userName + ' joined the chat', chatID, userName, 'middle');
    });

    socket.on('chat-leaved', (chatID, userName) => {
        socket.leave(chatID);
        socket.leave(socket.id);

        if (!isRoomExist(chatID)) {
            chatIDs.delete(chatID);
        }
        delete socket2userInfo[socket.id];

        socket.to(chatID).emit('receive', userName + ' left the chat', chatID, userName, 'middle');
    });

    socket.on('disconnect', (reason) => {
        if (users.hasOwnProperty(socket.id)) {
            delete users[socket.id];
        }
        else {
            if (socket.id in socket2userInfo) {
                var userName = socket2userInfo[socket.id].userName;
                var chatID = socket2userInfo[socket.id].chatID;
                socket.to(chatID).emit('receive', userName + ' left the chat', chatID, userName, 'middle');
            }

            socket.leave(socket.id);
            delete socket2userInfo[socket.id];

            for (var [chatID, _] of chatIDs.entries()) {
                var room = io.sockets.adapter.rooms.get(chatID);
                if (!room || room.size === 0) {
                    chatIDs.delete(chatID);
                }
            }
        }
    });

    socket.on('send', (msg, chatID, userName) => {
        socket.to(chatID).emit('receive', msg, chatID, userName, 'ai');
    });
});

function generateUniqueId() {
    var characters = 'abcdefghijklmnopqrstuvwxyz';
    var format = [3, 4, 4, 3]; // format xxx-xxxx-xxxx-xxx

    let id;
    do {
        id = '';
        format.forEach((length, index) => {
            for (let i = 0; i < length; i++) {
                id += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            if (index < format.length - 1) {
                id += '-';
            }
        });
    } while (chatIDs.has(id));

    return id;
}

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
