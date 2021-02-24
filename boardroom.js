const Web3 = require('web3');
const Dagger = require('@maticnetwork/dagger');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const abi = require('./build/VestedVaultBoardroom.json').abi;
const tokenAbi = require('./build/ERC20.json').abi;
const { getCoinIdFromGecko, getPriceFromGecko } = require('./coingecko');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const dagger = new Dagger("wss://mainnet.dagger.matic.network")
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const web3Contract = new web3.eth.Contract(abi, process.env.BOARDROOM_ADDRESS);
const contract = dagger.contract(web3Contract);


/**
 * Some state variables so that variable we need every now and then
 * are assigned and not around only once.
 */
let tokens = [];
let symbols = [];
let tokenGeckoIds = [];


/**
 * Set's the global state variable of our script.
 */
const setTokenInfo = async (contract) => {
  // Get the token0 and token1 for the pair.
  token = await contract.methods.token().call();

  // Create a contract just to get the details info for each
  // of theset tokens.
  // NOTE: currently this contract is just used to extract the token
  // symbols.
  const tokenContract = new web3.eth.Contract(tokenAbi, token);

  // Finally find the symbols of these tokens.
  symbol = await tokenContract.methods.symbol().call();

  // Set the coin gecko id for these particular tokens.
  tokenGeckoId = await getCoinIdFromGecko(symbol);
}


/**
 * Send message to the telegram channel.
 * @param {object} details
 */
const sendMessage = (details) => {
  const messageTemplate = `
🚀 **${tradeDetails.action} ${Number(web3.utils.fromWei(tradeDetails.amount, 'ether')).toPrecision(6)} ${tradeDetails.symbol}  on Vault.


🟢  1 ${tradeDetails.symbol}   = ${tradeDetails.usdPrice || '-'}$ | ${tradeDetails.ethPrice || '-'}ETH  🟢


📶 Tx 📶 [View](https://etherscan.io/tx/${tradeDetails.txHash})
📶 Vault 📶 [View](https://etherscan.io/address/${process.env.VAULT_ADDRESS})


Join $${tradeDetails.symbol} |  Telegram here (https://t.me/MahaDAO)
  `

  bot.sendMessage(
    process.env.CHAT_ID,
    messageTemplate,
    { parse_mode: "Markdown" }
  );
}

/**
 * Parses the object and converts it into the form that is printable.
 * It is dynamic such that would work if any token is main protocol token that we want to track.
 * @param {object} bond
 */
const parseBotMessage = async (action = 'Bonded', bond) => {
  const priceUSD = await getPriceFromGecko(tokenGeckoId, 'usd');
  const priceETH = await getPriceFromGecko(tokenGeckoId, 'eth');

  console.log(bond);

  let messageObj = {
    action: action,
    txHash: bond.transactionHash,
    amount: bond.returnValues.reward,
    usdPrice: priceUSD,
    ethPrice: priceETH,
    tokenSymbol: symbol
  }

  sendMessage(messageObj);
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
