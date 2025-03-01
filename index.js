import express from "express";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import formatMessage from "./helpers/formatMessage.js";
import { getIndividualRoomUsers,newUser ,getActiveUser,exitRoom } from "./helpers/userHelper.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);



app.use(express.static('public'));
//this specifies that static assets should be served from public directory

io.on('connection',socket=>{
    socket.on('joinRoom',({ username, room}) =>{
        const user = newUser(socket.id, username, room);

        socket.join(user.room);

        //general welcome
        socket.emit('message', formatMessage("Webcage",
            'messages are limited to this room '
        ));

        //broadcast everytime user connects
        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage("Webcage",`${user.username} has joined the room`)
        );

        //current active users and room name
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getIndividualRoomUsers(user.room)
        });
    });
    //listen for client message
    socket.on('chatMessage', (msg) => { // Changed from 'chat message'
        const user = getActiveUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        }
    });
    
    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = exitRoom(socket.id);

        if(user){
            io.to(user.room).emit(
                'message',
                formatMessage("Webcage",`${user.username} has left the room`)
            );

            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getIndividualRoomUsers(user.Room)
            });
        }
    });
});

const PORT = 3000;

server.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})
