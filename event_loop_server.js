#!/usr/bin/node

var dgram = require('dgram');
var util = require('util');
var readline = require('readline');
var fs = require('fs');
var version = 1;
var SERVER_PORT = process.argv[2];

var server = dgram.createSocket('udp4');
var history = {};
var magic = 50273;
var commands = ["HELLO", "DATA", "ALIVE", "GOODBYE"];
//sends a message given a socket, fails if id is not currently stored
function sendMessage(id, socket, command) {
    message = new Buffer(12);
    message.write(magic, 0, 2);
    message.write(version, 2, 1); 
    message.write(commands.indexOf(command), 3, 1);
    message.write(history[id][3], 4, 4);
    message.write(id, 8, 4);
    socket.send(message, 0, message.length, history[id][1], history[id][2]);
    history[id][3] ++;
};
function shutdown() {
    util.log("shutdown requested");
    var keys = Object.keys(history);
    var counter = 0;
    var len = keys.length;
    var next = function() {
	if (counter < len) sendMessage(keys[counter++], server, "GOODBYE"), next);
    };
    next();
    process.exit(0);
};
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
   // console.log(remote.address + ':' + remote.port +' - ' + message);
    if (message.readUInt16LE(0) == magic) {
	var sessionid = message.readUInt32LE(8);
	var command = message.readUInt8(3);
	var seqnum = message.readUInt32LE(4);

	if (sessionid in history) {
	    if (seqnum === history[sessionid][2]) {
		cancelTimeout(history[sessionid][4];
		if (commands[command] === "DATA") {
		    var data = message.toString("utf8", 12);
		    console.log(data);
		    sendMessage(sessionid, server, "ALIVE");
		    history[sessionid][2]++;
		    var timer = setTimeout(function () {
			sendMessage(sessionid, server, "GOODBYE");
			delete history[sessionid];
		    }, 5000); 
		    history[sessionid][4] = timer;
		} else if (commands[command] === "GOODBYE") {
		    cancelTimeout(history[sessionid][4]);
		    sendMessage(sessionid, server, "GOODBYE");
		    delete history[sessionid];
		}
	    } else {
		cancelTimeout(history[sessionid][4]);
		sendMessage(sessionid, server, "GOODBYE");
		delete history[sessionid];
	    }
	} else {
	    // history map of session ids to array of information about the session
	    // history[id][0] = address, [1] = port, [2] sequence number for client, [3] sequence number for server, [4] for timer
	    if (commands[command] === "HELLO" && seqnum === 0) { // verify packet has correct sequence number
		var timer = setTimeout(function () {
		    sendMessage(sessionid, server, "GOODBYE");
		    delete history[sessionid];
		}, 5000); 
		    
		history[sessionid] = [remote.address, remote.port, 1, 0, timer];
		sendMessage(sessionid, server, "HELLO");
		
	    } 
	}
    }
    
});

server.bind(SERVER_PORT);

process.stdin.on('data', function(chunk){
});

process.stdin.on('end', function() {
    shutdown();
});
process.stdin.on('q', function() {
    shutdown();
});
 
