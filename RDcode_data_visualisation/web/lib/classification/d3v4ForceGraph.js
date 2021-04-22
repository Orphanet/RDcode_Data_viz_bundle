// Render functions for the classification graph

function createV4SelectableForceDirectedGraph(svg, graph, nodeMap, linkSet, loadedMap, graphConf) {
  // display standard cursor to override the loading cursor
  $("body").css("cursor", "default");
  $("nodeText").css("cursor", "default");

  let parentWidth = graphConf.width;
  let parentHeight = graphConf.height;

  // Define Context menu options
	var menu = function(d, i) {
	  var menu = Array();
	  menu = [{
        title: "Info",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          console.log(d);
          console.log(d.classif);
          disorderInfo($("#mainInputLang").val(), d.id);
        },
      },
      {
        title: "Restart from this entity",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          var inputLang = $("#mainInputLang").val();
          var inputValue = d.id;
          var Label = d.label;
          freeze();
          classificationEntry(inputLang, inputValue, Label, graphConf, completeness=2, loadedMap, showClassif=true);
          disorderInfo(inputLang, d.id);
        },
      },
      {
        divider: true,
      },
      {
        title: "Parents",
      }
    ];
    if (d.queried === -1 || d.queried === 1) {
      menu.push({
        title: "Show parents",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze();
          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=0, loadedMap);
        },
      });
    }
    if (d.queried === 0 || d.queried === 2) {
      menu.push({
        title: "Hide parents",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=0)
        }
      });
    };
    menu.push({
      divider: true,
    });
    menu.push({
      title: "Children",
    });
    if (d.queried === -1 || d.queried === 0) {
      menu.push({
        title: "Show children",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze();
          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=1, loadedMap);
        }
      });
    };
    if (d.queried === 1 || d.queried === 2) {
      menu.push({
        title: "Hide children",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=1)
        }
      });
    };
    menu.push({
      divider: true,
    });
    menu.push({
      title: "Parents & children",
    });
    if (d.queried !== 2) {
      menu.push({
        title: "Show both",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze(); // dismiss most graph behavior to prevent loading bug
          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=2, loadedMap);
        }
      });
    };
    if (d.queried === 2) {
      menu.push({
        title: "Hide both",
        action: function (d, i) {
          // Quickfix for buggy classification head and invite node
          if (d.label.startsWith("Orphanet") || d.id === 0) {return}

          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=2)
        }
      });
    };
    return menu;
  }

  var svg = d3.select('svg')
  .attr('width', parentWidth)
  .attr('height', parentHeight)
  .on("contextmenu", function(data, index) {
//    stop showing browser menu
    d3.event.preventDefault();
  })

  // remove any previous graphs
  svg.selectAll('.g-main').remove();
  svg.selectAll('circle').remove();
  svg.selectAll('text').remove();
  svg.selectAll('image').remove();

  var gMain = svg.append('g')
  .classed('g-main', true);

//  Background element used to unselect on click
  var unselectPlaceholder = gMain.append('rect')
  .attr('width', parentWidth)
  .attr('height', parentHeight)
  .style('fill', 'white')

  var gDraw = gMain.append('g');

// Limit the mouse wheel delta
  function myWheelDelta() {
    return d3.event.deltaY < 0 ? graphConf.zoom.zoomStep: -graphConf.zoom.zoomStep;
  }

