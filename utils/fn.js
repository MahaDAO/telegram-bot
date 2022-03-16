const constants = require('./constants')

const botMessage = async(msg, chain, txHash) => {

  let chainLink = ''
  if(chain == 'matic' || chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
  }
  if(chain == 'bsc' || chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com/'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
  }

  let msgToReturn = `
  ${msg}

  *1 MAHA* = *$${await constants.getMahaPrice()}*
  *1 ETH* = *${await constants.getEthToMahaPrice()} MAHA*

  [MahaDAO](${chainLink}/token/${mahaToken}) *|* [📶 Tx Hash 📶 ](${chainLink}/tx/${txHash})
  `

  return msgToReturn
}

module.exports = {
  botMessage
}

