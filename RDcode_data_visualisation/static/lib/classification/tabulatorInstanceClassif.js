var tableClassif = new Tabulator("#classificationSelect", {
  data:[],         //load row data from array
  maxHeight:"100%", //do not let table get bigger than the height of its parent element
  index: "hchid",
  layout: "fitDataFill",     //fit columns to data
//  responsiveLayout: "hide",  //hide columns that dont fit on the table
  tooltips: false,            //show tool tips on cells
  history: false,            //allow undo and redo actions on the table
  pagination: false,        //'false': load all the data set provided then show them all
  movableColumns: false,    //allow column order to be changed
  resizableColumns:"header",//resize from header only
  resizableRows: false,     //row height
  selectable: true,         // selectable row without limit
  headerSort: false,
  headerSortTristate: false,
  rowSelectionChanged: function(data, rows) {
//    console.log(data);
    // prevent a bug before first initialization of classificationGraph.js
    try {
      graphConf.hchid = [];
      for (elem of data) {
        graphConf.hchid.push(elem["ID of the classification"]);
      }
      var inputLang = $("#mainInputLang").val();
      var inputValue = graphConf.startId;
      var Label = loadedMap.get(inputValue).label;
      classificationEntry(inputLang, inputValue, Label, graphConf, completeness=2, loadedMap, showClassif=false);
    } catch (error) {
//      console.log(error);
    }
  },

  columns: [
    {formatter: "rowSelection", titleFormatter: "rowSelection", hozAlign: "center", headerSort: false, width:20},
    {title: "Orphanet classification name", field: "Name of the classification"},
  ],
});

function showClassificationSelect(data) {
  var dataObject = {};
  var dataList = [];
  if (data) {
    // transform data list returned by the query to a list of named property
    for (elem of data) {
      dataObject = {};
      dataObject["ID of the classification"] = elem[0]; // not displayed anymore but needed to run the graph
      dataObject["Name of the classification"] = elem[1];
      graphConf.hchid.push(elem[0]);
      dataList.push(dataObject);
    }
    tableClassif.setData(dataList); // trigger rowSelectionChanged
    // initialize a full selection
    tableClassif.selectRow(); // trigger rowSelectionChanged
    tableClassif.redraw(true);

  } else {
    tableClassif.clearData(); // trigger rowSelectionChanged
    tableClassif.deselectRow(); // trigger rowSelectionChanged
    graphConf.hchid = [];
  }
}
