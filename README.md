# Head Soccer

## Introduction

This is a Head Soccer style game - run on Ethereum - built by Cocos Creator.

Live Game: [PLAY](http://headsoccer2.surge.sh/)

(Make sure you are using Rinkeby and have some Ether in your account)

## How to play

![home](documentation/home.png)

- You must bet `0.1 ETH` for each play turn.
  ![play](documentation/play.png)

- If you win, you will receive `0.2 ETH`
  ![win](documentation/win.png)

- If you lose, you will lose your bet.
  ![lose](documentation/lose.png)

- If draw, you will receive your bet back.
  ![draw1](documentation/draw1.png)
  ![draw2](documentation/draw2.png)

## How it works

- Game Client: Cocos creator
- Blockchain: Ethereum
- Smart Contract: Truffle
- Game-Blockchain Connection: Web3js

## How to Build

### Build Smart Contract

- Make sure you have got truffle installed: https://github.com/trufflesuite/truffle/releases
- Go to `/smart-contracts`
- Copy `.env.example` to `.env` and config your keys here:

```sh
cp .env.example .env;
```

- Install dependencies: `yarn install`
- Compile && migrate to network you want (for example `rinkeby`):

```sh
truffle migrate --reset --network rinkeby
```

- now you have built contracts in `/assets/contracts`

### Build Game

- Install Cocos Creator: https://www.cocos.com/en/creator (this game was built by version 2.2.0, use higher version may lead to lost metadata when open scene).
- Open project, you will see 2 scene: `Home` and `PlayGame`
- All connection beetween game and blockchain was implemented in class `Web3Controller`, in case you want to use your own smart contract, change the `ContractABI` inside the `Web3Controller` component.
- Select `Browser` and run it.
- If you want to publish anywhere on internet, built it and deploy on your server. References here: https://docs.cocos2d-x.org/creator/manual/en/publish/publish-web.html

## Known issues and Future development

- Due to short development duration, of course we made some bugs!
- Because we have many asynchronous actions, sometime it will not update page when transaction is completed or when switch network.
- In future, we will solve all bugs, and support more chain like Mainchain, Ropsten, Kovan, Loom, Tomochain....

_Enjoy Coding_
