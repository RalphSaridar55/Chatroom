const express = require('express');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentuser, userLeave, getRoomUsers} = require('./utils/users');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server =http.createServer(app);
const io = socketio(server);

const botName ='chatCord Bot';

//Set static folder
app.use(express.static(path.join(__dirname,"public")));

//Run when a client connects
io.on('connection',socket=>{
    socket.on('joinRoom',({username, room})=>{
        const user = userJoin(socket.id,username,room);

        socket.join(user.room);

        //Welcome current user
        socket.emit('message',formatMessage(botName,'Welcome to chatCord'));
    
        //Broadcast when a user connects
        // emits to everybody except for the user
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users: getRoomUsers(user.room)
        })

    });


    //Listen for chat messages
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentuser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    })

    //runs when clients disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
        }

        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users: getRoomUsers(user.room)
        })

    });


    //to broadcast to everybody
    //io.emit()
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT,()=>{
    console.log("Server is running on Port: ",PORT);
})
