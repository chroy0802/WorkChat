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
    
    var addFileLi = (file) => {
      console.log(file);
      var source   = document.getElementById('text-file-template').innerHTML;
      var template = Handlebars.compile(source);
      var d = new Date(); 
      var time = d.toISOString();
      var context = {name: file.name, size: file.size, time: time};
      var html    = template(context);
 
      $('.list-unstyled').append(html);
    };
    
    var download = (filename) => {
      console.log("Inside download");
      $.ajax({
        url:'/download',
        type:'GET',
        data:{file: filename}});
    }

    var socket = io.connect();
    $('#btn-chat').click((e) => {
      e.preventDefault();
      socket.emit('message sent', $('#btn-input').val());
    });
    socket.on('message received', (message) => addLi(message));
    socket.on('file received', (file) => addFileLi(file));
    var uploader = new SocketIOFileUpload(socket);
    console.log(uploader);
    uploader.listenOnInput(document.getElementById("siofu_input"));

});