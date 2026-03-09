
VR Integration Steps

1. Install socket client

npm install socket.io-client

2. Connect VR game to server

const bridge = require("./vrSocketBridge");

bridge.connect("http://localhost:8080","player1");

3. Join poker table

bridge.joinTable("table1","player1");

4. Start poker round

bridge.startRound("table1");

5. Player betting

bridge.bet("table1","player1",50);

6. Move to next stage

bridge.nextStage("table1");

This connects your VR poker table directly to the backend server.
