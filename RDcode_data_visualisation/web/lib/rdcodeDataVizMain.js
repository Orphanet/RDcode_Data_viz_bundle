function changePaginationSize(value) {
  paginationSize = value;
  table.setPageSize(value);
}
// reset paginationSize select to default value on refresh
$("#paginationSize").val(paginationSize);

function visualisationModules(inputLang, row) {
  if (row.ORPHAcode == "") {return};
  // classification force graph
  classificationEntry(inputLang, parseInt(row.ORPHAcode), row["Preferred term"],
                      graphConf, completeness=2, loadedMap, showClassif=true);
  // Disorder data sheet
  disorderInfo(inputLang, parseInt(row.ORPHAcode));
}

// Initialize boostrap tooltips
for (item in tooltip) {
  $("#" + item).attr('title', tooltip[item]);
}
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
})

// Fetch and display the data extraction date
function getDate() {
  var date = queryByOrpha(baseUrl, "EN", 558)
  .then((date) => {
    date = date.Date.split(" ")[0].replaceAll("-", " ");
//    console.log(date);
    $("#date").text("Data extraction: " + date);
  });
}
// Get date from data query. DISABLED
//getDate();