//  console.log("received", graphConf.zoom);
//  apply initial zoom as defined in graphConf
  gDraw.attr("transform", "translate(" + graphConf.zoom.actual.x + "," + graphConf.zoom.actual.y + ")" +
                          "scale(" + graphConf.zoom.actual.k + ")");

  var zoom = d3.zoom()
  .scaleExtent([0.1, 3])
  .wheelDelta(myWheelDelta)
  .on('zoom', zoomed)

  svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(graphConf.zoom.actual.x, graphConf.zoom.actual.y)
                                                     .scale(graphConf.zoom.actual.k));

  function zoomFit(graphConf) {
    var bounds = gDraw.node().getBBox();
    var parent = svg.node();
    var fullWidth = parent.clientWidth,
        fullHeight = parent.clientHeight;
    var width = bounds.width,
        height = bounds.height;
    var midX = bounds.x + width / 2,
        midY = bounds.y + height / 2;

    if (width == 0 || height == 0) return; // nothing to fit
    var newScale = (1.0 - graphConf.zoom.autoFitPadding) / Math.max(width / fullWidth, height / fullHeight);
    var newTranslate = [fullWidth / 2 - newScale * midX, fullHeight / 2 - newScale * midY];

    svg.transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(newTranslate[0], newTranslate[1]).scale(newScale));
  }

  // Handmade legend
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 70).attr("r", 10).style("fill", graphConf.color.get("Group of disorders"))
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 45).attr("r", 10).style("fill", graphConf.color.get("Disorder"))
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 20).attr("r", 10).style("fill", graphConf.color.get("Subtype of disorder"))
  svg.append("text").attr("x", 35).attr("y", parentHeight - 65).text("Group of disorders").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", 35).attr("y", parentHeight - 40).text("Disorder").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", 35).attr("y", parentHeight - 15).text("Subtype of disorder").style("font-size", "15px").attr("alignment-baseline","middle")

  // Menu
  var fitIcon = svg.append("svg:image")
//    .attr("xlink:href", "media/zoomfitbest_104296.svg")
    .attr("xlink:href", "media/gui_zoom_fit_icon_156980.svg")
    .attr("x", parentWidth - 70)
    .attr("y", 22)
    .attr("width", "48px")
    .attr("height", "48px")
    .on('click', function() {
      zoomFit(graphConf);
    });

  function onResizeGraph() {
//    console.log("resize");
    graphConf.width = graphSvg.node().getBoundingClientRect().width;
    graphConf.height = graphSvg.node().getBoundingClientRect().height;
    parentWidth = graphConf.width;
    parentHeight = graphConf.height;
    graphConf.zoom.ini.x = graphCenter("x", graphConf);
    graphConf.zoom.ini.y = graphCenter("y", graphConf);
    graphConf.zoom.actual = graphConf.zoom.ini;

    fitIcon.attr("x", parentWidth - 70);
    fitIcon.attr("y", 22);
    zoomFit(graphConf);
  }

// adjust the graph on windows resize and classification spoiler
  window.addEventListener("resize", onResizeGraph);
  document.getElementById("classificationSpoiler").addEventListener("click", onResizeGraph);

  function wrap(text, width) {
  //    return;
      text.each(function() {
          var text = d3.select(this);
          // Remove the id (orphacode) for the invite message
          var textString = text.text();
          textString = (textString[0] === "0") ? textString.slice(2 ,textString.length + 1) : textString;

          // adding spaces between some terms that are linked by hyphen or slash preventing word split
          var curatedSpace = textString.replaceAll("-", "- ").replaceAll("/", "/ ");
          var words = curatedSpace.split(/\s+/).reverse();
          var word;
          var line = [];
          var lineHeight = graphConf.textLineHeight; // em;
          var paragraphInfo = [];
          var previousLength = 0;
          var textLength = 0;
          var lineOffset = 0;

//          console.log(curatedSpace);

          function addOneWord() {
            line.push(words.pop());
            text.text(line.join(" "));
            textLength = text.node().getComputedTextLength();
          }
          function removeOneWord() {
            words.push(line.pop());
            text.text(line.join(" "));
            textLength = text.node().getComputedTextLength();
          }

          function validateLine() {
            paragraphInfo.push([line.join(" "), previousLength, textLength]);
            previousLength = textLength;
            line = [];
            text.text("");
            textLength = 0;
          }

          function chromeFix(paragraphInfo) {
            var dX = 0;
//            console.log(navigator.userAgent)
            if (/chrome/i.test( navigator.userAgent )) {
              if (paragraphInfo[0][2] !== paragraphInfo[paragraphInfo.length - 1][2]) {
                dX = - (paragraphInfo[0][2] - paragraphInfo[paragraphInfo.length - 1][2]) / 4;
              }
            }
//            console.log(dX)
            return dX;
          }

          while(words.length) {
            addOneWord();
            if (textLength > width) {
              if (line.length > 1) {
                removeOneWord();
                validateLine();
              } else {
                validateLine();
              }
            }
          }

          if (line.length) {
            paragraphInfo.push([line.join(" "), previousLength, textLength]);
          }
//          console.log(paragraphInfo);
          text.text(null);

          var computedOffset = (paragraphInfo.length-1)/2;

          var dX = chromeFix(paragraphInfo); // fix horizontal offset for Chrome and Edge
//        Write the computed tspan
          tspan = text.append("tspan")
              .attr("dy", -computedOffset + lineOffset + "em")
              .attr("dx", -paragraphInfo[0][1] + dX)
              .text(paragraphInfo[0][0]);

          if (paragraphInfo.length > 1) {
            for (line of paragraphInfo.slice(1, paragraphInfo.length+1)) {
              var adjust = Math.abs(line[1]/2 - line[2]/2);
              adjust = (line[1] > line[2]) ? adjust : -adjust;
//              console.log(adjust);
              tspan = text.append("tspan")
                          .attr("dy", lineHeight + "em")
                          .attr("dx", -line[1] + adjust)
                          .text(line[0]);
            }
          }
      });
  }

  function zoomed() {
//    console.log("d3.event.transform", d3.event.transform);
//    console.log(graphConf);
    gDraw.attr('transform', d3.event.transform);

    // keep track of the currentZoomScale and currentPosition
    graphConf.zoom.actual = d3.event.transform;
  }

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  if (! ("links" in graph)) {
    console.log("Graph is missing links");
    return;
  }

