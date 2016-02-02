package controller

import (
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/sedotan/sedotan.v1"
	"github.com/eaciit/sedotan/sedotan.v1/webapps/modules"
	"github.com/eaciit/toolkit"
	"os"
	"path"
	f "path/filepath"
	// "reflect"
	// "strconv"
	// "time"
)

type WebGrabberController struct {
	App
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	var controller = new(WebGrabberController)
	controller.Server = s
	return controller
}

func (w *WebGrabberController) PrepareHistoryPath() {
	modules.HistoryPath = AppBasePath + f.Join("config", "webgrabber", "History") + string(os.PathSeparator)
	modules.HistoryRecPath = AppBasePath + f.Join("config", "webgrabber", "HistoryRec") + string(os.PathSeparator)
}

func (w *WebGrabberController) GetScrapperData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursor, err := colonycore.Find(new(colonycore.WebGrabber), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.WebGrabber{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) FetchContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	param := toolkit.M{} //.Set("formvalues", payload.Parameter)
	res, err := toolkit.HttpCall(payload.URL, payload.CallType, nil, param)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := toolkit.HttpContentString(res)
	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) StartService(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o, err := toolkit.ToM(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err, isRun := modules.Process([]interface{}{o})
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(isRun, nil, "")
}

func (w *WebGrabberController) InsertSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	wg := new(colonycore.WebGrabber)
	wg.CallType = "POST"
	wg.DataSettings = []*colonycore.DataSetting{
		&colonycore.DataSetting{
			ColumnSettings: []*colonycore.ColumnSetting{
				&colonycore.ColumnSetting{Alias: "Contract", Index: 0, Selector: "td:nth-child(1)"},
				&colonycore.ColumnSetting{Alias: "Open", Index: 0, Selector: "td:nth-child(2)"},
				&colonycore.ColumnSetting{Alias: "High", Index: 0, Selector: "td:nth-child(3)"},
				&colonycore.ColumnSetting{Alias: "Low", Index: 0, Selector: "td:nth-child(4)"},
				&colonycore.ColumnSetting{Alias: "Close", Index: 0, Selector: "td:nth-child(5)"},
				&colonycore.ColumnSetting{Alias: "Prev Settle", Index: 0, Selector: "td:nth-child(6)"},
				&colonycore.ColumnSetting{Alias: "Prev Settle", Index: 0, Selector: "td:nth-child(7)"},
				&colonycore.ColumnSetting{Alias: "Settle", Index: 0, Selector: "td:nth-child(8)"},
				&colonycore.ColumnSetting{Alias: "Chg", Index: 0, Selector: "td:nth-child(9)"},
				&colonycore.ColumnSetting{Alias: "Volume", Index: 0, Selector: "td:nth-child(10)"},
				&colonycore.ColumnSetting{Alias: "OI", Index: 0, Selector: "td:nth-child(11)"},
				&colonycore.ColumnSetting{Alias: "OI Chg", Index: 0, Selector: "td:nth-child(12)"},
				&colonycore.ColumnSetting{Alias: "Turnover", Index: 0, Selector: "td:nth-child(13)"},
			},
			ConnectionInfo: &colonycore.ConnectionInfo{
				Collection: "irondcecom",
				Database:   "valegrab",
				Host:       "localhost:27017",
			},
			DestinationType: "mongo",
			Name:            "GoldTab01",
			RowSelector:     "table .table tbody tr",
			RowDeleteCondition: toolkit.M{
				"$or": []toolkit.M{
					toolkit.M{"Contract": "Contract"},
					toolkit.M{"Contract": "Iron Ore Subtotal"},
					toolkit.M{"Contract": "Total"},
				},
			},
		},
	}
	wg.GrabConfiguration = toolkit.M{
		"data": toolkit.M{
			"Pu00231_Input.trade_date": 2.0151214e+07,
			"Pu00231_Input.trade_type": 0,
			"Pu00231_Input.variety":    "i",
			"Submit":                   "Go",
			"action":                   "Pu00231_result",
		},
	}
	wg.GrabInterval = 20
	wg.IntervalType = "seconds"
	wg.LogConfiguration = &colonycore.LogConfiguration{
		FileName:    "LOG-GRABDCE",
		FilePattern: "20060102",
		LogPath:     path.Join(AppBasePath, "config", "webgrabber", "log"),
	}
	wg.ID = "irondcecomcn"
	wg.IDBackup = "irondcecomcn"
	wg.SourceType = "SourceType_Http"
	wg.TimeoutInterval = 5
	wg.URL = "http://www.dce.com.cn/PublicWeb/MainServlet"

	colonycore.Save(wg)

	return helper.CreateResult(true, wg, "")
}
