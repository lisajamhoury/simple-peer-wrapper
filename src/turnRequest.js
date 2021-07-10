/////////////////// Turn Server Used if Not on LocaHost — I have not tested this  ///////////////////

let turnReady;

const pcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

const DEBUG = false;

const log = function (message) {
  if (!DEBUG) {
    return;
  }
  console.log(message);
};

const checkHostname = function () {
  log('checking hostname');
  if (
    location.hostname &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1'
  ) {
    requestTurn(
      'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913',
    );
  }
};

const requestTurn = function (turnURL) {
  let turnExists = false;
  for (let i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          urls: 'turn:' + turnServer.username + '@' + turnServer.turn,
          credential: turnServer.password,
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
};

module.exports = checkHostname;