// dismiss most graph behavior to prevent loading bug
  function freeze() {
    simulation.stop();
    node
      .on("mouseover", null)
      .on("mouseout", null)
      .on("click", null)
      .on("contextmenu", null)
      .call(d3.drag()
      .on("start", null)
      .on("drag", null)
      .on("end", null));

    nodeText
      .on("mouseover", null)
      .on("mouseout", null)
      .on("click", null)
      .on("contextmenu", null)
      .call(d3.drag()
      .on("start", null)
      .on("drag", null)
      .on("end", null));
    // display loading cursor
    $("body").css("cursor", "progress");
    $(".nodeText").css("cursor", "progress");
  }

  var nodes = {};
  var i;
  for (i = 0; i < graph.nodes.length; i++) {
    nodes[graph.nodes[i].id] = graph.nodes[i];
    graph.nodes[i].weight = 1;
  }

  // the brush needs to go before the nodes so that it doesn't
  // get called when the mouse is over a node
  var gBrushHolder = gDraw.append('g');
  var gBrush = null;

  var link = gDraw.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("stroke-width", 1);

  var node = gDraw.append("g")
    .attr("class", "node")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", graphConf.nodeSize) // radius

    .attr("fill", function(d) {
      if ('color' in d)
        return d.color;
      else
        return color(d.group);
    })

//    on click function
//    .on("click", function(d, i) {
//      if (!d.queried) {
//        freeze(); // dismiss most graph behavior to prevent loading bug
//        console.log("clicked", d.id, d.label);
//        console.log(d);
//        loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf);
//      }
//    })
//  on mouseover / hover function
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
//  context menu
    .on("contextmenu", d3.contextMenu(menu))
//  node drag
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

  var nodeText = gDraw.append("g")
    .attr("class", "nodeText")
    .selectAll("text")
    .data(graph.nodes)
    .enter().append("text")
      .text(function(d) { return d.id + " " + d.label;})
      .call(wrap, graphConf.textWrapSize)
//      .on("click", function(d, i) {
//        if (!d.queried) {
//          freeze(); // dismiss most graph behavior to prevent loading bug
//          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf);
//        }
//      })
//    on mouseover / hover function
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
//    context menu
      .on("contextmenu", d3.contextMenu(menu))
