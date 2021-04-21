// Data handling functions for the classification graph

var classificationContainer = "#tree-container";

function filterObjByProperty(array, propertyName) {
   return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
}

// Return the list of classification from witch it belongs
function prepareClassifList(baseUrl, inputLang, id) {
  return new Promise((resolve, reject) => {
    queryWhichClassif(baseUrl, inputLang, id)
    .then((response) => {
//      console.log(response);
      if (response) {
        var classif = Array();
        for (elem of response.Classification) {
          classif.push([elem["ID of the classification"], elem["Name of the classification"]]);
        }
        resolve(classif);
      } else {
        resolve(null);
      }
    });
  });
}

function prepareParent(baseUrl, inputLang, classif, inputValue) {
  return new Promise((resolve, reject) => {
    // Parent can be different in every classification
    var parent = Array();
    for (hchid of classif) {
      parent.push(queryParent(baseUrl, inputLang, hchid[0], inputValue));
    }
    Promise.all(parent).then((parent) => {
      var uniqueParent = Array();
//      console.log(parent);
//      console.log(parent.flat(1));
      uniqueParent = filterObjByProperty(parent.flat(1), "ORPHAcode");
//      rename Orphacode to id
      for (parent of uniqueParent) {
        parent.id = parent.ORPHAcode;
        delete parent.ORPHAcode;
      }
//      console.log(uniqueParent);
      resolve(uniqueParent);
    });
  });
}

function prepareChild(baseUrl, inputLang, classif, inputValue) {
  return new Promise((resolve, reject) => {
    // Children can be different in every classification
    var children = Array();
    for (hchid of classif) {
      children.push(queryChild(baseUrl, inputLang, hchid[0], inputValue));
    }
    Promise.all(children).then((children) => {
      var uniqueParent = Array();
//      console.log(children);
//      console.log(children.flat(1));
      var uniqueChildren = filterObjByProperty(children.flat(1), "ORPHAcode");
//      rename Orphacode to id
      for (child of uniqueChildren) {
        child.id = child.ORPHAcode;
        delete child.ORPHAcode;
      }
      resolve(uniqueChildren);
    });
  });
}

async function asyncFetchFamily(queryNode, parent, child, inputLang, propagateFetch, loadedMap) {
  return new Promise(async (resolve, reject) => {
//    console.log(queryNode);
    for (node of parent) {
      queryNode.parentId.add(node.id);
    }
    for (node of child) {
      queryNode.childrenId.add(node.id);
    }
    loadedMap.set(queryNode.id, queryNode);

    if (propagateFetch) {
      for (node of parent) {
        if (!loadedMap.has(node.id)) {
//          console.log("for (node of parent)", loadedMap);
          loadedMap = await fetchFamily(inputLang, node.id, node["Preferred term"],
                                  propagateFetch=false, loadedMap);
        }
      }
      for (node of child) {
        if (!loadedMap.has(node.id)) {
          loadedMap = await fetchFamily(inputLang, node.id, node["Preferred term"],
                                  propagateFetch=false, loadedMap);
        }
      }
      queryNode.queried = 2;
    };
    resolve(loadedMap);
  });
}

async function fetchFamily(inputLang, inputValue, label, propagateFetch, loadedMap) {
  return new Promise((resolve, reject) => {
    if (loadedMap.has(inputValue) && loadedMap.get(inputValue).queried === 2) {
//      console.log(loadedMap.get(inputValue));
      resolve(loadedMap);
    } else {
      var queryNode = {"id": inputValue, "label": label, "classif": [], "parentId": new Set(), "childrenId": new Set(),
                       "queried": -1};
      queryNode = loadAdditionalInfo(inputLang, queryNode)
      .then((queryNode) => {
        classif = prepareClassifList(baseUrl, inputLang, inputValue)
        .then((classif) => {
          if (classif) {
            queryNode.classif = classif;
            var parent = prepareParent(baseUrl, inputLang, classif, inputValue);
            var child = prepareChild(baseUrl, inputLang, classif, inputValue);
            Promise.all([parent, child]).then(async ([parent, child]) => {
//              console.log(parent, child);
              loadedMap = await asyncFetchFamily(queryNode, parent, child, inputLang, propagateFetch, loadedMap)
              resolve(loadedMap);
            });
          } else {
            console.log("fetchFamily returned null", queryNode.id);
            queryNode.queried = 2;
            loadedMap.set(queryNode.id, queryNode);
            resolve(loadedMap);
          }
        });
      });
    }
  });
}

