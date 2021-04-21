// Query and display the disorder data sheet
// DI : Disorder Info prefix

var dataSheetReady = 0; // Count the number of completed sections in data sheet to enable download (13 to go)

function clearDisorderInfo() {
  DI_Name_Text.textContent = "";
  DI_ORPHAcode.textContent = "";
  DI_Syn_Text.innerHTML = "";
  DI_Def_Text.textContent = "";
  DI_Typology_Text.textContent = "";
//  DI_URL_div.textContent = "";
  DI_URL_div.setAttribute('href', "");
  DI_Status_Text.textContent = "";
  DI_Aggreg_Text.textContent = "";
  DI_InactiveTarget_Text.textContent = "";
  DI_ClassificationLevel_Text.textContent = "";
  DI_Title_Block.style.background = "#F0F0F0";
  DI_HchId_Text.innerHTML = "";
  DI_Parent_Text.innerHTML = "";
  DI_Child_Text.innerHTML = "";
  DI_ICD10_Text.innerHTML = "";
  DI_OMIM_Text.innerHTML = "";
}

function disorderInfo(inputLang, inputValue) {
  dataSheetReady = 0;
  clearDisorderInfo();

  var name = queryByOrpha(baseUrl, inputLang, inputValue);
  name.then((name) => {
//    console.log(name);
    DI_Name_Text.textContent = name["Preferred term"];
    DI_ORPHAcode.textContent = "ORPHA:" + name["ORPHAcode"];
    dataSheetReady += 1;
  });

  var synonym = querySynonymByORPHAcode(baseUrl, inputLang, inputValue);
  synonym.then((synonym) => {
//    console.log(synonym);
    var chipsSyn = "";
    if (!synonym.Synonym) {
      chipsSyn = "<div class=\"chip\">None available</div>";
    } else {
      for (syn of synonym.Synonym) {
        chipsSyn += "<div class=\"chip\">" + syn + "</div>";
      }
    }
    DI_Syn_Text.innerHTML = chipsSyn;
    dataSheetReady += 1;
  });

  var definition = queryDefinition(baseUrl, inputLang, inputValue);
  definition.then((definition) => {
//    console.log(definition);
    DI_Def_Text.textContent = definition.Definition;
    dataSheetReady += 1;
  });

  var typology = queryTypology(baseUrl, inputLang, inputValue);
  typology.then((typology) => {
  //    console.log(typology);
    DI_Typology_Text.textContent = typology.Typology;
    dataSheetReady += 1;
  });

  var orphanetURL = queryOrphanetURL(baseUrl, inputLang, inputValue);
  orphanetURL.then((orphanetURL) => {
//    console.log(orphanetURL);
//    DI_URL_div.textContent = "link";
    DI_URL_div.setAttribute('href', orphanetURL.OrphanetURL);
    dataSheetReady += 1;
  });

  var status = queryStatus(baseUrl, inputLang, inputValue);
  status.then((status) => {
//      console.log(status);
    DI_Status_Text.textContent = status.Status;
    dataSheetReady += 1;
  });

  var aggregation = queryAggregation(baseUrl, inputLang, inputValue);
  aggregation.then((aggregation) => {
//      console.log(aggregation);
    if (!isNaN(aggregation.ORPHAcodeAggregation)) {
      DI_Aggreg_Text.textContent = aggregation.ORPHAcodeAggregation + " " + aggregation["Preferred term"];
    } else {
      DI_Aggreg_Text.textContent = aggregation.ORPHAcodeAggregation;
    }
    dataSheetReady += 1;
  });

  var inactiveTarget = queryInactiveTarget(baseUrl, inputLang, inputValue);
  inactiveTarget.then((inactiveTarget) => {
//    console.log(inactiveTarget);
//  Show target Orphacode if entity is inactive (active entity do not have target code and API return a text)
//    if (!isNaN(inactiveTarget["Target ORPHAcode"])) { // inactive with target
    DI_InactiveTarget_Text.textContent = inactiveTarget["Target ORPHAcode"];
//    }
    dataSheetReady += 1;
  });

  var classificationLevel = queryClassificationLevel(baseUrl, inputLang, inputValue);
  classificationLevel.then((classificationLevel) => {
//    console.log(classificationLevel);
    DI_ClassificationLevel_Text.textContent = classificationLevel.ClassificationLevel; // localized label

    if (inputLang === "EN") { // color disorder sheet header else another query will fire
      if (classificationLevel.ClassificationLevel === "Group of disorders") { // group of disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevel.ClassificationLevel];
      } else if (classificationLevel.ClassificationLevel === "Disorder") { // disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevel.ClassificationLevel];
      } else if (classificationLevel.ClassificationLevel === "Subtype of disorder") { // subtype of disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevel.ClassificationLevel];
      } else {
        DI_Title_Block.style.background = "#F0F0F0";
      }
    };
    dataSheetReady += 1;
  });

  if (inputLang !== "EN") { // color disorder sheet header with english label recognition
    var classificationLevelEN = queryClassificationLevel(baseUrl, "EN", inputValue);
    classificationLevelEN.then((classificationLevelEN) => {
//      console.log(classificationLevelEN);
      if (classificationLevelEN.ClassificationLevel === "Group of disorders") { // group of disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevelEN.ClassificationLevel];
      } else if (classificationLevelEN.ClassificationLevel === "Disorder") { // disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevelEN.ClassificationLevel];
      } else if (classificationLevelEN.ClassificationLevel === "Subtype of disorder") { // subtype of disorder
        DI_Title_Block.style.background = classificationLevelColors[classificationLevelEN.ClassificationLevel];
      } else {
        DI_Title_Block.style.background = "#F0F0F0";
      }
    });
  };

  var classification = queryWhichClassif(baseUrl, inputLang, inputValue);
  classification.then((classification) => {
//    console.log(classification);
    var classificationList = Array();
    var hchId = Array();
    const zip = (a, b) => a.map((k, i) => [k, b[i]]);

    if (!classification.Classification) {
      DI_HchId_Text.innerHTML = "None available";
      DI_Parent_Text.innerHTML = "None available";
      DI_Child_Text.innerHTML = "None available";
      dataSheetReady += 2; // for parent + children
    } else {
      for (classif of classification.Classification) {
        hchId.push(classif["ID of the classification"]);
        classificationList.push(classif["Name of the classification"]);
      }

      DI_HchId_Text.innerHTML = classificationList.join("<br>");

      var parents = Array();
      var children = Array();
      for (id of hchId) {
        parents.push(queryParent(baseUrl, inputLang, id, inputValue));
        children.push(queryChild(baseUrl, inputLang, id, inputValue));
      };

      var parentList = Array();
      var parentCodeSet = new Set();
      var parentCodeList = Array();
      var parentNameList = Array();
      Promise.all(parents).then((parents) => {
  //        console.log(parent);
        for (classifParent of parents) {
  //        console.log(classifParent);
          for (parent of classifParent) {
  //          console.log(parent);
            if (!parentCodeSet.has(parent["ORPHAcode"])) {
              parentCodeSet.add(parent["ORPHAcode"]);
              parentCodeList.push(parent["ORPHAcode"]);
              parentNameList.push(parent["Preferred term"]);
            };
          };
        };
        parentList = zip(parentCodeList, parentNameList);
  //      console.log(parentList);
        parentList = parentList.sort((a, b) => (a[0] - b[0]));
  //      console.log(parentList);
        parentList.forEach(function(item, index){ parentList[index] = item.join(" ") });
  //      console.log(parentList);
        parentList = parentList.join("<br>");
        if (!parentList) {
          parentList = "None available";
        }
        DI_Parent_Text.innerHTML = parentList;
        dataSheetReady += 1;
      });

      var childList = Array();
      var childCodeSet = new Set();
      var childCodeList = Array();
      var childNameList = Array();
      Promise.all(children).then((children) => {
  //      console.log(children);
        for (classifChild of children) {
  //        console.log(classifChild);
          for (child of classifChild) {
  //          console.log(child);
            if (!childCodeSet.has(child["ORPHAcode"])) {
              childCodeSet.add(child["ORPHAcode"]);
              childCodeList.push(child["ORPHAcode"]);
              childNameList.push(child["Preferred term"]);
            };
          };
        };
        childList = zip(childCodeList, childNameList);
  //      console.log(childList);
        childList = childList.sort((a, b) => (a[0] - b[0]));
        childList.forEach(function(item, index){ childList[index] = item.join(" ") });
  //      console.log(childList);
        childList = (childList).join("<br>");
        if (!childList) {
          childList = "None available";
        }
        DI_Child_Text.innerHTML = childList;
        dataSheetReady += 1;
      });
    }
  }).catch((error) => {
    DI_HchId_Text.innerHTML = "None available";
    DI_Parent_Text.innerHTML = "None available";
    DI_Child_Text.innerHTML = "None available";
    dataSheetReady += 2; // for parent + children
  });

  var ICD10 = queryICD10ByORPHAcode(baseUrl, inputLang, inputValue);
  ICD10.then((ICD10) => {
//    console.log(ICD10);
    const zip = (a, b) => a.map((k, i) => [k, b[i]].join(" "));
    var ICD10List = Array();
    var ICD10Mapping1 = Array(); // "DisorderMappingRelation": "E (Exact mapping ...
    var ICD10Mapping2 = Array(); // "DisorderMappingICDRelation": "Specific code ...
    for (code of ICD10.References) {
      ICD10List.push("<div class=\"chip\">" + code["Code ICD10"] + "</div>");
      ICD10Mapping1.push(code["DisorderMappingRelation"]);
      ICD10Mapping2.push(code["DisorderMappingICDRelation"]);
    }
    ICD10List = zip(ICD10List, zip(ICD10Mapping1, ICD10Mapping2));
    ICD10List = (ICD10List).join("<br>");
    DI_ICD10_Text.innerHTML = ICD10List;
    dataSheetReady += 1;
  }).catch((error) => {
    DI_ICD10_Text.innerHTML = "None available";
    dataSheetReady += 1;
    console.log(error + " no linked ICD10");
  });

  var OMIM = queryOMIMByORPHAcode(baseUrl, inputLang, inputValue);
  OMIM.then((OMIM) => {
//    console.log(OMIM);
    const zip = (a, b) => a.map((k, i) => [k, b[i]].join(" "));
    var OMIMList = Array();
    var OMIMMapping = Array();
    for (code of OMIM.References) {
      OMIMList.push("<div class=\"chip\">" + code["Code OMIM"] + "</div>");
      OMIMMapping.push(code["DisorderMappingRelation"]);
    }
    OMIMList = zip(OMIMList, OMIMMapping);
    OMIMList = (OMIMList).join("<br>");
    DI_OMIM_Text.innerHTML = OMIMList;
    dataSheetReady += 1;
  }).catch((error) => {
    DI_OMIM_Text.innerHTML = "None available";
    dataSheetReady += 1;
    console.log(error + " no linked OMIM");
  });
}

