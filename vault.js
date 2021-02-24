const Web3 = require('web3');
const Dagger = require('@maticnetwork/dagger');

require('dotenv').config();
const abi = require('./build/Vault.json').abi;
const tokenAbi = require('./build/ERC20.json').abi;
const { sendVaultEventMessage } = require('./telegrambot');
const { getCoinIdFromGecko, getPriceFromGecko } = require('./coingecko');

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
    tokenSymbol: symbol
  }

  sendVaultEventMessage(messageObj);
}


const main = async () => {
  await setTokenInfo();

  const bondedFilter = contract.events.Bonded({
    room: "latest"
  });

  bondedFilter.watch((data, removed) => {
    console.log(data);
    if (!removed) parseBotMessage(action = 'Bonded', data);
  });
}


main();
