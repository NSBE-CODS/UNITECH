var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

var Message = mongoose.model('Message',{
    name : String,
    message : String
})

var dbUrl = 'mongodb+srv://admin:kgAzQ4YLBDPwkP55@cluster0.wiksshd.mongodb.net/test'

app.get('/messages', (req, res) => {
    Message.find({},(err, messages)=> {
        res.send(messages);
    })
})

app.post('/messages', (req, res) => {
    var message = new Message(req.body);
    message.save((err, savedMessage) => {
        if (err) {
            res.sendStatus(500);
        } else {
            io.emit('message', savedMessage);
            res.sendStatus(200);
        }
    });
});

app.delete('/messages/:id', (req, res) => {
    console.log('Deleting message with id: ' + req.params.id)
    Message.findByIdAndDelete(req.params.id, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error deleting message');
        } else {
            console.log(result);
            io.emit('messageDeleted', req.params.id);
            res.status(200).send('Message deleted');
        }
    });
});

io.on('connection', (socket) => {
    console.log('a user is connected');

    socket.on('deleteMessage', (messageId) => {
        console.log('Deleting message with id: ' + messageId)
        Message.findByIdAndDelete(messageId, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('deleteMessageFailed', messageId);
            } else {
                console.log(result);
                socket.emit('messageDeleted', messageId);
            }
        });
        socket.broadcast.emit('messageDeleted', messageId);
    });
    
});

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    console.log('mongodb connected', err);
});

var server = http.listen(3000, () => {
    console.log('server is running on port http://localhost:3000/');
});
