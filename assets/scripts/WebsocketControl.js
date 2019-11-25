import {
  PlayerData,
  KEY_CONNECTED,
  KEY_READY,
  KEY_INGAME,
  KEY_BALL,
  KEY_ENDGAME,
  KEY_TIME,
  KEY_GOAL
} from "./GameDefine";
import PlayerA from "./PlayerA";
const Web3Controller = require("./Web3Controller");
const WebsocketControl = cc.Class({
  extends: cc.Component,

  ctor: function() {
    this.websocket = null;
    this.isConnected = false;
    this.player = PlayerA;
    this.playerDataMe = null;
    this.playerDataRivel = null;
    this.ballData = null;
    this.resultBoard = null;
    this.address = null;
  },
  properties: {
    prefab_Player: {
      default: null,
      type: cc.Prefab
    },

    prefab_Me: {
      default: null,
      type: cc.Prefab
    },

    prefab_Ball: {
      default: null,
      type: cc.Prefab
    },
    prefab_ResultBoard: {
      default: null,
      type: cc.Prefab
    },
    scoreDisplayA: {
      default: null,
      type: cc.Label
    },
    scoreDisplayB: {
      default: null,
      type: cc.Label
    },
    matchTime: {
      default: null,
      type: cc.Label
    }
  },
  statics: {
    instance: null
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    cc.director.getPhysicsManager().enabled = true;
    this.scoreA = 0;
    this.scoreB = 0;
    WebsocketControl.instance = this;
  },
  start() {
    // this.websocket = new WebSocket(
    //   `ws://127.0.0.1:8081/?address=${this.address}`
    // );
    this.websocket = new WebSocket(
      `ws://139.162.40.88:8081/?address=${this.address}`
    );
    var self = this;
    this.websocket.onopen = function(evt) {
      // cc.log(evt);
      self.isConnected = true;
    };

    this.websocket.onmessage = function(evt) {
      // console.log('data: ' + evt.data);
      let playerdata = JSON.parse(evt.data);
      if (playerdata.key != undefined && playerdata.key == KEY_CONNECTED) {
        if (playerdata.type == "ME") {
          self.playerDataMe = playerdata;
          self.playerDataMe.node = cc.instantiate(self.prefab_Me);
          if (self.playerDataMe.index == 2) {
            self.playerDataMe.node.x = 330;
            self.playerDataMe.node.scaleX *= -1;
          }
          console.log("Me: ", self.playerDataMe);

          self.node.addChild(self.playerDataMe.node);
          console.log("connect succes to server");
        }
        if (playerdata.type == "RIVAL") {
          // Player Competitor
          self.playerDataRivel = playerdata;
          self.playerDataRivel.node = cc.instantiate(self.prefab_Player);
          if (self.playerDataRivel.index == 2) {
            self.playerDataRivel.node.x = 330;
            self.playerDataRivel.node.scaleX *= -1;
          }
          self.node.addChild(self.playerDataRivel.node);

          // console.log(`rival: ${self.playerDataMe.id} vs ${self.playerDataRivel.id}` );
        }
        if (playerdata.type == "RIVAL_BALL") {
          // Ball
          self.ballData = playerdata;
          self.ballData.node = cc.instantiate(self.prefab_Ball);
          self.node.addChild(self.ballData.node);
        }
      }
      if (playerdata.key == KEY_TIME) {
        // console.log("---------Time--------", playerdata.time);
        self.updateMatchTime(playerdata.time);
      }
      if (playerdata.key == KEY_GOAL) {
        self.restPlayer();
        self.scoreDisplayA.string = playerdata.scoreA;
        self.scoreDisplayB.string = playerdata.scoreB;
      }
      if (playerdata.key != undefined && playerdata.key == KEY_ENDGAME) {
        cc.director.pause();

        self.resultBoard = playerdata;
        self.resultBoard.node = cc.instantiate(self.prefab_ResultBoard);
        self.node.addChild(self.resultBoard.node);
        self.resultBoard.node
          .getComponent("ResultBoard")
          .updateScore(playerdata.scoreA, playerdata.scoreB);
        if (playerdata.scoreA != playerdata.scoreB) {
          console.log("data", playerdata);
          console.log("data", self.address);

          if (
            playerdata.scoreA > playerdata.scoreB &&
            playerdata.addressA == self.address
          ) {
            console.log("address", self.address);
            self.resultBoard.node.getComponent("ResultBoard").updateResult(1);
            Web3Controller.instance.endGameTx(1);
          } else if (
            playerdata.scoreB > playerdata.scoreA &&
            playerdata.addressB == self.address
          ) {
            Web3Controller.instance.endGameTx(1);
            self.resultBoard.node.getComponent("ResultBoard").updateResult(1);
          } else {
            self.resultBoard.node.getComponent("ResultBoard").updateResult(3);
          }
        } else {
          Web3Controller.instance.getComponent("Web3Controller").endGameTx(0);
          self.resultBoard.node.getComponent("ResultBoard").updateResult(2);
        }
        var goHome = cc.find("Canvas/goHome");
        goHome.active = false;
      }

      if (!playerdata.key) {
        for (let i = 0; i < playerdata.length; i++) {
          if (
            self.playerDataRivel &&
            cc.isValid(self.playerDataRivel.node) &&
            playerdata[i].id != null &&
            playerdata[i].id == self.playerDataRivel.id
          ) {
            self.playerDataRivel.node.x = playerdata[i].x;
            self.playerDataRivel.node.y = playerdata[i].y;
            let playerB = self.playerDataRivel.node.getComponent("PlayerB");
            playerB.onKeyD(playerdata[i].onKeyD);
            playerB.onKeyU(playerdata[i].onKeyU);
            // self.playerDataRivel.node.angle = playerdata[i].angle;
            // console.log(self.playerDataRivel.node);
          }

          if (
            self.ballData &&
            cc.isValid(self.ballData.node) &&
            playerdata[i].playerId != null &&
            playerdata[i].playerId == self.ballData.playerId
          ) {
            self.ballData.node.x = playerdata[i].x;
            self.ballData.node.y = playerdata[i].y;
            // self.ballData.node.setRotation(playerdata[i].angle);
            // console.log(self.ballData.node.x);
          }
        }
      }
    };

    this.websocket.onclose = function(event) {
      console.log("Closed ");
      self.isConnected = false;
    };
  },

  update(dt) {
    if (this.isConnected == false) return;
    if (
      this.ballData &&
      cc.isValid(this.ballData.node) &&
      this.ballData.node.x >= 490 &&
      this.ballData.node.y <= 0
    ) {
      this.restPlayer();
      this.gainScoreA();
      this.websocket.send(
        JSON.stringify({
          type: KEY_GOAL,
          scoreA: this.scoreA,
          scoreB: this.scoreB
        })
      );
    }
    if (
      this.ballData &&
      cc.isValid(this.ballData.node) &&
      this.ballData.node.x <= -500 &&
      this.ballData.node.y <= 0
    ) {
      this.restPlayer();
      this.gainScoreB();
      this.websocket.send(
        JSON.stringify({
          type: KEY_GOAL,
          scoreA: this.scoreA,
          scoreB: this.scoreB
        })
      );
    }
  },
  gainScoreA: function() {
    this.scoreA += 1;
    // update the words of the scoreDisplay Label
    this.scoreDisplayA.string = this.scoreA;
  },
  gainScoreB: function() {
    this.scoreB += 1;
    // update the words of the scoreDisplay Label
    this.scoreDisplayB.string = this.scoreB;
  },
  updateMatchTime: function(time) {
    this.matchTime.string = time;
  },
  restPlayer() {
    // this.ballData.node.getComponent("Ball").resetState();
    // this.playerDataMe.node.setPosition(
    //   this.playerDataMe.node.getComponent("PlayerA").getOriginPosX(),
    //   this.playerDataMe.node.getComponent("PlayerA").getOriginPosY()
    // );
    // setTimeout(() => {
    //   cc.director.getPhysicsManager().enabled = true;
    // }, 1000);
    this.ballData.node.destroy();
    this.playerDataMe.node.destroy();
    this.playerDataRivel.node.destroy();

    this.playerDataMe.node = cc.instantiate(this.prefab_Me);
    if (this.playerDataMe.index == 2) {
      this.playerDataMe.node.x = 330;
      this.playerDataMe.node.scaleX *= -1;
    }
    this.node.addChild(this.playerDataMe.node);
    this.playerDataRivel.node = cc.instantiate(this.prefab_Player);
    if (this.playerDataRivel.index == 2) {
      this.playerDataRivel.node.x = 330;
      this.playerDataRivel.node.scaleX *= -1;
    }
    this.node.addChild(this.playerDataRivel.node);
    this.ballData.node = cc.instantiate(this.prefab_Ball);
    this.node.addChild(this.ballData.node);
    // cc.director.getPhysicsManager().enabled = true;

    // this.ballData.node.x = this.ballData.node.getComponent("Ball").originPosX;
    // this.ballData.node.y = this.ballData.node.getComponent("Ball").originPosY;
    // this.ballData.node.getComponent(cc.RigidBody).linearVelocity = cc.v2(0, 0);
    // this.ballData.node.getComponent(cc.RigidBody).linearDamping = 0;
    // this.ballData.node.getComponent(cc.RigidBody).angularDamping = 0;
    // this.ballData.node.getComponent(cc.RigidBody).angularVelocity = 0;
    // this.ballData.node.getComponent("Ball").resetState();

    // this.playerDataRivel.node.getComponent("PlayerB").resetState();
  },
  sendData(data) {
    if (this.websocket != null && this.isConnected == true)
      this.websocket.send(data);
  },
  closeWS() {
    this.websocket.close();
  }
});
