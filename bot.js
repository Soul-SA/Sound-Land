const discord = require("discord.js");
const botSettings = require("./botSettings")
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYoutubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");


var bot = new discord.Client();
var config = JSON.parse(fs.readFileSync("./botSettings.json" , "utf-8"));

const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const TOKEN = config.TOKEN;

var queue = [];
var isPlaying = false;
var dispatcher = null;
var VoiceChannel = null;
var skipReq = 0;
var skippers = [];
var servers = {};

/// start ready event
bot.on('ready', () => {
    console.log("Working.....");
    console.log(botSettings.prefix);
    console.log(botSettings.TOKEN);
    console.log('... Sound Land is ready');	
});
/// end of ready event

/// start message event handler
bot.on("message", function(message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(" ").slice(1).join(" ");

    if (mess.startsWith(prefix + "stop")) {
        queue = [];
        dispatcher.end();
        return message.channel.send(":stop_button: Stopped!");
    }
    
    if(mess.startsWith(prefix + 'play')) {
        if(member.voiceChannel || bot.guilds.get('322517098846748673').voiceConnection != null) {
            if(queue.length > 0 || isPlaying) {
                getID(args, function(id) {
                    add_to_queue(id);
                    fetchVideoInfo(id, function(videoInfo) {
                        if(err) throw new Error(err);
                        message.reply(' The song: **' + fetchVideoInfo.title + "** has been added to the queue list.");
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function(id){
                    queue.push("placeholder");
                    playMusic(id, message);
                        message.reply(' your song(s) has been added to the queue.');
                });
            }
        } else {
            message.reply('You must be in a voice channel!');
        }
    } else if(mess.startsWith(prefix + 'skip')){
        if(skippers.indexOf(message.author.id) === -1){
            skippers.push(message.author.id);
            skipReq++;
            if(skipReq >= Math.floor((voiceChannel.members.size - 1) / 2)) {
                skip_song(message);
                message.reply('You have skipped the current song.');
            } else {
                message.reply('Your skip has been added. You need **' + Math.ceil((voiceChannel.members.size - 1) / 2) - skipReq + "** more skips.");
            }
        } else {
            message.reply('You already voted to skip you cheeky bastard.')

        }
    }
});
/// end message event handler

/// start of music functions
function skip_song(message) {
    dispatcher.end();
}
    
function playMusic(id, message){
    voiceChannel = message.member.voiceChannel;
    
    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });

        dispatcher = connection.playStream(stream);
        dispatcher.on('end', function() {
            skipReq = 0;
            skippers = [];
            queue.shift();

            if(queue.length == 0) {
                queue = [];
                isPlaying = false;
            } else {
                playMusic(queue[0], message);
            }
        });
    });
}

function getID(str, cb) {
    if(isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function(id) {
            cb(id);
        });
    }
}

function add_to_queue(strID) {
    if(isYoutube(strID)) {
        queue.push(getYouTubeID(strID));
    } else {
        queue.push(strID);
    }
}


function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        callback(json.items[0].id.videoId);
    });
}

function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}
/// end of music functions

/// login
bot.login(TOKEN);