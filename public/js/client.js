$(document).ready(function(){

    // assign random profile picture image
    window.profilePicID = Math.floor(Math.random() * 4) + 1
    console.log(profilePicID);


    var socket = io.connect();

    if(window.localStorage.getItem('current_room') != null){
      var room = window.localStorage.getItem('current_room');
      socket.emit('get current room chats', room);
      socket.emit('get current editor state', room);
    }

    var last_applied_change = null;
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/dracula");
    editor.getSession().setMode("ace/mode/javascript");

    window.Split(['#sidebar-left', '#main', '#sidebar-right'],
      {
        sizes: [20, 50, 30],
        minSize: 100
      });

    window.Split(['#editor-wrapper', '#editor-output'],
      {
        sizes: [70, 30],
        minSize: 100,
        direction: 'vertical'
      });

    window.emojiPicker = new EmojiPicker({
      emojiable_selector: '[data-emojiable=true]',
      assetsPath: '/public/images',
      popupButtonClasses: 'fa fa-smile-o'
    });

    window.emojiPicker.discover();

    var prepareSource = function() {
      var base_tpl =
      "<!doctype html>\n" +
      "<html>\n\t" +
      "<head>\n\t\t" +
      "<meta charset=\"utf-8\">\n\t\t" +
      "<title>Test</title>\n\n\t\t\n\t" +
      "</head>\n\t" +
      "<body>\n\t\n\t" +
      "</body>\n" +
      "</html>";

      var js = editor.getValue(),
          src = '';

      src = '<script>' + js + '<\/script>';
      src = base_tpl.replace('</body>', src + '</body>');   
      return src;
    };

    var executejs = function () {
      var source = prepareSource();
    
      var iframe = $('#editor-output iframe'),
          iframe_doc = iframe[0].contentDocument;
    
      iframe_doc.open();
      iframe_doc.write(source);
      iframe_doc.close()
    }

    $('#run').click(executejs);
    
    var addLi = (data) => {
      console.log(data.time);
      var source   = document.getElementById('text-template').innerHTML;
      var template = Handlebars.compile(source);
      if (!(data.hasOwnProperty('time'))){
        var d = new Date();
        data.time = d;  
      } else {
        data.time = new Date(data.time);
      }
      var context = {username: data.user, message: data.message, time: data.time.toISOString(), profilePicID: data.profilePicID};
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

    // $('#btn-chat').click((e) => {
    //   e.preventDefault();
    //   socket.emit('message sent', $('#btn-input').val());
    // });

    $('#btn-input').keypress( (e) => {
      if(e.which == 13) {
        socket.emit('message sent', {message: $(e.currentTarget).val(), room: window.localStorage.getItem('current_room'), profilePicID: profilePicID});
        $(e.currentTarget).val("");
      }
    });

    $('.rooms-list li').click((e) => {
      e.preventDefault();
       var current_room = $(e.currentTarget).find("a").text();
       current_room = current_room.split(" ").join('_');
       window.localStorage.setItem('current_room', current_room);
      alert("welcome to "+current_room);
      socket.emit('join room', current_room);
      socket.emit('get current room chats', current_room);
      socket.emit('get current editor state', current_room);
    });

    socket.on('room chats', (data) => {
      $('.list-unstyled').empty();
      data.reverse().forEach((message) => {
        addLi(JSON.parse(message));
      });
    });

    socket.on('editor state',(data) => {
      console.log(data);
      editor.setValue("");
      editor.setValue(data);
    });

    socket.on('message received', (message) => addLi(message));
    socket.on('file received', (file, type) => addFileLi(file, type));
    var uploader = new SocketIOFileUpload(socket);
    //uploader.listenOnInput(document.getElementById("siofu_input"));
    
    editor.on('change', function (data) {
      if (last_applied_change != data){
        var current_state = editor.getValue();
        socket.emit('diff', JSON.stringify(data), current_state, window.localStorage.getItem('current_room'));
      }
    });
   
    socket.on('patch', (diff, room) => {
      if(window.localStorage.getItem('current_room') === room){
        diff = JSON.parse( diff ) ;
        last_applied_change = diff;
        editor.getSession().getDocument().applyDeltas( [diff] );
      }
    });

    $('#sidebar-right').on("resize", function() { 
      console.log("resize sidebar");
      editor.resize();
    });
});