const Web3 = require('web3');
const Dagger = require('@maticnetwork/dagger');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const abi = require('./build/VestedVaultBoardroom.json').abi;
const tokenAbi = require('./build/ERC20.json').abi;
const { sendBoardroomEventMessage } = require('./telegrambot');
const { getCoinIdFromGecko, getPriceFromGecko } = require('./coingecko');


const dagger = new Dagger("wss://mainnet.dagger.matic.network")
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const web3Contract = new web3.eth.Contract(abi, process.env.BOARDROOM_ADDRESS);
const contract = dagger.contract(web3Contract);


/**
 * Some state variables so that variable we need every now and then
 * are assigned and not around only once.
 */
const boardroomGlobalState = {
  token: null,
  symbol: null,
  tokenGeckoId: null
}


/**
 * Set's the global state variable of our script.
 */
const setTokenInfo = async (contract) => {
  // Get the token0 and token1 for the pair.
  boardroomGlobalState.token = await contract.methods.token().call();

  // Create a contract just to get the details info for each
  // of theset tokens.
  // NOTE: currently this contract is just used to extract the token
  // symbols.
  const tokenContract = new web3.eth.Contract(tokenAbi, boardroomGlobalState.token);

  // Finally find the symbols of these tokens.
  boardroomGlobalState.symbol = await tokenContract.methods.symbol().call();

  // Set the coin gecko id for these particular tokens.
  boardroomGlobalState.tokenGeckoId = await getCoinIdFromGecko(boardroomGlobalState.symbol);
}

/**
 * Parses the object and converts it into the form that is printable.
 * It is dynamic such that would work if any token is main protocol token that we want to track.
 * @param {object} bond
 */
const parseBotMessage = async (action = 'Bonded', bond) => {
  const priceUSD = await getPriceFromGecko(boardroomGlobalState.tokenGeckoId, 'usd');
  const priceETH = await getPriceFromGecko(boardroomGlobalState.tokenGeckoId, 'eth');

  console.log(bond);

  let messageObj = {
    action: action,
    txHash: bond.transactionHash,
    amount: bond.returnValues.reward,
    usdPrice: priceUSD,
    ethPrice: priceETH,
    tokenSymbol: boardroomGlobalState.symbol
  }

  sendBoardroomEventMessage(messageObj);
}


const main = async () => {
  await setTokenInfo();

  const rewardPaidFilters = contracts.map(contract => contract.events.RewardPaid({
    room: "latest"
  }))

  for (const filter of rewardPaidFilters) {
    filter.watch((data, removed) => {
      if (!removed) parseBotMessage(action = 'Reward claimed', data);
    })
  }

  const rewardAddedFilters = contracts.map(contract => contract.events.RewardAdded({
    room: "latest"
  }))

  for (const filter of rewardAddedFilters) {
    filter.watch((data, removed) => {
      if (!removed) parseBotMessage(action = 'Rewards added', data);
    })
  }
}


main();