function loadAdditionalInfo(inputLang, queryNode) {
//  INPUTLANG NOT used for classification Level
  return new Promise((resolve, reject) => {
    var classificationLevel = queryClassificationLevel(baseUrl, "EN", queryNode.id);
    classificationLevel.then((classificationLevel) => {
//      console.log(classificationLevel);
      queryNode.classificationLevel = classificationLevel.ClassificationLevel;
      queryNode.color = graphConf.color.get(queryNode.classificationLevel);
      resolve(queryNode);
    });
  });
}

// completeness is the loading state of the node
// -1:NO relatives FULLY loaded, 0: parents FULLY loaded, 1: children FULLY loaded, 2: parents and children FULLY loaded
function computeCompleteness(node, completeness) {
//  console.log(node)
  if (node.queried === -1) {
    return completeness;
  } else {
    return 2;
  }
}

// underscore is a namespace that comes from lodash library
function filterRelatives(id, completeness, activeNodeMap, loadedMap, graphConf) {
  var parentClassif = [];
  var stop = false;
  if (completeness === 0 || completeness === 2) {
    var tempRelatives = _.cloneDeep(loadedMap.get(id).parentId);
    var filteredRelatives = new Set();
    for (parentId of tempRelatives) {
      parentClassif = _.cloneDeep(loadedMap.get(parentId).classif);
      for (hchid of parentClassif) {
//        console.log(hchid);
        for (wantedHchid of graphConf.hchid) {
//          console.log(wantedHchid);
          if (hchid[0] === wantedHchid) {
            filteredRelatives.add(parentId);
            stop = true;
            break;
          }
        }
        if (stop) {
          stop = false;
          break;
        }
      }
    }
//    console.log(filteredRelatives);
//    console.log(activeNodeMap);
    activeNodeMap.get(id).parentId = filteredRelatives;
  }
  if (completeness === 1 || completeness === 2) {
    var tempRelatives = _.cloneDeep(loadedMap.get(id).childrenId);
    var filteredRelatives = new Set();
    for (childrenId of tempRelatives) {
      childrenClassif = _.cloneDeep(loadedMap.get(childrenId).classif);
      for (hchid of childrenClassif) {
//        console.log(hchid);
        for (wantedHchid of graphConf.hchid) {
//          console.log(wantedHchid);
          if (hchid[0] === wantedHchid) {
            filteredRelatives.add(childrenId);
            stop = true;
            break;
          }
        }
        if (stop) {
          stop = false;
          break;
        }
      }
    }
//    console.log(filteredRelatives);
    activeNodeMap.get(id).childrenId = filteredRelatives;
  }
}

function checkRelatives(currentNode, graphData, activeNodeMap, activeLinkSet) {
  var toRemove = [];
  for (parent of currentNode.parentId) {
    if (activeNodeMap.has(parent)) {
      var linkCode = parent + "_" + currentNode.id;
      if (!activeLinkSet.has(linkCode)) {
        graphData.links.push({"source": parent,
                              "target": currentNode.id});
        activeLinkSet.add(linkCode);
        activeNodeMap.get(parent).childrenId.add(currentNode.id);
      };
    } else {
      toRemove.push(parent);
    }
  }
  for (parent of toRemove) {
    currentNode.parentId.delete(parent);
  }
  toRemove = [];
  for (child of currentNode.childrenId) {
    if (activeNodeMap.has(child)) {
      var linkCode = currentNode.id + "_" + child;
      if (!activeLinkSet.has(linkCode)) {
        graphData.links.push({"source": currentNode.id,
                              "target": child});
        activeLinkSet.add(linkCode);
        activeNodeMap.get(child).parentId.add(currentNode.id);
      }
    } else {
      toRemove.push(child);
    }
  }
  for (child of toRemove) {
    currentNode.childrenId.delete(child);
  }
  return [currentNode, graphData, activeNodeMap, activeLinkSet];
}

