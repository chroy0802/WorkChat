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

    var socket = io.connect();
    $('#btn-chat').click((e) => {
      e.preventDefault();
      socket.emit('message sent', $('#btn-input').val());
    });
    socket.on('message received', (message) => addLi(message));

    var uploader = new SocketIOFileUpload(socket);
    console.log(uploader);
    uploader.listenOnInput(document.getElementById("siofu_input"));

});