const Numeral = require('numeral');
const ethers = require('ethers')
const {BigNumber} = require('ethers')


module.exports = {
  toDisplayNumber: (value) => {

    const bn = BigNumber.from(`${value}`);
    return ethers.utils.formatEther(bn)

  },
}


