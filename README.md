# Getty Connect request helper

A small script to help you make calls to GettyConnect, without thinking of
keeping alive your session.

For more information on Connect see https://github.com/gettyimages/connect.

## Example
Just pass the endpoint name and the requestbody to getty and your script will
log in if needed, and perform the request.

To get the image data for a list of ids:
```
var getty = require('getty')({
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
```
