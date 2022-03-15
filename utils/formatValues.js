const Numeral = require('numeral');

module.exports = {
  toDisplayNumber: (value) => {
    return Numeral(value / 10**18, 18, 6).format('0,0.000')

  }
}


