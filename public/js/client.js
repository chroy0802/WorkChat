$(document).ready(function(){
    // $('#modalName').modal('show');
    window.Split(['#sidebar-left', '#main', '#sidebar-right'],
      {
        sizes: [20, 50, 30],
        minSize: 100
      });
    window.emojiPicker = new EmojiPicker({
      emojiable_selector: '[data-emojiable=true]',
      assetsPath: '/public/images',
      popupButtonClasses: 'fa fa-smile-o'
    });

    var uri = new URI(window.location.href);
    var uri_hash = uri.hash();
    var tokens = uri_hash.split('&').reduce(function (result, item) {
        var parts = item.split('=');
        result[parts[0]] = parts[1];
        return result;
    }, {});

    var username = "GHOST";

    $.ajax({
      method: 'GET',
      url: 'https://graph.microsoft.com/v1.0/me',
      success: function (data) {
        username = data.givenName;
      },
      error: function (xhr, status, err) {
        console.log(xhr, status, err);
      },
      beforeSend: function (xhr) {
        var token_string = 'Bearer ' + tokens['#access_token'];
        console.log(token_string);
        xhr.setRequestHeader('Authorization', token_string);
      },
      dataType: "json"
    });


    window.emojiPicker.discover();
    
    var addLi = (message) => {
      var source   = document.getElementById('text-template').innerHTML;
      var template = Handlebars.compile(source);
      var d = new Date(); 
      var time = d.toISOString();
      var context = {message: message.message, time: time, username: message.username};
      var html    = template(context);
 
      $('.list-unstyled').append(html);
    };
    
    var addFileLi = (file, type) => {
      var source   = document.getElementById('text-file-template').innerHTML;
      var template = Handlebars.compile(source);
      var d = new Date(); 
      var time = d.toISOString();
      var type = type.split('/')[0];
      var audio = false;
      var video = false;
      var image = false;
      if(type === "image")
        image = true;
      if(type === "audio")
        audio = true;
      if(type === "video")
        video = true;
      var context = {name: file.name, size: file.size, time: time, audio: audio, video: video, image: image};
      var html = template(context);
      $('.list-unstyled').append(html);
    };

    var socket = io.connect();

    socket.on('connection successful', () => { console.log('HIGHBOT'); });


    $('#btn-input').keypress( (e) => {
        if(e.which == 13) {
          socket.emit('message sent', {username: username, message: $(e.currentTarget).val(), token: tokens['#access_token']});
          $(e.currentTarget).val("");
        }
    });

    $('.rooms-list li').click((e) => {
      e.preventDefault();
      var room = $(e.currentTarget).find("a").text();
      alert("welcome to "+room);
      socket.emit('join room', room);
    });

    socket.on('message received', (message) => addLi(message));
    socket.on('file received', (file, type) => addFileLi(file, type));
    var uploader = new SocketIOFileUpload(socket);
    //uploader.listenOnInput(document.getElementById("siofu_input"));
    var last_applied_change = null;
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/dracula");
    editor.getSession().setMode("ace/mode/javascript");
    
    editor.on('change', function (data) {
    if (last_applied_change != data)
      socket.emit('diff', JSON.stringify(data));
    });
   
    socket.on('patch', (diff) => {
    diff = JSON.parse( diff ) ;
    last_applied_change = diff;
    editor.getSession().getDocument().applyDeltas( [diff] );
    });

    $('#sidebar-right').on("resize", function() { 
      console.log("resize sidebar");
      editor.resize();
    });
});