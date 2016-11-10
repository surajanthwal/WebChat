'use strict';

// define globals
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fileNumber = 1;
// var multer = require('multer');
// var upload = multer({dest: './'});

// var multiparty = require('connect-multiparty'),
//     multipartyMiddleware = multiparty({ uploadDir: './UploadedFiles' });

var multiparty = require('multiparty'),
    fs = require('fs'),
    uuid = require('node-uuid');

app.post('/UploadedFiles', function (req, res) {
    var size = '';
    var file_name = '';
    var destination_path = '';
    console.log('Inside /UploadedFiles path');
    // console.log(req);

    var form = new multiparty.Form({uploadDir: 'public/UploadedFiles/'});
    // form.parse(req, function (err, fields, files) {
    //     res.writeHead(200, {'content-type': 'text/plain'});
    //     res.write('received upload:\n\n');
    //     res.end("Thanks");
    // });

    form.on('error', function (err) {
        console.log('Error parsing form: ' + err.stack);
    });

    // Parts are emitted when parsing the form
    form.on('part', function (part) {
        // You *must* act on the part by reading it
        // NOTE: if you want to ignore it, just call "part.resume()"
        console.log("Inside part");
        if (!part.filename) {
            // filename is not defined when this is a field and not a file
            console.log('got field named ' + part.name);
            // ignore field's content
            part.resume();
        }

        if (part.filename) {
            // filename is defined when this is a file
            // count++;
            console.log('got file named ' + part.name);
            // ignore file's content here
            part.resume();
        }

        part.on('error', function (err) {
            // decide what to do
        });
    });
    form.parse(req, function (err, fields, files) {
        var fromUsername, toUsername;
        fromUsername = fields['FromUserName'][0];
        toUsername = fields['ToUserName'][0];
        console.log(files.file[0]);
        var file = files.file[0];
        var ext = file.path.substring(file.path.lastIndexOf("."), file.path.length);
        var filePath = 'public/UploadedFiles/' + fileNumber++ + ext;
        fs.rename(file.path, filePath);
        socketMap[toUsername].emit('new message', {
            FromUserName: fromUsername,
            image: true,
            imageUrl: filePath.substring(filePath.indexOf("/") + 1, filePath.length)
        });

        console.log('Upload completed!');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('Received ' + files.length + ' files');
    });
});

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
var groups = {};

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        --numUsers;
        console.log('user disconnected');
        var name = "";
        for (var i in socketMap) {
            if (socketMap[i] == socket) {
                delete socketMap[i];
                name = i;
            }
        }
        socket.broadcast.emit('user left', {
            username: name
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

        if (data.isGroup) {
            for (var i in groups[data.ToUserName].groupMembers) {
                socketMap[groups[data.ToUserName].groupMembers[i].label].emit('new message', {
                    FromUserName: data.FromUserName,
                    message: data.message,
                    isGroup: true,
                    ToUserName:data.ToUserName
                });
            }
            socketMap[groups[data.ToUserName].createdBy].emit('new message', {
                FromUserName: data.FromUserName,
                message: data.message,
                isGroup: true,
                ToUserName:data.ToUserName
            });
        } else {
            socketMap[data.ToUserName].emit('new message', {
                FromUserName: data.FromUserName,
                message: data.message
            });
        }
    });

    socket.on('is typing', function (data) {
        socketMap[data.ToUserName].emit('is typing', {
            FromUserName: data.FromUserName,
            isTyping: data.isTyping
        });
    });

    socket.on('new group', function (data) {
        console.log(data);
        groups[data.firstName] = data;
        for (var i in data.groupMembers) {
            if (socketMap[data.groupMembers[i].label]) {
                socketMap[data.groupMembers[i].label].emit('new group', data);
            }
        }
        socketMap[data.createdBy].emit('new group', data);

    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});