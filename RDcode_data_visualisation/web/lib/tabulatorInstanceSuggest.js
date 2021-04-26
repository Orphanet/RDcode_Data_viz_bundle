//const tooltipICD =
//"None : No mapping registered in the Orphanet database for this entity, this entity might exist in this source\n" +
//"E : Exact mapping: the two concepts are equivalent\n" +
//"NTBT : ORPHA code's Narrower Term maps to a Broader Term\n" +
//"BTNT : ORPHA code's Broader Term maps to a Narrower Term\n" +
//"NTBT/E : ORPHA code's Narrower Term maps to a Broader Term because of an Exact mapping with a synonym in the target terminology\n" +
//"BTNT/E : ORPHA code's Broader Term maps to a Narrower Term because of an Exact mapping with a synonym in the target terminology\n" +
//"ND : not yet decided/unable to decide";
//const tooltipOMIM = tooltipICD;

var table = new Tabulator("#suggestDisplay", {
    data:[],         //load row data from array
    index:"ORPHAcode",
    layout:"fitDataFill",     //fit columns to data
//    responsiveLayout:"hide",  //hide columns that dont fit on the table
    tooltips:false,            //show tool tips on cells
    history:false,            //allow undo and redo actions on the table
    pagination:"local",       //'local': load all the data set provided then paginate the data
    paginationSize:paginationSize, //number of rows per page of data (mainConfig.js)
    movableColumns:true,      //allow column order to be changed
    resizableColumns:"header",//header to resize from header only or true for full control
    resizableRows:false,      //row height
    selectable:1,             //maximum 1 selectable row
    headerSort:false,
    headerSortTristate:false,
    rowSelected:function(row){
        visualisationModules($("#mainInputLang").val(), row.getData());
    },
    pageLoaded:function(pageno) {
    //pageno - the number of the loaded page
        var firstElem = (pageno - 1) * paginationSize;
        var lastElem = pageno * paginationSize;
        var data = this.getData();
        if (data.length > 0) {
//          console.log(data.slice(firstElem, lastElem));
          lazyLoadSuggest(data, firstElem, lastElem); // see suggest.js
        }
        table.redraw(true); //trigger full rerender including all data and rows
    },
    downloadReady:function(fileContents, blob) {
    //fileContents - the unencoded contents of the file
    //blob - the blob object for the download
//    console.log(fileContents);
    fileContents = fileContents.replaceAll("<ul>", "").replaceAll("</ul>", "").replaceAll("<li>", "").replaceAll("</li>", " || ");
//    var blob = new Blob(["\uFEFF", fileContents], {
    var blob = new Blob([decodeURIComponent('%ef%bb%bf'), fileContents], {
//    var blob = new Blob([fileContents], {
      type: 'text/csv; charset=utf-8'
    });
//    console.log(blob);
    return blob; //must return a blob to proceed with the download, return false to abort download
    },
// ascii code for information &#9432;
//code ORPHA, main label +/- synonyme, Classification Level (group of disorders, disorders, subtype),
//Statuts (Inactive, active), Aggregation code (highlighted)
    columns:[                 //define the table columns
        {title:"Label", field:"Preferred term"},
        {title:"Synonym", field:"Synonym", formatter:"html"},
        {title:"ORPHAcode", field:"ORPHAcode"},
        {title:"Classification level", field:"Classification level"},
        {title:"ICD-10", field:"Code ICD10", formatter:"textarea"},
        {title:"OMIM", field:"Code OMIM", formatter:"textarea"},
        {title:"Status", field:"Status"},
        {title:"Aggregation code", field:"ORPHAcodeAggregation", cssClass:"ORPHAcodeAggregation"},
    ],
});

//trigger download of data.csv file
document.getElementById("suggest-download-csv").addEventListener("click", function() {
  var data = table.getData();
  if (data.length) {
    $("body").css("cursor", "progress");
    lazyLoadSuggest(data, 0, data.length).then(() => {
      console.log("suggest table ready");
      table.download("csv", "data.csv", {delimiter:";"});
      $("body").css("cursor", "default");
    })
  }
});