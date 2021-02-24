const Web3 = require('web3');
const Dagger = require('@maticnetwork/dagger');

require('dotenv').config();
const { bot } = require('./telegrambot');
const abi = require('./build/UniswapV2Pair.json').abi;
const tokenAbi = require('./build/UniswapV2ERC20.json').abi;
const { getCoinIdFromGecko, getPriceFromGecko } = require('./coingecko');

const dagger = new Dagger("wss://mainnet.dagger.matic.network")
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const web3Contract = new web3.eth.Contract(abi, process.env.UNISWAP_PAIR_ADDRESS);
const contract = dagger.contract(web3Contract);


/**
 * Some state variables so that variable we need every now and then
 * are assigned and not around only once.
 */
const uniswapSwapGlobalState = {
  token0 = null,
  token1 = null,
  symbol0 = null,
  symbol1 = null,
  token0GeckoId = null,
  token1GeckoId = null,
  isToken0ProtocolToken = false,
}


/**
 * Set's the global state variable of our script.
 */
const setTokenInfo = async () => {
  // Get the token0 and token1 for the pair.
  uniswapSwapGlobalState.token0 = await web3Contract.methods.token0().call();
  uniswapSwapGlobalState.token1 = await web3Contract.methods.token1().call();

  // Create a contract just to get the details info for each
  // of theset tokens.
  // NOTE: currently this contract is just used to extract the token
  // symbols.
  const token0Contract = new web3.eth.Contract(tokenAbi, uniswapSwapGlobalState.token0);
  const token1Contract = new web3.eth.Contract(tokenAbi, uniswapSwapGlobalState.token1);

  // Finally find the symbols of these tokens.
  uniswapSwapGlobalState.symbol0 = await token0Contract.methods.symbol().call();
  uniswapSwapGlobalState.symbol1 = await token1Contract.methods.symbol().call();

  // Check if protocol token is the same as token0 of the uniswap pair.
  uniswapSwapGlobalState.isToken0ProtocolToken = (
    uniswapSwapGlobalState.token0.toLowerCase() === process.env.PROTOCOL_TOKEN_ADDRESS.toLowerCase()
  );

  // Set the coin gecko id for these particular tokens.
  uniswapSwapGlobalState.token0GeckoId = await getCoinIdFromGecko(uniswapSwapGlobalState.symbol0);
  uniswapSwapGlobalState.token1GeckoId = await getCoinIdFromGecko(uniswapSwapGlobalState.symbol1);
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

  const price0USD = await getPriceFromGecko(uniswapSwapGlobalState.token0GeckoId, 'usd');
  const price0ETH = await getPriceFromGecko(uniswapSwapGlobalState.token0GeckoId, 'eth');

  const price1USD = await getPriceFromGecko(uniswapSwapGlobalState.token1GeckoId, 'usd');
  const price1ETH = await getPriceFromGecko(uniswapSwapGlobalState.token1GeckoId, 'eth');

  let messageObj = null;

  // Check if token0 is our main protocol token or not.
  if (uniswapSwapGlobalState.isToken0ProtocolToken) {
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
      mainTokenSymbol: uniswapSwapGlobalState.symbol0,
      secondaryTokenAmount: token1Amount,
      secondaryTokenPriceUSD: price1USD,
      secondaryTokenPriceETH: price1ETH,
      secondaryTokenSymbol: uniswapSwapGlobalState.symbol1
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
      mainTokenSymbol: uniswapSwapGlobalState.symbol1,
      secondaryTokenAmount: token0Amount,
      secondaryTokenPriceUSD: price0USD,
      secondaryTokenPriceETH: price0ETH,
      secondaryTokenSymbol: uniswapSwapGlobalState.symbol0
    }
  }

  sendUniswapSwapMessage(messageObj);
}


const main = async () => {
  await setTokenInfo();

  const filter = contract.events.Swap({
    room: "latest"
  });

  filter.watch((data, removed) => {
    if (!removed) parseBotMessage(data);
  });
}


main();
