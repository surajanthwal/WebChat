'use strict';

// define globals
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname + "/public/"));

app.get('/checkAvailability', function (req, res) {
    console.log(req.query);
    var name = req.query.userName.trim();
    for (var i in socketMap) {
        console.log(i);
        if (i.toLowerCase() == name.toLowerCase())
            res.send({Access: false})
    }
    res.send({Access: true});
});

var numUsers = 0;
var socketMap = {};
var usersJoinedBefore = [];

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        --numUsers;
        console.log('user disconnected');
        var name = "";
        for (var i in socketMap) {
            if (socketMap[i] == socket) {
                delete socketMap[i];
                name=i;
            }
        }
        socket.broadcast.emit('user left', {
            username:name
        })
    });

    //1st event
    socket.on('add user', function (data) {
        // console.log(data);
        socketMap[data.user.firstName] = socket;
        socket.user = data.user;
        // console.log(socketMap);
        ++numUsers;

        for (var i in socketMap) {
            if (i == data.user.firstName)
                break;

            //2nd event
            socket.emit('earlier users', {
                username: i,
                status: socketMap[i].user.status,
                numUsers: numUsers
            });
        }


        // 3rd event
        socket.broadcast.emit('user joined', {
            username: socket.user.firstName,
            status: socket.user.status,
            numUsers: numUsers
        });
    });

    //4th event
    socket.on('new message', function (data) {
        //5th event
        socketMap[data.ToUserName].emit('new message', {
            FromUserName: data.FromUserName,
            message: data.message
        });
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});