//    node drag
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));


  // add titles for mouseover popup on node and node text
  node.append("title")
    .text(function(d) {
      if ('label' in d)
        return d.id + " " + d.label;
      else
        return d.id;
    });
  nodeText.append("title")
    .text(function(d) {
      if ('label' in d)
        return d.id + " " + d.label;
      else
        return d.id;
    });

  // Special TEXT FORMAT for the node selected from the search table or from a previous re-root
//  d3.select('svg').selectAll(".nodeText").selectAll("text").filter(function(d, i) {return d.id === graphConf.startId;})
//  .style("fill", "red");

  // Special BORDER for the node selected from the search table or from a previous re-root
  svg.selectAll(".node").selectAll("circle").filter(function(d, i) {return d.id === graphConf.startId;})
  .style("stroke", "black").style("stroke-width", "2px")

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; })
      .distance(graphConf.force.linkSize)
      .strength(graphConf.force.linkStrength)
    )
    .force("charge", d3.forceManyBody()
      .strength(graphConf.force.charge)
    )
//    .force("center", d3.forceCenter(parentWidth / 2, parentHeight / 2))
    .force("x", d3.forceX(parentWidth / 2)
      .strength(graphConf.force.xCentering)
    )
    .force("y", d3.forceY()
      .y(function(d) {
        return ((parentHeight / 2) + d.depth * graphConf.force.linkSize);
      })
      .strength(graphConf.force.yLayer)
    )
    .force("collide", d3.forceCollide(graphConf.nodeSize)
    );


  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  simulation.alpha(graphConf.simulation.alpha);
//  simulation.alphaTarget(graphConf.simulation.alphaTarget);
//  simulation.alphaMin(graphConf.simulation.alphaMin);
  simulation.alphaDecay(graphConf.simulation.alphaDecay);

  function ticked() {
    // update node and line positions at every step of
    // the force simulation
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    nodeText.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });

//    console.log(simulation.alpha());
  }

  var brushMode = false;
  var brushing = false;

  var brush = d3.brush()
    .extent([[0,0], [parentWidth, parentHeight]])
    .on("start", brushstarted)
    .on("brush", brushed)
    .on("end", brushended);

  function brushstarted() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function(d) {
      d.previouslySelected = shiftKey && d.selected;
    })
  }

//  Unselect
  unselectPlaceholder.on('click', () => {
    node.each(function(d) {
      d.selected = false;
      d.previouslySelected = false;
    });
    node.classed("selected", false);
  })

  function brushed() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    var brushArea = d3.event.selection;
//    console.log(brushArea[0], brushArea[1])

    node.classed("selected", function(d) {
      return d.selected = d.previouslySelected ^
      (brushArea[0][0] <= d.x && d.x < brushArea[1][0]
       && brushArea[0][1] <= d.y && d.y < brushArea[1][1]);
    });
  }

  function brushended() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;
    if (!gBrush) return;

    gBrush.call(brush.move, null);

    if (!brushMode) {
      // the shift key has been release before we ended our brushing
      gBrush.remove();
      gBrush = null;
    }

    brushing = false;
  }

  d3.select('body').on('keydown', keydown);
  d3.select('body').on('keyup', keyup);

  var shiftKey;

  function keydown() {
    shiftKey = d3.event.shiftKey;

    if (shiftKey) {
      // if we already have a brush, don't do anything
      if (gBrush)
        return;

      brushMode = true;

      if (!gBrush) {
        gBrush = gBrushHolder.append('g');

//        console.log(graphConf.zoom.actual)

        if (graphConf.zoom.actual.k < 1) {
          var scaledWidth = parentWidth / graphConf.zoom.actual.k;
          var scaledHeight = parentHeight / graphConf.zoom.actual.k;
        } else {
          var scaledWidth = parentWidth * graphConf.zoom.actual.k;
          var scaledHeight = parentHeight * graphConf.zoom.actual.k;
        }

        brush.extent([[-scaledWidth - graphConf.zoom.actual.x,-scaledHeight - graphConf.zoom.actual.y],
                      [scaledWidth + graphConf.zoom.actual.x, scaledHeight + graphConf.zoom.actual.y]])

        gBrush.call(brush);
      }
    }
  }

  function keyup() {
    shiftKey = false;
    brushMode = false;

    if (!gBrush)
      return;

    if (!brushing) {
      // only remove the brush if we're not actively brushing
      // otherwise it'll be removed when the brushing ends
      gBrush.remove();
      gBrush = null;
    }
  }

  function dragstarted(d) {
    simulation.alphaDecay(0); // stop the decay timer while a node is dragged
    simulation.alpha(1).restart(); // set the alpha to 1 to give energy to the system and restart in case it stopped

    if (!d.selected && !shiftKey) {
      // if this node isn't selected, then we have to unselect every other node
      node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
    }

    d3.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed |= 2;
      d.fx = d.x;
      d.fy = d.y;
    })
  }

  function dragged(d) {
    //d.fx = d3.event.x;
    //d.fy = d3.event.y;
      node.filter(function(d) { return d.selected; })
      .each(function(d) {
        d.fx += d3.event.dx;
        d.fy += d3.event.dy;
      })
  }

  function dragended(d) {
    simulation.alphaDecay(graphConf.simulation.alphaDecay); // relaunch the timer with normal decay rate

    d.fx = null;
    d.fy = null;
    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed &= ~6;
      d.fx = null;
      d.fy = null;
    })
  }

