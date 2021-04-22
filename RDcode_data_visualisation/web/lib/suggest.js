// Handle the main search and fills the intermediate result display (referred to as "suggest")

var timeout = null; // init the input timer
var previousSearch = "";

function initiateSuggest(suggestDelay) {
    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(timeout);
    // Make a new timeout set to go off in 1000ms (1 second)
    timeout = setTimeout(function () {
        var input = $("#mainInput").val().trim();
        if (input != previousSearch) {
          suggest($("#mainInputLang").val(), $("#mainInputType").val(), input);
  //        capture non-changing event
          previousSearch = input;
        } else {
          console.log("the term has already been searched");
        }
    }, suggestDelay);
}

// Initiate suggest after user input, with delay
document.getElementById("mainInput").addEventListener('keyup', function(e) {initiateSuggest (suggestDelay)});

function detectInputType(inputValue) {
  var inputType = ""
  if (!isNaN(inputValue)) {
    console.log("Code", inputValue);
    inputType = "code";
  } else {
    console.log("Term", inputValue);
    inputType = "term";
  }
  return inputType
}

// Must reject or return 1 or a list of object with at least "Preferred Terms" and "ORPHAcode" properties
function suggest(inputLang, inputType, inputValue) {
  if (inputValue == "") {
    table.clearData();
    suggestResultNumber.innerHTML = "";
    return;
  };
//  console.log("inputLang", inputLang);
  if (inputType == "auto") {
    inputTypeFormat = detectInputType(inputValue);
    if (inputTypeFormat == "code") {
      responseORPHA = queryByOrpha(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      responseOMIM = queryByOMIM(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      response = Promise.all([responseORPHA, responseOMIM]);
    } else {
      responseLabels = queryByApproxTermAndSynonym(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      responseICD10 = queryByICD10(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      response = Promise.all([responseLabels, responseICD10]);
    }
  } else if (inputType == "PTS") {
    response = queryByApproxTermAndSynonym(baseUrl, inputLang, inputValue);
  } else if (inputType == "PT") {
    response = queryByApproxTerm(baseUrl, inputLang, inputValue);
  } else if (inputType == "S") {
    response = queryByApproxSynonym(baseUrl, inputLang, inputValue);
  } else if (inputType == "ORPHA") {
    response = queryByOrpha(baseUrl, inputLang, inputValue);
  } else if (inputType == "ICD-10") {
//  Test with Q61.1 and Q98.8
    response = queryByICD10(baseUrl, inputLang, inputValue);
  } else if (inputType == "OMIM") {
//  Test with 125500 and 154700
    response = queryByOMIM(baseUrl, inputLang, inputValue);
  }
// Convert to array if a single object has been found and filter null elements
  response.then(function(response) {
    return new Promise(function(resolve, reject) {
//      console.log(response);
//      if not response reject
      if (!response) {
        reject(null);
//      if response is a single object
      } else if (!Array.isArray(response)) {
        response = [response,];
        resolve(response);
//      if response is an array it can contains nested arrays AND OR null elements
      } else {
        var flatResponse = Array();
        var needFlattening = false;
        for (elem of response) {
          if (Array.isArray(elem)) {
            flatResponse.push(...elem);
            needFlattening = true;
          }
        }
        if (needFlattening) {
          response = flatResponse;
        }
//      filter null elements
        response = response.filter(x => x);
//        console.log(response);
        resolve(response);
      }
    });
  })
//  Show result list
  .then((response) => {
    if (response) {
      table.setData(response);
      if (response.length === 0) {
        suggestResultNumber.innerHTML = "0 result";
      } else if (response.length === 1) {
        suggestResultNumber.innerHTML = "1 result";
      } else {
        suggestResultNumber.innerHTML = response.length + " results";
      }
      lazyLoadSuggest(table.getData(), 0, paginationSize);
      table.redraw(true);
    } else {
      suggestResultNumber.innerHTML = "";
      table.clearData();
      table.redraw(true);
    }
  })
  .catch((error) => {
    suggestResultNumber.innerHTML = "";
    table.clearData();
    table.redraw(true);
  })
}

function lazyLoadSuggest(data, firstElem, lastElem) {
  return new Promise(function(resolve, reject) {
    if (data) {
      var lazySectionNumber = 6; // Count the number of columns to lazyload; required to enable download
      var maxSuggestReady = (lastElem - firstElem) * lazySectionNumber;
//      console.log(maxSuggestReady);
      var suggestReady = 0; // Count the actual number of completed sections in suggest table to enable download
      var inputLang = $("#mainInputLang").val();
//      console.log(data.slice(firstElem, lastElem));
      for (row of data.slice(firstElem, lastElem)) {
        if (!row["ORPHAcodeAggregation"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], ORPHAcodeAggregation:"Loading..."}]);
          aggregation = queryAggregation(baseUrl, inputLang, row.ORPHAcode);
          aggregation.then((aggregation) => {
  //          console.log(aggregation);
            table.updateData([{ORPHAcode:aggregation.ORPHAcode, ORPHAcodeAggregation:aggregation.ORPHAcodeAggregation}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
        if (!row["Synonym"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], Synonym:"Loading..."}]);
          synonym = querySynonymByORPHAcode(baseUrl, inputLang, row.ORPHAcode);
          synonym.then((synonym) => {
  //          console.log(synonym);
            if (!synonym.Synonym) {
              synonym.Synonym = "None";
            } else {
              synonym.Synonym = synonym.Synonym.join(" || \n");
            }
            table.updateData([{ORPHAcode:synonym.ORPHAcode, Synonym:synonym.Synonym}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
          .then(() => {
            table.redraw(true);
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
        if (!row["Classification level"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], Typology:"Loading..."}]);
          classificationLevel = queryClassificationLevel(baseUrl, inputLang, row.ORPHAcode);
          classificationLevel.then((classificationLevel) => {
  //          console.log(classificationLevel);
            table.updateData([{ORPHAcode:classificationLevel.ORPHAcode,
                               "Classification level":classificationLevel["ClassificationLevel"]}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
  // WARNING "status" is a reserved keyword
        if (!row["Status"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], Status:"Loading..."}]);
          disorderStatus = queryStatus(baseUrl, inputLang, row.ORPHAcode);
          disorderStatus.then((disorderStatus) => {
  //          console.log(disorderStatus);
            table.updateData([{ORPHAcode:disorderStatus.ORPHAcode, Status:disorderStatus.Status}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
        if (!row["Code OMIM"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], "Code OMIM":"Loading..."}]);
          disorderOMIM = queryOMIMByORPHAcode(baseUrl, inputLang, row.ORPHAcode)
          .then((disorderOMIM) => {
  //          console.log(disorderOMIM);
            const zip = (a, b) => a.map((k, i) => [k, b[i]].join(" "));
            var OMIMList = Array();
            var OMIMMaping = Array();
            for (code of disorderOMIM.References) {
              OMIMList.push(code["Code OMIM"]);
  //            OMIMMaping.push(code["DisorderMappingRelation"].split(" ")[0]); // uncomment to add relation type
            }
  //          OMIMList = zip(OMIMList, OMIMMaping); // uncomment to add relation type
            OMIMList = (OMIMList).join("\n");
  //          console.log(OMIMList);
            table.updateData([{ORPHAcode:disorderOMIM.ORPHAcode, "Code OMIM":OMIMList}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
          .then(() => {
            table.redraw();
          })
          .catch((error) => {
  //          console.log("lazyload", error.message)
            table.updateData([{ORPHAcode:error.message, "Code OMIM":"None"}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
        if (!row["Code ICD10"]) {
          table.updateData([{ORPHAcode:row["ORPHAcode"], "Code ICD10":"Loading..."}]);
          disorderICD10 = queryICD10ByORPHAcode(baseUrl, inputLang, row.ORPHAcode)
          .then((disorderICD10) => {
  //          console.log(disorderICD10);
            const zip = (a, b) => a.map((k, i) => [k, b[i]].join(" "));
            var ICD10List = Array();
            var ICD10Maping = Array();
            for (code of disorderICD10.References) {
              ICD10List.push(code["Code ICD10"]);
  //            ICD10Maping.push(code["DisorderMappingRelation"].split(" ")[0]); // uncomment to add relation type
            }
  //          ICD10List = zip(ICD10List, ICD10Maping); // uncomment to add relation type
            ICD10List = (ICD10List).join("\n");
  //          console.log(ICD10List);
            table.updateData([{ORPHAcode:disorderICD10.ORPHAcode, "Code ICD10":ICD10List}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
          .then(() => {
            table.redraw();
          })
          .catch((error) => {
  //          console.log("lazyload", error.message)
            table.updateData([{ORPHAcode:error.message, "Code ICD10":"None"}]);
            suggestReady += 1;
            if (suggestReady === maxSuggestReady) {
              resolve();
            }
          })
        } else {
          suggestReady += 1;
          if (suggestReady === maxSuggestReady) {
            resolve();
          }
        }
      }
    }
    else {
      console.log("suggest table ready");
      resolve();
    }
  })
}

// Auto load test data, Dev purpose
if($("#mainInput").val()) {
  document.onload = suggest($("#mainInputLang").val(), $("#mainInputType").val(), $("#mainInput").val())
}