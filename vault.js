const Web3 = require('web3');
const _ = require('underscore');
const rp = require('request-promise');
const Dagger = require('@maticnetwork/dagger');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const abi = require('./build/Vault.json').abi;
const tokenAbi = require('./build/ERC20.json').abi;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const dagger = new Dagger("wss://mainnet.dagger.matic.network")
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const web3Contract = new web3.eth.Contract(abi, process.env.VAULT_ADDRESS);
const contract = dagger.contract(web3Contract);


/**
 * Some state variables so that variable we need every now and then
 * are assigned and not around only once.
 */
let token = null;
let symbol = null;
let tokenGeckoId = null;


/**
 * Get's the coin gecko's identifier coin-id for a coin from Coin Gecko API.
 * @param {string} coinSymbol
 */
const getCoinIdFromGecko = async (coinSymbol) => {
  const coinList = JSON.parse(await rp(
    `https://api.coingecko.com/api/v3/coins/list`
  ));

  const token = _.filter(coinList, (list) => list.symbol.toLowerCase() === coinSymbol.toLowerCase())

  if (token.length > 1) throw Error('There are more than 1 token with same symbol');

  return token[0].id;
}


/**
 * Get's the price in req. currency from Coin Gecko API.
 * @param {string} coinId
 * @param {string} currency
 */
const getPriceFromGecko = async (coinId = 'mahadao', currency = 'usd') => {
  try {
    const priceInJsonString = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,eth`);

    if (!priceInJsonString.includes(coinId)) return null;

    return JSON.parse(priceInJsonString)[coinId][currency];
  } catch (e) {
    return null;
  }
}


/**
 * Set's the global state variable of our script.
 */
const setTokenInfo = async () => {
  // Get the token0 and token1 for the pair.
  token = await web3Contract.methods.token().call();

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
    amount: bond.returnValues.amount,
    usdPrice: priceUSD,
    ethPrice: priceETH,
    tokenSymbol: symbol0
  }

  sendMessage(messageObj);
}


const main = async () => {
  await setTokenInfo();

  const filter = contract.events.Bonded({
    room: "latest"
  });

  filter.watch((data, removed) => {
    console.log(data);
    if (!removed) parseBotMessage(action = 'Bonded', data);
  });
}


main();
