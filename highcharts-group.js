/*******************************************************************************
 * Highcharts 拓展插件，实现 图表的多个图表联动
 * 
 * @version 1.0
 * @author Wangch
 * @time 2016.2.11
 ******************************************************************************/
(function() {
	/*
	 * 命名空间 Highcharts.Group
	 */
	var highcharts = window['Highcharts'] = window['Highcharts'] || {};

	var group = highcharts.Group = constructor;

	/**
	 * 构造函数
	 * 
	 * @param callback
	 *            计算相关性点时的回调计算方法
	 * @param xy
	 *            往 x轴还是y轴添加标线,x轴=1，y轴=2
	 * @param xy_index
	 *            多条坐标轴时，坐标轴索引
	 */
	function constructor(callback, xy, xy_index) {
		// 所有托管的图表
		this.charts = [];
		this.xy = xy && xy === 2 ? xy : 1;
		this.xy_index = xy_index || 0;

		// 计算点相关性 算法
		this.relatedPointCalcCallBack = callback;

	}
	/**
	 * 设置 xy轴
	 * 
	 * @param xy
	 *            往 x轴还是y轴添加标线,x轴=1，y轴=2
	 */
	group.prototype.setXy = function(xy) {
		this.xy = xy && xy === 2 ? xy : 1;
	}
	/**
	 * 设置多坐标轴索引
	 * 
	 * @param xy_index
	 *            多条坐标轴时，坐标轴索引
	 */
	group.prototype.setXy_index = function(xy_index) {
		this.xy_index = xy_index || 0;
	}

	/**
	 * @param callback
	 *            计算相关性点时的回调计算方法
	 */
	group.prototype.setRelatedPointCalcCallBack = function(
			relatedPointCalcCallBack) {
		this.relatedPointCalcCallBack = callback;
	}

	/**
	 * 增加分组图表
	 * 
	 * @param chart
	 *            图表对象 (多个)
	 */
	group.prototype.addCharts = function() {
		for (var i = 0; i < arguments.length; i++) {
			var chart = arguments[i];
			chart.group = this;// 附加属性

			this.charts.push(chart);
		}
	}

	/**
	 * @作废
	 */
	group.addEventHandle = function(chart) {
		//
		$.each(chart.series, function(i, v) {
			Highcharts.addEvent(v, 'mouseOut', function() {
				console.info('mouseOut');
			});
			$.each(v.points, function(j, p) {
				Highcharts.addEvent(p, 'mouseOver', function() {
					console.info('mouseOver');
				});
			});
		});
	}

	/**
	 * 图表 鼠标悬停相应处理函数
	 */
	group.prototype.mouseOver = function(event) {
		var chart = this.series.chart;
		var _group = chart.group;
		group.drawGroupMarkLine.call(_group, chart, _group.xy === 2 ? this.y
				: this.x);// 通过 call 改变 this作用域，访问
	}
	/**
	 * 鼠标移出 图表 响应处理函数
	 */
	group.prototype.mouseOut = function(event) {
		var _current = this.chart;
		var id = group.GroupMarkLineId;
		var charts = _current.group.charts;
		for (var i = 0; i < charts.length; i++) {
			var chart = charts[i];
			if (chart === _current) {
				// console.info('相同图表不做操作');
				continue;
			}
			group.removeChartMarkLine(chart, id);
			group.hideTooltip(chart);
		}
	}

	/**
	 * 群组 公共图表标线id
	 */
	group.GroupMarkLineId = '__temp_$_GroupMarkLineId_$_';

	/**
	 * 展示分组提示信息
	 * 
	 * @param chart
	 *            图表
	 * @value 值
	 */
	group.displayPoints = function(chart, value) {
		var _group = chart.group;// 分组对象
		var series = chart.series;
		var points = [];
		$.each(series, function(i, v) {
			var serie = v;
			var datas = serie.data;
			$.each(datas, function(i, point) {
				// 如果有设置人为的回调计算方法，调用它
				if (this.relatedPointCalcCallBack) {
					if (this.relatedPointCalcCallBack(point, value)) {
						points.push(point);
					}
				} else {
					// 没有设置人为回调计算方法，默认算法 判断等于
					if (group.defaultRelatedPointCalc(point, value, this.xy)) {
						points.push(point);
					}
				}
			});
		});

		group.showTooltip(chart, points);
	}

	/**
	 * 绘制 分组标线
	 * 
	 * @param _currentChart
	 * @param value
	 *            坐标轴值
	 * @param includeCurrent
	 *            是否包含当前图表
	 */
	group.drawGroupMarkLine = function(_currentChart, value, includeCurrent) {
		if (!includeCurrent)
			includeCurrent = false;
		var id = group.GroupMarkLineId;
		$.each(this.charts, function(i, chart) {
			if (chart === _currentChart && !includeCurrent) {
				// console.info('相同图表不做操作');

			} else {
				var _group = chart.group;
				var _d = {
					value : value,// 坐标轴上的值
					dashStyle : 'longdashdot',// 样式,longdashdot,Dot
					width : 2,
					color : 'green',
					id : id
				}
				group.removeChartMarkLine.call(_group, chart, id);
				group.addChartMarkLine.call(_group, chart, _d);
				group.displayPoints.call(_group, chart, value);
			}
		});

	}

	/**
	 * 静态方法，向图表上增加标线
	 * 
	 * @param chart
	 *            图表对象
	 * @param data
	 *            增加标线的属性
	 * @param xy
	 *            向X轴 还是Y轴增加标线，x轴=1，y轴=2，默认x轴
	 * @param xy_index
	 *            如果坐标轴有多条的时候，使用那个坐标轴作为标准，默认第一个坐标轴
	 */
	group.addChartMarkLine = function(chart, data, xy, xy_index) {
		var _d = {
			value : 2,// 坐标轴上的值
			dashStyle : 'longdashdot',// 样式,longdashdot,Dot
			width : 2,
			color : '#000',
			id : 'plot-line-'
		}
		/**
		 * { //在x轴上增加 value:2*i, //在值为2的地方 width:2, //标示线的宽度为2px color: '#000',
		 * //标示线的颜色 id: 'plot-line-'+i+'' //标示线的id，在删除该标示线的时候需要该id标示 }
		 */
		if (!xy_index) {
			xy_index = 0;
		}
		if (!xy) {
			xy = 1;
		}
		if (xy == 2) {
			chart.yAxis[xy_index].addPlotLine(data);
		} else {
			chart.xAxis[xy_index].addPlotLine(data);
		}
	}

	/**
	 * 静态方法，删除 图表标线
	 * 
	 * @param chart
	 *            图表对象
	 * @param id
	 *            要删除的标线的ID
	 * @param xy
	 *            向X轴 还是Y轴增加标线，x轴=1，y轴=2，默认x轴
	 * @param xy_index
	 *            如果坐标轴有多条的时候，使用那个坐标轴作为标准，默认第一个坐标轴
	 */
	group.removeChartMarkLine = function(chart, id, xy, xy_index) {
		if (!xy) {
			xy = 1;
		}
		if (!xy_index) {
			xy_index = 0;
		}
		if (xy == 2) {
			chart.yAxis[xy_index].removePlotLine(id);
		} else {
			chart.xAxis[xy_index].removePlotLine(id);
		}
	}

	/**
	 * 计算相关点 的默认计算方法
	 * 
	 * @param 图表点对象
	 *            point.x,point.y
	 * @param value
	 *            要比较的值
	 * @param xy
	 *            x坐标轴 还是y
	 */
	group.defaultRelatedPointCalc = function(point, value, xy) {
		xy = xy && xy === 2 ? xy : 1;
		return xy === 1 ? point.x === value : point.y === value;
	}

	/**
	 * 显示 highcharts 气泡提示
	 * 
	 * @param chart
	 *            图表对象
	 * @param points
	 *            要展示数据点
	 */
	group.showTooltip = function(chart, points) {
		chart.tooltip.refresh(points);
	}
	/**
	 * 隐藏 highcharts 气泡提示
	 * 
	 * @param chart
	 *            图表对象
	 */
	group.hideTooltip = function(chart) {
		chart.tooltip.hide();
	}

})();
