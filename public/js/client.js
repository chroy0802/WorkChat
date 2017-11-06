$(window).on('load',function(){
    // $('#modalName').modal('show');
    var addLi = (message) => {
      var source   = document.getElementById('text-template').innerHTML;
      var template = Handlebars.compile(source);
      var d = new Date(); 
      var time = d.toISOString();
      var context = {message: message, time: time};
      var html    = template(context);
 
      $('.list-unstyled').append(html);
    };
    
    var addFileLi = (file, type) => {
      Handlebars.registerHelper("if", function(conditional, options) {
        if (options.hash.desired === options.hash.type) {
          options.fn(this);
        } else {
          options.inverse(this);
        }
      });
      var source   = document.getElementById('text-file-template').innerHTML;
      var template = Handlebars.compile(source);
      var d = new Date(); 
      var time = d.toISOString();
      var type = type.split('/')[0];
      var context = {name: file.name, size: file.size, time: time, type: type};
      var html = template(context);
      $('.list-unstyled').append(html);
    };

    var socket = io.connect();
    $('#btn-chat').click((e) => {
      e.preventDefault();
      socket.emit('message sent', $('#btn-input').val());
    });
    socket.on('message received', (message) => addLi(message));
    socket.on('file received', (file, type) => addFileLi(file));
    var uploader = new SocketIOFileUpload(socket);
    console.log(uploader);
    uploader.listenOnInput(document.getElementById("siofu_input"));

});