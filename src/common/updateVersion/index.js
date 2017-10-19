var config = require('../../app/config');
var Base = require('../../app/base');
class UpdateVersion extends Base{
	constructor(config) {
		super(config);
		// this._init();
	}

	_init() {
		setTimeout(() => {
			this._update();
		}, 1000 * 15)
	}

	_update() {
		var isApp = this.isPcApk(),
			curVersion = this.cookie.get('pcApp_version');

		if ( isApp && curVersion == 2.0 ) {
			return;
		}

		this._request().then((res) => {
			this.cookie.set('pcApp_version', 2.0);
		})
	}

	_request(options) {
		return this.ajax({
			url: 'www',
			type: 'POST',
			data: {

			}
		});
	}

	isPcApk() {
		var pl = window.location.protocol;
		if ( pl.indexOf('file://') !== -1) {
			return true;
		} else {
			return false;
		}
	}
}

module.exports = UpdateVersion;