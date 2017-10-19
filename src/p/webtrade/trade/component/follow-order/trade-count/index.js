/**
 * 交易统计
 */
"use strict";

require('./index.css');
var Base = require('../../../../../../app/base');
var Util = require('../../../../../../app/util');
var chartsConfig = require('../../../../../../common/chart/char_config');
var CreateAreaBasisc = require('../../../../../../common/chart/area-basic');
var CreateLineBasisc = require('../../../../../../common/chart/line-basic');
var CreateColumnBasisc = require('../../../../../../common/chart/column-basic');
var ChartDesc = require('./chartDesc');

var tmpl = require('./index.ejs.html');
class TradeCount extends Base {
	constructor(config) {
		super(config)

		// chartsConfig.setOptions();
		this._render().then(() => {
			this._init();
		})
	}

	_init() {
		this._bind();
		this._initAttrs();
		this._initAreaChart();
		this._initLineChart();
		this._initColumnChart();
	}

	_bind() {
		this.el.on('mouseenter', '.J_AmountDesc', _.bind(this._showAmountDesc, this));

		this.el.on('mouseenter', '.J_ProfitDesc', _.bind(this._showProfitDesc, this));

		this.el.on('mouseenter', '.J_RetreatDesc', _.bind(this._showRetreatDesc, this));
	}

	_showAmountDesc(e) {
		var curEl = $(e.target);
		if ( getAccountBanlanceDesc() ) {
			new ChartDesc({
				referEl: curEl,
				content: getAccountBanlanceDesc()
			})
		}
	}

	_showProfitDesc(e) {
		var curEl = $(e.target);
		if ( getAccountProfitDesc() ) {
			new ChartDesc({
				referEl: curEl,
				content: getAccountProfitDesc()
			})
		}
	}

	_showRetreatDesc(e) {
		var curEl = $(e.target);
		if ( getMaxRetreatDesc() ) {
			new ChartDesc({
				referEl: curEl,
				content: getMaxRetreatDesc()
			})
		}
	}

	_initAreaChart() {
		this._request('balance').then((list) => {
			list = list.map((item) => {
				var arr = [];
				var time = item.date + ' ' + '00:00:00'
				arr.push(Util.getTime(time));
				arr.push(item.amount);
				return arr;
			})

			var renderEl = $('#J_TradeCountArea', this.el);
			var chartName = 'highchart-area';

			this.areaBasic = new CreateAreaBasisc({
				el: renderEl,
				chartName: chartName,
				data: list
			});
		})
	}

	_initColumnChart() {
		this._request('profit').then((list) => {
			list = list.map((item) => {
				var arr = [];
				var time = item.date + ' ' + '00:00:00'
				arr.push(Util.getTime(time));
				arr.push(item.amount);
				return arr;
			})

			var renderEl = $('#J_TradeCountColumn', this.el);
			var chartName = 'highchart-column';

			this.columnBasisc = new CreateColumnBasisc({
				el: renderEl,
				chartName: chartName,
				data: list
			})

		})
	}

	_initLineChart() {
		this._request('maxdrawdown').then((list) => {
			list = list.map((item) => {
				var arr = [];
				var time = item.date + ' ' + '00:00:00'
				arr.push(Util.getTime(time));
				arr.push(item.amount);
				return arr;
			})

			var renderEl = $('#J_TradeCountLine', this.el);
			var series_chart_name = 'highchart-line';

			this.lineBasisc = new CreateLineBasisc({
				el: renderEl,
				chartNames: series_chart_name,
				data: list
			})
		})
	}

	_request(source) {
		var data = {
			access_token: this.cookie.get('token'),
			expert_id: this.id
		}
		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.id +'/'+ source +'/history/',
  			data: data
		}).then((data) => {
			return data.data;
		})
	}

	_render() {
		var data = {
			access_token: this.cookie.get('token'),
			expert_id: this.id
		}
		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.id +'/trade/summary/',
  			data: data
		}).then((data) => {
			data = data.data;
			this.render(tmpl, data, this.el);
		})
	}

	destroy() {

	}
	
	_initAttrs() {
	}
}

module.exports = TradeCount;