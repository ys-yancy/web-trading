/**
 * 柱形图
 */

var Base = require('../../app/base');
function CreateLineasisc() {
	CreateLineasisc.superclass.constructor.apply(this, arguments);
	this._init();
}

Base.extend(CreateLineasisc, Base, {
	_init: function() {
		this._initAreaChart();
	},

	getInstance: function() {
    	return this.instance;
  	},

  	_initAreaChart() {
  		var chartWrapEl = this.el,
  			series_name = this.chartName,
  			series_data = this.data;

  		this.instance = chartWrapEl.highcharts({
  			chart: {
  				type: 'line',
  				className: 'high-chart-line',
		        reflow: true,
		        pinchType: 'x',
		        zoomType: '',
		        panning: true
  			},

  			title: {
  				useHTML: true,
  				text: '最大回撤',
  				align: 'left',
  				x: 10,
  				y: -10,
		        style: {
		          	fontSize: '0.75rem',
		          	color: '#7C7C7C'
		        }
		    },

      		colors: ['#2dcea4'],

		    credits: {
		        enabled: false
		    },

		    exporting: {
		        enabled: false
		    },

	      	navigator: {
	        	enabled: false
	      	},

	      	legend: {
	      		enabled: false
	      	},

		    scrollbar: {
		        enabled: false,
		        liveRedraw: false
		    },

		    // plotOptions: {
		    // 	series: {
		    // 		color: '#3BB8E6',
		    // 		negativeColor: '#FF8E32'
		    // 	}
		    // },

		    xAxis: {
		    	type: 'datetime',
		    	gridLineWidth: 1,
		    	gridLineColor: '#F6F6F6',
		    	gridLineDashStyle: 'Solid'
		    },

		    yAxis: {
		    	gridLineColor: '#F6F6F6',
		    	gridLineDashStyle: 'Solid',
		    	title: {
		    		style: {
		    			display: 'none'
		    		}
		    	}
		    },

		    tooltip: {
		    	useHTML: true,
		        formatter: function(e) {
		          return '<p>&nbsp;' + this.y + '&nbsp;</p>'
		        },
		        backgroundColor: '#3AB9E6',
	            borderWidth: 0,
	            borderRadius: 0,
	            shadow: false,
	            style: {
	            	color: '#fff',
	              	padding: 5
	            }
		    },

		    series: [{ 
		    	name: series_name,
		    	data: series_data,
		    	color: '#FF8D30'
		    }]

  		})
  	}
})

module.exports = CreateLineasisc;