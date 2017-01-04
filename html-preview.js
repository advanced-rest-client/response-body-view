var notifyResize = function() {
  window.top.postMessage({
    'preview-window-height': document.body.clientHeight + 40
  }, '*');
};

var messageHandler = function(event) {
  var data = event.data;
  var body;
  if (data.rawResponse) {
    body = document.querySelector('#preview');
    body.innerHTML = data.rawResponse;
    window.setTimeout(notifyResize, 2);
  } else if (data.cleanUp) {
    body = document.querySelector('#preview');
    body.innerHTML = '';
  }
};

window.addEventListener('message', messageHandler);
window.addEventListener('resize', notifyResize);

var link = document.querySelector('#closeButton');
link.addEventListener('click', function() {
  window.top.postMessage({
    'preview-window-close': true
  }, '*');
});
