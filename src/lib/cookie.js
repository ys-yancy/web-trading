module.exports = {
	/**
	 * 将数组放置的localstorage: 类似于map的set方法， 如果value不是string对象，会用JSON.stringify转化为string；
	 * @method setCookie
	 * @public
	 * @static
	 * @param {String} key key
	 * @param {String} value 值
	 * @param {Object} option 配置
	 */
	
	set: function(key, value, option) {
		if (this.isSuppLocalStorage()) {
			var isExpire = option ? option.expires : null,
				expireTime = isExpire ? isExpire : Infinity;
			if( expireTime !== Infinity ) {
				expireTime = Date.now() + parseFloat(expireTime);
			}

			if(typeof(value) !== "string") {
				value = JSON.stringify(value);
			}
			try{
				value = value +  ":" + expireTime;
				window.localStorage.setItem(key, value);
				return true;
			}catch(e){}

		}

		return false;
	},

	/**
	 * 从localstorage中获得数据
	 * @menth 
	 * @public
	 * @static
	 * @param {String} key key
	 * @return { String } if not exits, return null
	 */
	
	get: function(key) {
        if (this.isSuppLocalStorage()) {
        	var storageItem = window.localStorage.getItem(key);
        	if( !storageItem ) {
        		return null;		
        	} else {
        		var items = storageItem.split(':');
        	
	        	var value = items[0], 
	        		expireTime = items[1] ? items[1] : 'Infinity';

	        	if( expireTime.indexOf('Infinity') !== -1 ) {
	        		return value;
	        	} else {
	        		var nowDate = Date.now(), 
	        			oldDate = parseFloat(expireTime);
	        			
	        		if( oldDate - nowDate ) {  // 没有过期
	        			return value;
	        		} else {
	        			return null
	        		}

	        	}
        	}
        }
        return null;
    },

    /**
     * 清除 localStorage
     * @method expire
     * @public
     * @static
     * @param {String} key key
     */
    expire: function(key) {
        if (this.isSuppLocalStorage()) {
            return window.localStorage.removeItem(key);
        }
    },

    /**
     * 清除所有localStorage
     * @method clearAll
     * @public
     * @static
     */
    clearAll: function() {
        if (this.isSuppLocalStorage()) {
            return window.localStorage.clear();
        }
    },

    /**
     * 判断是否支持localStorage，并且开启
     * @method isSuppLocalStorage
     * @public
     * @static
     * @return {Boolean} ret
     */
    isSuppLocalStorage: function() {
        if (this.supportStorage !== undefined) {
            return this.supportStorage;
        }
        try {
            if (window.localStorage === 'undefined') {
                this.supportStorage = false;
                return false;
            } else {
                var key = 'testSupportKey';
                var support;
                window.localStorage.setItem(key, '1');
                var value = window.localStorage.getItem(key);
                window.localStorage.removeItem(key);
                support = '1' === value ? true : false;

                this.supportStorage = support;
                return support;
            }
        } catch (e) {}
        this.supportStorage = false;
        return false;
    }
}