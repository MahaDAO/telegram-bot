const Web3 = require('web3');
const _ = require('underscore');
const rp = require('request-promise');
const Dagger = require('@maticnetwork/dagger');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const abi = require('./build/UniswapV2Pair.json').abi;
const tokenAbi = require('./build/UniswapV2ERC20.json').abi;


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const dagger = new Dagger("wss://mainnet.dagger.matic.network")
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const web3Contract = new web3.eth.Contract(abi, process.env.UNISWAP_PAIR_ADDRESS);
const contract = dagger.contract(web3Contract);


/**
 * Some state variables so that variable we need every now and then
 * are assigned and not around only once.
 */
let token0 = null;
let token1 = null;
let symbol0 = null;
let symbol1 = null;
let token0GeckoId = null;
let token1GeckoId = null;
let isToken0ProtocolToken = false;


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
 * Set's the global state variable of our script.
 */
const setTokenInfo = async () => {
  // Get the token0 and token1 for the pair.
  token0 = await web3Contract.methods.token0().call();
  token1 = await web3Contract.methods.token1().call();

  // Create a contract just to get the details info for each
  // of theset tokens.
  // NOTE: currently this contract is just used to extract the token
  // symbols.
  const token0Contract = new web3.eth.Contract(tokenAbi, token0);
  const token1Contract = new web3.eth.Contract(tokenAbi, token1);

  // Finally find the symbols of these tokens.
  symbol0 = await token0Contract.methods.symbol().call();
  symbol1 = await token1Contract.methods.symbol().call();

  // Check if protocol token is the same as token0 of the uniswap pair.
  isToken0ProtocolToken = token0.toLowerCase() === process.env.PROTOCOL_TOKEN_ADDRESS.toLowerCase();

  // Set the coin gecko id for these particular tokens.
  token0GeckoId = await getCoinIdFromGecko(symbol0);
  token1GeckoId = await getCoinIdFromGecko(symbol1);
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
 * Send message to the telegram channel.
 * @param {object} tradeDetails
 */
const sendMessage = (tradeDetails) => {
  const messageTemplate = `
🚀 **${tradeDetails.action} ${Number(web3.utils.fromWei(tradeDetails.mainTokenAmount, 'ether')).toPrecision(6)} ${tradeDetails.mainTokenSymbol}  for ${Number(web3.utils.fromWei(tradeDetails.secondaryTokenAmount, 'ether')).toPrecision(6)} ${tradeDetails.secondaryTokenSymbol}  on Uniswap


🟢  1 ${tradeDetails.mainTokenSymbol}   = ${tradeDetails.mainTokenPriceUSD || '-'}$ | ${tradeDetails.mainTokenPriceETH || '-'}ETH  🟢
🟢  1 ${tradeDetails.secondaryTokenSymbol} = ${tradeDetails.secondaryTokenPriceUSD || '-'}$ | ${tradeDetails.secondaryTokenPriceETH || '-'}ETH  🟢


📶 Tx 📶 [View](https://etherscan.io/tx/${tradeDetails.txHash})
🦄 Uniswap 🦄 [View](https://info.uniswap.org/pair/${process.env.UNISWAP_PAIR_ADDRESS})


Join $${tradeDetails.mainTokenSymbol} (${tradeDetails.mainTokenSymbol}) Telegram here (https://t.me/MahaDAO)
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
 * @param {object} swap
 */
const parseBotMessage = async (swap) => {
  let boughtOrSoldString = 'Bought';
  let token0Amount = 0;
  let token1Amount = 0;

  const price0USD = await getPriceFromGecko(token0GeckoId, 'usd');
  const price0ETH = await getPriceFromGecko(token0GeckoId, 'eth');

  const price1USD = await getPriceFromGecko(token1GeckoId, 'usd');
  const price1ETH = await getPriceFromGecko(token1GeckoId, 'eth');

  let messageObj = null;

  // Check if token0 is our main protocol token or not.
  if (isToken0ProtocolToken) {
    // If yes, then check if we are buying or selling.
    // Accordingly set the amount.
    if (swap.returnValues.amount0Out == 0) {
      boughtOrSoldString = 'Sold'

      token0Amount = swap.returnValues.amount0In;
      token1Amount = swap.returnValues.amount1Out;
    } else {
      boughtOrSoldString = 'Bought'

      token0Amount = swap.returnValues.amount0Out;
      token1Amount = swap.returnValues.amount1In;
    }

    messageObj = {
      action: boughtOrSoldString,
      txHash: swap.transactionHash,
      mainTokenAmount: token0Amount,
      mainTokenPriceUSD: price0USD,
      mainTokenPriceETH: price0ETH,
      mainTokenSymbol: symbol0,
      secondaryTokenAmount: token1Amount,
      secondaryTokenPriceUSD: price1USD,
      secondaryTokenPriceETH: price1ETH,
      secondaryTokenSymbol: symbol1
    }
  } else {
    // If no, then check again if we are buying or selling.
    // Accordingly, set the amounts.
    if (swap.returnValues.amount1Out == 0) {
      boughtOrSoldString = 'Sold'

      token1Amount = swap.returnValues.amount1In;
      token0Amount = swap.returnValues.amount0Out;
    } else {
      boughtOrSoldString = 'Bought'

      token1Amount = swap.returnValues.amount1Out;
      token0Amount = swap.returnValues.amount0In;
    }

    messageObj = {
      action: boughtOrSoldString,
      txHash: swap.transactionHash,
      mainTokenAmount: token1Amount,
      mainTokenPriceUSD: price1USD,
      mainTokenPriceETH: price1ETH,
      mainTokenSymbol: symbol1,
      secondaryTokenAmount: token0Amount,
      secondaryTokenPriceUSD: price0USD,
      secondaryTokenPriceETH: price0ETH,
      secondaryTokenSymbol: symbol0
    }
  }

  sendMessage(messageObj);
}


const main = async () => {
  await setTokenInfo();

  bot.sendMessage(
    process.env.CHAT_ID,
    `

    **BOT IS NOW LIVE! Get all the latest trades for the ** *${symbol0}-${symbol1}* ** pair from uniswap now!**

    `,
    { parse_mode: "Markdown" }
  );

  const filter = contract.events.Swap({
    room: "latest"
  });

  filter.watch((data, removed) => {
    if (!removed) parseBotMessage(data);
  });
}


main();
