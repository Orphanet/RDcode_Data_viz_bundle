# RDcode data visualization

Javascript app to exploit RDcode API.
Served with PHP.

## Requirements:
### Javascript:
#### External libraries
    D3 ver 4 (c) Mike Bostock
    D3-contex-menu Copyright (c) Patrick Gillespie and al.
    Jquery 3.5.1
    Tabulator v4.8.2 (c) Oliver Folkerd
    lodash (c) Jeremy Ashkenas
    Bootstrap bundle v4.0.0

## Deployment

Hosted on Gandihost, see credentials in redmine ticket:

http://redminor.orpha.net/issues/15951

Production URL:

http://dataviz.orphacode.org/

Development URL:

http://3f98f0a049.url-de-test.ws/index.html

## Overview

This application contain a single web page: index.html

It is composed of 3 independents blocks with some interaction between them.

### I. Suggest block

User inputs to selects language, search type (default to automatic) and
search bar 
(ORPHAcode, disorder name (preferred term or synonym), ICD-10 or OMIM code)

Table with a short summary to display the results.
From this table, the user can click on an entity to activate the blocks II. and III.

### II. Classification graph

It is a force directed graph based on D3 library. 
Its goal is to represent the hierarchical organisation of the entities in 
the Orphanet database.

The entity from block I. is queried through the API with its close relatives.
The user can then interact with the graph with drag, brush-selection, zoom and 
translation and a context menu.

From the context menu, a user can load new entities, hide linked entities 
(single linked leaves only), reroot the graph from a new node and query the 
summary displayed in part III.

### III. Entity summary

In this block, we display every information available in the RDcode API
for the selected entity.

This block can be exported in tab separated format.
Currently one row of label, and one row of information.
