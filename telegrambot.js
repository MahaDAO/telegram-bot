const TelegramBot = require('node-telegram-bot-api');


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });


/**
 * Send message to the telegram channel.
 * @param {object} tradeDetails
 */
const sendUniswapSwapMessage = (tradeDetails) => {
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



module.exports = {
  bot,
  sendUniswapSwapMessage
}
