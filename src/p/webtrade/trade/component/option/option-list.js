var Storage = require('../../../../../app/storage');
var key = 'my-option-symbol';

module.exports = {
  add(symbol) {
    var option = this.get();

    if (option.indexOf(symbol) === -1) {
      option.unshift(symbol);

      Storage.set(key, option);
    }
  },

  get() {
    if (!this.option) {
      this.option = JSON.parse(Storage.get(key)) || [];
    }
    return this.option;
  },

  has(symbol) {
    var option = this.get();

    return option.indexOf(symbol) !== -1;
  },

  del(symbol) {
    var option = this.get();

    var index = option.indexOf(symbol);
    if (index !== -1) {
      option.splice(index, 1);
      
      Storage.set(key, option);
    }
  }
};
