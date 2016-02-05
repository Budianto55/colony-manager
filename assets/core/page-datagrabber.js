app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.templateConfigScrapper = {
	_id: "",
	DataSourceOrigin: "",
	DataSourceDestination: "",
	IgnoreFieldsDestination: [],
	IntervalType: "seconds",
	GrabInterval: 20,
	TimeoutInterval: 20,
	Map: [],
	RunAt: []
};
dg.templateMap = {
	FieldOrigin: "",
	FieldDestination: ""
};
dg.templateIntervalType = [
	{ value: "seconds", title: "Seconds" }, 
	{ value: "minutes", title: "Minutes" }, 
	{ value: "hours", title: "Hours" }
];
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.scrapperIntervals = ko.observableArray([]);
dg.dataSourcesData = ko.observableArray([]);
dg.selectedDataGrabber = ko.observable('');
dg.selectedLogDate = ko.observable('');
dg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "Data Grabber ID", width: 130 },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{ title: "", width: 160, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='dg.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster' onclick='dg.stopTransformation(\"" + d._id + "\")()' title='Stop Transformation Service'><span class='fa fa-stop'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' onclick='dg.viewHistory(\"" + d._id + "\")' title='View History'><span class='fa fa-history'></span></button>", 
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Data Grabber' onclick='dg.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Data Grabber' onclick='dg.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },
	{ field: "DataSourceOrigin", title: "Data Source Origin", width: 150 },
	{ field: "DataSourceDestination", title: "Data Source Destination", width: 150 },
	{ field: "IntervalType", title: "Interval Unit" },
	{ field: "GrabInterval", title: "Interval Duration" },
	{ field: "TimeoutInterval", title: "Timeout Duration" },
]);
dg.logData = ko.observable('');
dg.historyData = ko.observableArray([]);
dg.historyColumns = ko.observableArray([
	{ field: "_id", title: "Number", width: 100, },
	{ field: "Date", title: "History At" },
	{ title: "&nbsp;", width: 200, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='dg.viewData(\"" + kendo.toString(d.Date, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text'></span> View Data</button>",
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='dg.viewLog(\"" + kendo.toString(d.Date, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text-o'></span> View Log</button>",
		].join(" ");
	}, filterable: false }
]);
dg.fieldOfDataSource = function (which) {
	return ko.computed(function () {
		var ds = Lazy(dg.dataSourcesData()).find({
			_id: dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]()
		});

		if (ds == undefined) {
			return [];
		}

		return ds.MetaData;
	}, dg);
};
dg.isDataSourceNotEmpty = function (which) {
	return ko.computed(function () {
		var dsID = dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]();

		return dsID != "";
	}, dg);
};
dg.fieldOfDataSourceDestination = ko.computed(function () {
	var ds = Lazy(dg.dataSourcesData()).find({
		_id: dg.configScrapper.DataSourceDestination()
	});

	if (ds == undefined) {
		return [];
	}

	return ds.MetaData;
}, dg);
dg.getScrapperData = function (){
	app.ajaxPost("/datagrabber/getdatagrabber", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.scrapperData(res.data);
		dg.checkTransformationStatus();
	});
};
dg.addMap = function () {
	var o = ko.mapping.fromJS($.extend(true, {}, dg.templateMap));
	dg.configScrapper.Map.push(o);
};
dg.removeMap = function (index) {
	return function () {
		var item = dg.configScrapper.Map()[index];
		dg.configScrapper.Map.remove(item);
	};
}
dg.createNewScrapper = function () {
	app.mode("editor");
	dg.scrapperMode('');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);
	dg.addMap();
};
dg.saveDataGrabber = function () {
	if (!app.isFormValid(".form-datagrabber")) {
		return;
	}

	var param = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/savedatagrabber", param, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		dg.backToFront();
		dg.getScrapperData();
	});
};
dg.backToFront = function () {
	app.mode("");
};
dg.getDataSourceData = function () {
	app.ajaxPost("/datasource/getdatasources", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.dataSourcesData(res.data);
	});
};
dg.editScrapper = function (_id) {
	dg.scrapperMode('edit');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);

	app.ajaxPost("/datagrabber/selectdatagrabber", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode("editor");
		dg.scrapperMode('editor');
		app.resetValidation("#form-add-scrapper");
		ko.mapping.fromJS(res.data, dg.configScrapper);
		
	});
};
dg.removeScrapper = function (_id) {
	swal({
		title: "Are you sure?",
		text: 'Data grabber with id "' + _id + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
	}, function() {
		setTimeout(function () {
			app.ajaxPost("/datagrabber/removedatagrabber", { _id: _id }, function (res) {
				if (!app.isFine(res)) {
					return;
				}

				swal({ title: "Data successfully deleted", type: "success" });
				dg.backToFrontPage();
			});
		}, 1000);
	});
};
dg.backToFrontPage = function () {
	app.mode('');
	dg.getScrapperData();
	dg.getDataSourceData();
};
dg.runTransformation = function (_id) {
	return function () {
		app.ajaxPost("/datagrabber/starttransformation", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			dg.checkTransformationStatus();
		});
	};
};
dg.stopTransformation = function (_id) {
	return function () {
		app.ajaxPost("/datagrabber/stoptransformation", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			dg.checkTransformationStatus();
		});
	};
};
dg.checkTransformationStatus = function () {
	dg.scrapperIntervals().forEach(function (interval) {
		try {
			clearInterval(interval);
		} catch (err) {
			console.log("interval err: ", _id, err);
		}
	});
	dg.scrapperIntervals([]);
	dg.scrapperData().forEach(function (each) {
		var process = function () {
			var $grid = $(".grid-data-grabber");
			var $kendoGrid = $grid.data("kendoGrid");
			var gridData = $kendoGrid.dataSource.data();

			app.ajaxPost("/datagrabber/stat", { _id: each._id }, function (res) {
				if (!app.isFine(res)) {
					return;
				}

				var row = Lazy(gridData).find({ _id: each._id });
				if (row == undefined) {
					row = { uid: "fake!" };
				}

				var $row = $grid.find("tr[data-uid='" + row.uid + "']");

				if (res.data) {
					$row.addClass("started");
				} else {
					$row.removeClass("started");
				}
			}, function (a) {
				var row = Lazy(gridData).find({ _id: each._id });
				if (row == undefined) {
					row = { uid: "fake!" };
				}

				var $row = $grid.find("tr[data-uid='" + row.uid + "']");

				$row.removeClass("started");
			});
		};

		process();
		dg.scrapperIntervals.push(setInterval(process, 10 * 1000));
	});
};
dg.viewHistory = function (_id) {
	app.ajaxPost("/datagrabber/selectdatagrabber", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("history");
		dg.selectedDataGrabber(_id);
		dg.historyData([]);
		res.data.RunAt.forEach(function (e, i) {
			dg.historyData.push({ _id: (i + 1), Date: e });
		});
	});
};
dg.backToHistory = function () {
	app.mode("history");
};
dg.viewLog = function (date) {
	var param = { 
		_id: dg.selectedDataGrabber(), 
		Date: date
	};
	app.ajaxPost("/datagrabber/getlogs", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("log");
		dg.selectedLogDate(date);

		var startLine = "SUCCESS " + moment(date, "YYYYMMDD-HHmmss")
			.format("YYYY/MM/DD HH:mm:ss");
		var message = res.data;
		message = startLine + message.split(startLine).slice(1).join(startLine);
		message = message.split("Starting transform!").slice(0, 2)
			.join("Starting transform!").split("SUCCESS");
		message = message.slice(0, message.length - 1).join("SUCCESS");
		message = $.trim(message);

		dg.logData(message.split("\n").map(function (e) { 
			return "<li>" + e + "</li>";
		}).join(""));
	});
};
dg.viewData = function (date) {
	var param = { 
		_id: dg.selectedDataGrabber(), 
		Date: date
	};
	app.ajaxPost("/datagrabber/gettransformeddata", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("data");
		dg.selectedLogDate(date);

		var columns = [{ title: "&nbsp" }];
		if (res.data.length > 0) {
			columns = [];
			var sample = res.data[0];
			for (key in sample) {
				if (sample.hasOwnProperty(key)) {
					columns.push({
						field: key,
						width: 100
					});
				}
			}
		}

		$(".grid-transformed-data").replaceWith("<div class='grid-transformed-data'></div>");
		$(".grid-transformed-data").kendoGrid({
			filterable: false,
			dataSource: {
				data: res.data,
				pageSize: 10
			},
			columns: columns
		});

		console.log(columns);
		console.log(res.data);
	});
};

$(function () {
	dg.getScrapperData();
	dg.getDataSourceData();
});