function formatToGraph(graphData, activeNodeMap, activeLinkSet, inputValue, loadedMap, graphConf, completeness) {
//  console.log("graphData", graphData);
//  console.log("activeNodeMap", activeNodeMap);
//  console.log("loadedMap", loadedMap);
//  console.log(graphData, activeNodeMap, activeLinkSet);
  if (!graphData) {
  // underscore is a namespace that comes from lodash library
    var queryNode = _.cloneDeep(loadedMap.get(inputValue));// copy from fully loaded map
//    console.log(queryNode);
//    console.log(activeNodeMap);
//  First time or resetting, from a click on the search result
    queryNode.queried = 2; // This node has been fully loaded and will not trigger a new load on click
    queryNode.depth = 0;
    queryNode.x = graphConf.width / 2; // the first node must spawn in the middle of the graph
    queryNode.y = graphConf.height / 2;  // the first node must spawn in the middle of the graph
    graphData = {"nodes": [queryNode,],
                 "links": [],
                };
    activeNodeMap.set(queryNode.id, queryNode);
    filterRelatives(inputValue, completeness, activeNodeMap, loadedMap, graphConf);
  } else {
    var queryNode = activeNodeMap.get(inputValue);
    // => add parents and children to activeNodeMap
    filterRelatives(inputValue, completeness, activeNodeMap, loadedMap, graphConf);
    queryNode.queried = computeCompleteness(activeNodeMap.get(queryNode.id), completeness);
//    console.log(activeNodeMap.get(queryNode.id));
  }
//  console.log("activeNodeMap", activeNodeMap);

  // Get position of current node to add his relatives close to it
  var curentNodeX = queryNode.x;
  var curentNodeY = queryNode.y;

//  Check if node is already loaded
  for (parent of queryNode.parentId) {
    var linkCode = parent + "_" + queryNode.id;
    if (!activeNodeMap.has(parent)) { // Not yet displayed
    // underscore is a namespace that comes from lodash library
      var parentNode = _.cloneDeep(loadedMap.get(parent)); // copy from fully loaded map
      parentNode.queried = -1; // This node is not fully displayed
      parentNode.depth = queryNode.depth - 1;
      // this node must spawn close to his relative
      parentNode.x = d3.randomNormal(curentNodeX, graphConf.nodeSize)();
      parentNode.y = curentNodeY - graphConf.force.linkSize / 2 + Math.random() * graphConf.nodeSize;

      [parentNode, graphData, activeNodeMap, activeLinkSet] = checkRelatives(parentNode, graphData, activeNodeMap, activeLinkSet);

      graphData.nodes.push(parentNode);
      activeNodeMap.set(parentNode.id, parentNode);
    } else { // already displayed
      if (!activeLinkSet.has(linkCode)) { // add link
        activeNodeMap.get(parent).childrenId.add(queryNode.id);
        graphData.links.push({"source": parent,
                              "target": queryNode.id})
        activeLinkSet.add(linkCode);
      }
    }
  }

//  Check if node is already loaded
  for (child of queryNode.childrenId) {
    var linkCode = queryNode.id + "_" + child;
    if (!activeNodeMap.has(child)) { // Not yet displayed
    // underscore is a namespace that comes from lodash library
      var childNode = _.cloneDeep(loadedMap.get(child)); // copy from fully loaded map
      childNode.queried = -1; // This node is not fully displayed
      childNode.depth = queryNode.depth + 1;
      // this node must spawn close to his relative
      childNode.x = d3.randomNormal(curentNodeX, graphConf.nodeSize)();
      childNode.y = curentNodeY + graphConf.force.linkSize / 2 + Math.random() * graphConf.nodeSize;

      [childNode, graphData, activeNodeMap, activeLinkSet] = checkRelatives(childNode, graphData, activeNodeMap, activeLinkSet);

      graphData.nodes.push(childNode);
      activeNodeMap.set(childNode.id, childNode);
    } else { // already displayed
      if (!activeLinkSet.has(linkCode)) { // add link
        activeNodeMap.get(child).parentId.add(queryNode.id);
        graphData.links.push({"source": queryNode.id,
                              "target": child})
        activeLinkSet.add(linkCode);
      }
    }
  }
//  console.log(graphData, activeNodeMap, activeLinkSet);
  return [graphData, activeNodeMap, activeLinkSet];
}

