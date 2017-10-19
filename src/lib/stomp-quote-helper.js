/* 依赖stomp.js
 
    提供

*/


window.QuoteHelper = function(url) {
  this.url = url;
  // this.stomp = Stomp.client(url);
  this.stomp = null;

  this.subscriptions = {}; // key is subid, value is {dest, callback} 
}


QuoteHelper.prototype.a = function() {
  // console.log("QuoteHelper.prototype.a");
}

// 这个逻辑专门用来处理断线重连的情况。
QuoteHelper.prototype.reconnect = function(login, passcode, connect_callback, error_callback, host) {
  // console.log("QuoteHelper.prototype.reconnect ");
  if (!this.stomp) {
    // console.log("!this.stomp");
    this.stomp = Stomp.client(this.url);
  }
  if (!this.stomp.connected) {
    // console.log("!this.stomp.connected");
    this.stomp = Stomp.client(this.url);
  }

  var self = this;
  return this.stomp.connect(login, passcode,
    function() { // 重连上之后 重新订阅。
      // console.log("reconnected.");
      for (var subid in self.subscriptions) {
        if (self.subscriptions.hasOwnProperty(subid)) {
          var sub = self.subscriptions[subid];
          var destination = sub.dest;
          var callback = sub.callback;
          self.stomp.subscribe(destination, callback, { "id": subid });
        }
      }
    },
    function() {
      // console.log("reconnect stomp");
      self.reconnect(login, passcode);
    },
    host);
}

QuoteHelper.prototype.connect = function(login, passcode, connect_callback, error_callback, host) {
  // console.log("QuoteHelper.prototype.connect ");
  if (!this.stomp) {
    this.stomp = Stomp.client(this.url);
  }

  var self = this;
  return this.stomp.connect(login, passcode, connect_callback,
    function() {
      console.log("reconnect stomp");
      self.reconnect(login, passcode);
    },
    host);
}


QuoteHelper.prototype.connected = function() {
  return this.stomp.connected;
}

/*
 *   
 */
QuoteHelper.prototype.subscribe = function(subid, destination, callback) {
  // console.log("QuoteHelper.prototype.subscribe " + destination + " " + callback);
  this.subscriptions[subid] = { "dest": destination, "callback": callback };
  return this.stomp.subscribe(destination, callback, { "id": subid });
  //return this.stomp.subscribe(destination, callback, {"id": "sub-123"});
}


/*
 *   
 */
QuoteHelper.prototype.unsubscribe = function(subid) {
  // console.log("QuoteHelper.prototype.unsubscribe " + subid);

  //console.log("subid list: ");
  //for (var subid in this.subscriptions) {
  //    if (this.subscriptions.hasOwnProperty(subid)) {
  //        console.log("    subid: " + subid);
  //    }
  //}

  delete this.subscriptions[subid];

  //console.log("subid list: ");
  //for (var subid in this.subscriptions) {
  //    if (this.subscriptions.hasOwnProperty(subid)) {
  //        console.log("    subid: " + subid);
  //    }
  //} 
  return this.stomp.unsubscribe(subid);
}



/*
 *   
 */
QuoteHelper.prototype.subscribe_adv = function(subid, symbol, callback) {
  // console.log("QuoteHelper.prototype.subscribe " + symbol + " " + callback);
  if (this.subscriptions[subid]) {
    return error;
  }
  // 前辈。 表示正在订阅这个symbol的另一个subscription。
  var senpai = null;
  // TODO 从this.subscriptions里找到senpai。
  if (senpai) {
    sub_value = {
      "symbol": symbol,
      "stomp_sub_id": senpai["stomp_sub_id"],
      "callback": callback
    };
  } else {
    var stomp_sub_id = null;
    // TODO 对stomp进行一个新的订阅。赋值给stomp_sub_id。
    sub_value = {
      "symbol": symbol,
      "stomp_sub_id": stomp_sub_id,
      "callback": callback
    };
  }
  return ok;
}


/*
 *   
 */
QuoteHelper.prototype.unsubscribe_adv = function(subid) {
  // console.log("QuoteHelper.prototype.subscribe " + symbol + " " + callback);
  var subscription = this.subscriptions[subid]
  if (!subscription) { // 不存在这个订阅id。
    return;
  }
  var need_unsubscribe = false;
  // TODO 找到this.subscriptions中是否有和subscription订阅同样symbol的其它订阅，如果没有则 need_unsubscribe = true;

  if (need_unsubscribe) {
    // TODO 对stomp 进行unsubscribe。
  }
}