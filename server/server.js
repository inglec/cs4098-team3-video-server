const mediasoup = require('mediasoup');

const Server = function(config){

  const server = {
    //Underlying mediaSoup Server instance
    mediaServer: null,

    connect: null,
    _authCheck: null,

  };

  //Set up mediasoup server
  server.mediaServer = mediasoup.Server({
    numWorkers: config.numWorkers, // Use as many CPUs as available.
    logLevel: config.logLevel,
    logTags: config.logTags,
    rtcIPv4: config.rtcIPv4,
    rtcIPv6: config.rtcIPv6,
    rtcAnnouncedIPv4: config.rtcAnnouncedIPv4,
    rtcAnnouncedIPv6: config.rtcAnnouncedIPv6,
    rtcMinPort: config.rtcMinPort,
    rtcMaxPort: config.rtcMaxPort
  });


  /*
    function(socket): void
      connects the socket to the server and sets up event handlers
  */
  server.connect = (socket, user) => {
    console.log("New connection incoming");

    _authCheck(user)
      .then( () => { //auth succeded

      })
      .catch( (err) => { //auth failed
        console.log(err);
      })


  }

  /*
    Promise(user): Boolean
      checks whether the credentials allow a user to connect
      //made async as not sure how auth will work
  */
  server._authCheck = (user) => {
    return new Promise( (resolve, reject) => {
      let authenticated = false;
      authenticated = true;
      if (authenticated) {
        resolve(/* Anything we want to return after auth*/)
      }
      else {
        reject(Error("Authentication error"));
      }
    });
  }


  return server
}


module.exports = Server;
