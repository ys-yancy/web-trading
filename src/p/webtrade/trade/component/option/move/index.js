require('../../../../../../common/moveSymbol');

export default class MoveSymbol {
	constructor(el) {
		this.el = el;
		this._init();
		this._getCookieSymbols()
	}

	_init() {
		this.el.initTable({
			hover:true,
            selected:true,
            rowMove:true,
            moveAfter: this.moveSymbolAfter,
            moveBefore: this.moveSymbolBefore,
            scope: this
		})
	}

	sortUp(data) {
	    var type = this.isDemo() ? 'demo' : 'real';
	    var symbols = this._getCookieSymbols();

	    var arr = [];

	    for (var i = 0, len = symbols.length; i < len; i++) {
	    	var symbol = symbols[i]
	    	if (symbol) {
	    		symbol = symbol.replace(/--/g, '.');
	    	}
	      
	      	var quote = get(symbol, data);
	        if (quote) {
	        	arr.push(quote);
	        }
	    }
	 
	    return arr.concat(data)


	    function get(symbol, data) {
	      for (var i = 0, len = data.length; i < len; i++) {
	        if (data[i].policy.symbol === symbol) {
	          var tmp = data[i];
	          data.splice(i, 1);

	          return tmp;
	        }
	      }
	    }
  	}

	moveSymbolAfter(e, targetEl, moveIndex) {
	    var curEl = $(e.currentTarget),
	      symbol = curEl.attr('data-symbol');

	    e.stopPropagation();
	    e.preventDefault();

	    var symbols = this._getCookieSymbols();
	    var index = symbols.indexOf(symbol);
	    if (index === -1) {
	      symbols = [symbol].concat(symbols);
	    } else {
	      var tmp = symbols[index];
	      symbols[index] = symbols[moveIndex];
	      symbols[moveIndex] = tmp;
	    }

	    this._setCookieSymbols(symbols);
  	}

  	moveSymbolBefore() {
  		console.log('moveSymbolBefore')
	}

	_getCookieSymbols() {
	    var type = this.isDemo() ? 'demo' : 'real';
	    var name = type + 'symboyup';
	    var symbols = JSON.parse(Cookie.get(name) || '[]');
	    return symbols;
  	}

  	_setCookieSymbols(symbols) {
	    var type = this.isDemo() ? 'demo' : 'real';
	    var name = type + 'symboyup';

	    Cookie.set(name, JSON.stringify(symbols));
	}

	isDemo() {
		return Cookie.get('type') === 'demo' || !Cookie.get('type');
	}
}