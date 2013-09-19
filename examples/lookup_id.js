
var getty = require('../')({
  SystemId      : 'my',
  SystemPassword: 'super',
  UserName      : 'secret',
  UserPassword  : 'login'
});
getty('GetLargestImageDownloadAuthorizations', {images: [
    {ImageId: 84189548}
  ]}, function(err, res) {
    if(err) return console.log(err.stack);
    console.log(res.result.Images);
  });