function removeNodes(thisNode, index, oldGraph, activeNodeMap, activeLinkSet, graphConf, completeness) {
//  console.log(thisNode);
//  console.log(oldGraph);
//  console.log(activeNodeMap);
//  console.log(activeLinkSet);
  var newLinkSet = new Set();
  var idToRemoveSet = new Set();
  var newParentId = new Set();
  var newChildrenId = new Set();
// remove parents
  if (completeness === 0) {
    idToRemoveSet = thisNode.parentId;
// remove the nodes solely linked to the current node
    for (id of idToRemoveSet) {
      if ((activeNodeMap.get(id).parentId.size + activeNodeMap.get(id).childrenId.size) > 1) {
        idToRemoveSet.delete(id);
        newParentId.add(id);
      }
    }
    if (thisNode.queried === 2) {
      thisNode.queried = 1;
    } else {
      thisNode.queried = -1;
    }
    thisNode.parentId = newParentId;
// remove children
  } else if (completeness === 1) {
    idToRemoveSet = thisNode.childrenId;
// remove the nodes solely linked to the current node
    for (id of idToRemoveSet) {
      if ((activeNodeMap.get(id).parentId.size + activeNodeMap.get(id).childrenId.size) > 1) {
        idToRemoveSet.delete(id);
        newChildrenId.add(id);
      }
    }
    if (thisNode.queried === 2) {
      thisNode.queried = 0;
    } else {
      thisNode.queried = -1;
    }
    thisNode.childrenId = newChildrenId;
// remove both
  } else if (completeness === 2) {
    idToRemoveSet = thisNode.parentId;
    for (id of idToRemoveSet) {
      if ((activeNodeMap.get(id).parentId.size + activeNodeMap.get(id).childrenId.size) > 1) {
        idToRemoveSet.delete(id);
        newParentId.add(id);
      }
    }
    var tempIdToRemoveSet = thisNode.childrenId
    tempIdToRemoveSet.forEach(function (d) {idToRemoveSet.add(d)});
// remove the nodes solely linked to the current node
    for (id of idToRemoveSet) {
      if ((activeNodeMap.get(id).parentId.size + activeNodeMap.get(id).childrenId.size) > 1) {
        idToRemoveSet.delete(id);
        newChildrenId.add(id);
      }
    }
    thisNode.queried = -1;
    thisNode.parentId = newParentId;
    thisNode.childrenId = newChildrenId;
  }

  var newGraph = {"links":Array(), "nodes":Array()};
  for (link of oldGraph.links) {
    if (!(idToRemoveSet.has(link.source.id) || idToRemoveSet.has(link.target.id))) {
      newGraph.links.push({"source": link.source.id,
                            "target": link.target.id});
      newLinkSet.add(link.source.id + "_" + link.target.id);
    };
  };
  for (node of oldGraph.nodes) {
    if (!idToRemoveSet.has(node.id)) {
      var newNode = node;
      delete newNode.index;
      newGraph.nodes.push(newNode);
    } else {
      activeNodeMap.delete(node.id);
    };
  };

  createV4SelectableForceDirectedGraph(graphSvg,
                                       newGraph,
                                       activeNodeMap,
                                       newLinkSet,
                                       loadedMap,
                                       graphConf);
}

function loadNewNodes(inputValue, label, oldGraph, activeNodeMap, activeLinkSet, graphConf, completeness, loadedMap) {
//  console.log(id, label, oldGraph);
  var inputLang = $("#mainInputLang").val();
  var newGraph;
  loadedMap = fetchFamily(inputLang, inputValue, label, propagateFetch=true, loadedMap)
  .then((loadedMap) => {
//    console.log("loadedMap", loadedMap);
    [newGraph, activeNodeMap, activeLinkSet] = formatToGraph(oldGraph, activeNodeMap, activeLinkSet,
                                                             inputValue, loadedMap, graphConf, completeness);
    createV4SelectableForceDirectedGraph(graphSvg,
                                         newGraph,
                                         activeNodeMap,
                                         activeLinkSet,
                                         loadedMap,
                                         graphConf);
  });
}

function classificationEntry(inputLang, inputValue, label, graphConf, completeness, loadedMap, showClassif) {
  // display loading cursor
  $("body").css("cursor", "progress");
  $("nodeText").css("cursor", "progress");
  graphConf.startId = inputValue;
  loadedMap = fetchFamily(inputLang, inputValue, label, propagateFetch=true, loadedMap)
  .then((loadedMap) => {
//    console.log(loadedMap);
    if (showClassif) {
      showClassificationSelect(loadedMap.get(inputValue).classif);
    }
    graphConf.zoom.actual = graphConf.zoom.ini;
    var newGraph = {};
    var activeNodeMap = new Map();
    var activeLinkSet = new Set();
    [newGraph, activeNodeMap, activeLinkSet] = formatToGraph(null, activeNodeMap, activeLinkSet,
                                                             inputValue, loadedMap, graphConf, completeness);
//    console.log("newGraph", newGraph);
    createV4SelectableForceDirectedGraph(graphSvg,
                                         newGraph,
                                         activeNodeMap,
                                         activeLinkSet,
                                         loadedMap,
                                         graphConf);
//    console.log(startNode);
  });
}

