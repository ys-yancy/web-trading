var Stomp = require('../common/stomp');
var Util = require('./util');

var symbolStomp = null;

module.exports = {

  getPrice: function(symbols) {
    if (Util.supportWebsocket()) {
      if (!symbolStomp) {
        symbolStomp = new Stomp({
          symbols: symbols
        });
      }
      symbolStomp.add(symbols);

      var prices = symbolStomp.get(symbols);

      if (prices) {
        return prices;
      }
    }
  },

  add(symbolValue) {
    if (!symbolStomp) {
      return;
    }
    
    var params = {
      symbol: symbolValue.quote.symbol,
      askPrice: symbolValue.quote.ask_price[0],
      bidPrice: symbolValue.quote.bid_price[0],
      lastPrice: symbolValue.quote.last_price,
      bid_price: symbolValue.quote.bid_price,
      ask_price: symbolValue.quote.ask_price
    };

    symbolStomp.updatePrice(params);
  }

}