// hover
  function mouseover(d,i,nodes) {
//    svg.selectAll(".node").selectAll("circle").filter(function(d, index) {return index === i;}).transition()
//      .duration(500)
//      .attr("r", graphConf.nodeSize*2);
    d3.select(this)
      .call(highlightKin)
  }

  function mouseout(d,i,nodes) {
//    svg.selectAll(".node").selectAll("circle").filter(function(d, index) {return index === i;}).transition()
//        .duration(500)
//        .attr("r", graphConf.nodeSize);
    svg.selectAll(".link").style("stroke-opacity", 1);
    svg.selectAll(".node").style("fill-opacity", 1);
    d3.select(this)
      .call(removeHighlightKin)
  }

  function removeHighlightKin(hoveredNode) {
    var hoveredId = hoveredNode.node().__data__.id;
    var hoveredIndex = hoveredNode.node().__data__.index;
    var hoveredIdParent = hoveredNode.node().__data__.parentId;
    var hoveredIdChildren = hoveredNode.node().__data__.childrenId;

//  self
    svg.selectAll(".node").selectAll("circle").filter(function(d, i) {return i === hoveredIndex;})
    .style("fill-opacity", null)
//  unfade links and nodes connected to the current node
//  Links
    svg.selectAll("line").filter(function(d) {
      return d.source.id == hoveredId || d.target.id == hoveredId;
    })
    .style("stroke-opacity", null);
//  Nodes
    svg.selectAll(".node").selectAll("circle").filter(function(d) {
      return hoveredIdParent.has(d.id) || hoveredIdChildren.has(d.id)
    })
    .style("fill-opacity", null);
  }

  function highlightKin(hoveredNode) {
    var hoveredId = hoveredNode.node().__data__.id;
    var hoveredIndex = hoveredNode.node().__data__.index;
    var hoveredIdParent = hoveredNode.node().__data__.parentId;
    var hoveredIdChildren = hoveredNode.node().__data__.childrenId;

//  Dim all nodes and links
    svg.selectAll(".link").style("stroke-opacity", 0.3);
    svg.selectAll(".node").style("fill-opacity", 0.3);

//  restore full opacity to the closely related nodes and links

//  self
    svg.selectAll(".node").selectAll("circle").filter(function(d, i) {return i === hoveredIndex;})
    .style("fill-opacity", 1)
//  unfade links and nodes connected to the current node
//  Links
    svg.selectAll("line").filter(function(d) {
      return d.source.id == hoveredId || d.target.id == hoveredId;
    })
    .style("stroke-opacity", 1);
//  Nodes
    svg.selectAll(".node").selectAll("circle").filter(function(d) {
      return hoveredIdParent.has(d.id) || hoveredIdChildren.has(d.id)
    })
    .style("fill-opacity", 1);
  }
}