function exportDataSheet() {
//  console.log(dataSheetReady);
  var exportText = [];
  var synTemp = ""
  var exportDelimiter = "\t";
  if (dataSheetReady === 13) {
    exportText.push(["Preferred Term", "ORPHAcode", "Synonym(s)", "Definition", "Typology", "Orphanet URL", "Status",
     "ORPHAcode aggregation and name", "Target for inactive ORPHAcode", "Classification Level", "Classification(s)",
     "Parent(s)", "Children", "ICD-10 code(s)", "OMIM number(s)\n"].join(exportDelimiter))

    // remove the 'chip' formatting from synonym
    synTemp = DI_Syn_Text.innerHTML.replaceAll("<div class=\"chip\">","").split("</div>");
    synTemp.pop();
    synTemp = synTemp.join("; ");

    exportText.push([DI_Name_Text.textContent,
     DI_ORPHAcode.textContent.split(":")[1],
     DI_Syn_Text.innerHTML,
     DI_Def_Text.textContent,
     DI_Typology_Text.textContent,
     DI_URL_div.getAttribute('href'),
     DI_Status_Text.textContent,
     DI_Aggreg_Text.textContent,
     DI_InactiveTarget_Text.textContent,
     DI_ClassificationLevel_Text.textContent,
     DI_HchId_Text.innerHTML.replaceAll("<br>","; "),
     DI_Parent_Text.innerHTML.replaceAll("<br>","; "),
     DI_Child_Text.innerHTML.replaceAll("<br>","; "),
     DI_ICD10_Text.innerHTML.replaceAll("<div class=\"chip\">","").replaceAll("</div>","").replaceAll("<br>","; "),
     DI_OMIM_Text.innerHTML.replaceAll("<div class=\"chip\">","").replaceAll("</div>","").replaceAll("<br>","; ")
     ].join(exportDelimiter));

    exportText = exportText.join("");

    myWindow=window.open('');
    myWindow.document.write("<head> <meta charset=\"UTF-8\"> <title>" + DI_ORPHAcode.textContent + " Summary</title> </head>");
    myWindow.document.write("<body>");
    myWindow.document.write("<button style=\"margin:auto; display:block; font-size: 1.5em;\" onclick=\"btnCopyToClipBoard()\">Copy to clipboard</button>");
    myWindow.document.write("<script>" +
                            "function btnCopyToClipBoard(){" +
                            "var copyText = document.getElementById(\"textIns\");" +
                            "copyText.select();" +
                            "document.execCommand(\"copy\");" +
                            "window.getSelection().removeAllRanges();}"+
                            "</script>");
    myWindow.document.write('<textarea id="textIns" style="width: 100%; height: 95%; resize: none;">' + exportText + '</textarea>');
    myWindow.document.write("</body>");

    myWindow.focus();
  }
}

function btnCopyToClipBoard() {
    var copyText = document.getElementById("textIns");
    copyText.select();
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
}