function purgeloadedMap(lang) {
  if (lang !== prevLang) {
  // underscore is a namespace that comes from lodash library
    langArchive.set(prevLang, _.cloneDeep(loadedMap));
    if (langArchive.has(lang)) {
      loadedMap = langArchive.get(lang);
    } else {
      loadedMap = new Map();
    };
    graphConf.zoom.actual = graphConf.zoom.ini;
    newGraph = {};
    activeNodeMap = new Map();
    activeLinkSet = new Set();
    createV4SelectableForceDirectedGraph(graphSvg,
                                         graphConf.defaultNode,
                                         activeNodeMap,
                                         activeLinkSet,
                                         loadedMap,
                                         graphConf);
    prevLang = lang;
  }
}

var graph;
var graphSvg = d3.select('#classificationInfo svg');

function graphCenter(dimension, graphConf) {
// return the center of the graph area for one dimension (x or y);
  if (dimension === "x") {
    return graphSvg.node().getBoundingClientRect().width * (1-graphConf.zoom.ini.k) / 2;
  } else if (dimension === "y") {
    return graphSvg.node().getBoundingClientRect().height * (1-graphConf.zoom.ini.k) / 2;
  } else {
    console.log("error", dimension);
  }
}

// trigger classification spoiler event
document.getElementById("classificationSpoiler").addEventListener("click", function() {
  if  ($("#classificationSelect").css("display") == "none") {
//    console.log("spoiler OFF");
    $("#classificationSelect").css("display", "block"); // hide classificationSelect
    $("classificationInfo, svg").css("width", "67%"); // shrink graph svg
  } else {
//    console.log("spoiler ON");
    $("#classificationSelect").css("display", "none"); // show classificationSelect
    $("classificationInfo, svg").css("width", "100%"); // extend graph svg
  }
});

var graphConf = {
  "width" : graphSvg.node().getBoundingClientRect().width, //computed value, CSS to define value
  "height" : graphSvg.node().getBoundingClientRect().height, //computed value, CSS to define value
  // coordinates will be initialized after this definition
  "zoom" : {"ini" : {"k":0.95, "x":0, "y":0}, // change the initial and reset zoom factor k here,
            "zoomStep" : 0.3, // zoom increment/decrement (new scale = scale * 2^zoomStep)
            "actual" : "ini", // will be initialized after this definition
            "autoFitPadding" : 0.05 // fraction of padding around the graph for auto zoom and fit
  },
  "nodeSize" : 100, // radius
  "textLineHeight" : 1, // em
  "textWrapSize" : 120, // size in pixel before carriage return before next word
  "force" : {"linkSize" : 300, // also used to determine the interval between layers
             "linkStrength" : 0.01, // weak to allow expansion, but enough to enable kin grouping and displacement
             "charge" : -250, // repulsive force between nodes
             "xCentering" : 0.002, // weak horizontal centering to prevent overexpansion
             "yLayer" : 0.07, // force applied to stick with the computed layer
  },
  "simulation" : {"alpha": 1, // Initial energy of the system, default 1
                  "alphaDecay": 0.01, // Simulate the cooling rate of the system (runtime), custom default 0.01
                 },
  "defaultNode" : {"nodes":[
                     {"id": 0, "label": "Select a disorder from the list", "classif": [], "parentId": new Set(),
                      "childrenId": new Set(), "queried": 2, "depth":0, "x":0, "y":0}
                   ],
                   "links":[]
  },
  "startId":-1,
  "hchid": [],
  "color" : new Map([["None", colorScale[1]], ["Group of disorders", colorScale[1]],
                     ["Disorder", colorScale[2]], ["Subtype of disorder", colorScale[3]]]),
}

graphConf.zoom.ini.x = graphCenter("x", graphConf);
graphConf.zoom.ini.y = graphCenter("y", graphConf);
graphConf.zoom.actual = graphConf.zoom.ini;

//console.log(graphSvg.node().getBoundingClientRect());
graphConf.defaultNode.nodes[0].x = graphConf.width / 2;
graphConf.defaultNode.nodes[0].y = graphConf.height / 2;
//console.log(graphConf.defaultNode.nodes[0]);
var prevLang = $("#mainInputLang").val();
var langArchive = new Map();
var loadedMap = new Map();
var activeNodeMap = new Map();
var activeLinkSet = new Set();
// INIT graph with invite node
createV4SelectableForceDirectedGraph(graphSvg,
                                     graphConf.defaultNode,
                                     activeNodeMap,
                                     activeLinkSet,
                                     loadedMap,
                                     graphConf);
