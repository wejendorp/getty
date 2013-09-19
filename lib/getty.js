/*
 * Module for performing requests to the Getty API
 */

// Modules
var request = require('request');

// Locals
var endpoints = require('./endpoints');

module.exports = function(credentials) {
  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function requestEndpoint(endpoint, data, token, done) {
    // Wrap getty requests in some error checking and attribute mapping
    var requestConfig = endpoints[endpoint];
    var requestBody = {
      'RequestHeader' : {
        'Token' : token,
        'CoordinationId': null
      }
    };
    // Endswith check to handle weird naming of CreateDownloadRequest wrapper
    var key = endsWith(endpoint, 'Request') ? 'Body' : 'RequestBody';
    requestBody[endpoint+key] = data;

    request({
      'method' : 'POST',
      'uri'  : requestConfig.uri,
      // Replace dates to specs:
      // http://weblogs.asp.net/bleroy/archive/2008/01/18/dates-and-json.aspx
      'body' : JSON.stringify(requestBody)
                      .replace(/\\(\/Date\(-?\d+\))\\\\\//g, '$1\\/'),
      'headers' : {
        'content-type' : 'application/json'
      }
    },
    function onEndpointResult(err, response, txt) {
      if(err) { return done(err); }
      if(response.statusCode === 404) { return done('404 Invalid endpoint'); }
      if(response.statusCode === 500) { return done('Server error: malformed request?'); }

      var json = JSON.parse(txt); // Parse returns immutable..
      var body = {};              // so we store it in body.

      // Message is used for error descriptions only
      if(json.Message) { return done(json.Message); }

      // Map to same keys regardless of endpoint name:
      body.result = json[endpoint+'Result'];
      body.header = json.ResponseHeader;

      if(body.header.Status === 'error') {
        return done(body);
      }
      done(err, body);
    });
  }
  var session = {};
  function getToken( secure, done ) {
    // Gets the token required for most Getty requests
    var token = secure ? session.secureToken : session.token;
    var now = Date.now();

    if(token && now < session.tokenExpiry) {
      return done(null, token);
    }

    requestEndpoint(
      session.token ? 'RenewSession' : 'CreateSession',
      credentials,
      null,
      function onTokenResult(err, resp) {
        if(err) { return done(err); }
        if(resp.statusCode === 404) { return done('404 Invalid endpoint'); }
        session.token       = resp.result.Token;
        session.secureToken = resp.result.SecureToken;
        session.tokenExpiry = now +
          parseInt(resp.result.TokenDurationMinutes, 10) * 60000;

        done(null, secure ? session.secureToken : session.token);
      }
    );
  }

  function gettyRequest(endpoint, data, done) {
    // Perform a Getty request towards the API. Handles tokens automatically.
    var requestUrl = endpoints[endpoint];
    if(!requestUrl) return done(new Error('Unknown endpoint '+endpoint));

    var secure = requestUrl.indexOf('https') === 0;
    getToken(secure, function(err, token) {
      if(err) return done(err);
      requestEndpoint(endpoint, data, token, done);
    });
  }
  // Expose endpoints for quick reference
  gettyRequest.endpoints = endpoints;
  return gettyRequest;
};