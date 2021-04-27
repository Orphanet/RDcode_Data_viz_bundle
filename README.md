# RDcode_Data_viz_bundle
Repository to build a stand alone docker version of RDcode data visualisation

## Virtual memory quick fix
    ERROR: [1] bootstrap checks failed
    max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]

for windows users, using wsl subsystem
open powershell run

    wsl -d docker-desktop
then

    sysctl -w vm.max_map_count=262144

## API: RDcode
* Find a production grade copy the API.
* Remove unnecessary folders (tools, backup...)
* /!\ DELETE elasticsearch production credentials and uncomment docker inner server from swagger_server/config.py
* Check and remove other credentials in the other readme, if any.
* Build an image with the API_RDcode/Dockerfile

## RDcode_data_visualisation
* Find a production grade copy the RDcode_dataviz.
* Change the name of the "static" folder to "web"
* In web/lib/mainConfig.js, change baseUrl of the API to localhost:port with port=> configured port in docker-compose and in the API image
* Build an image with the RDcode_data_visualisation/Dockerfile

## Elasticsearch
* Use the configuration provided in docker-compose.yml (or a better one)

## Bundle creation: Docker compose
    docker-compose up

## To be defined:
#### EITHER
* Feed the elasticsearch index with data from the git repository orphadata_elastic
* Save the elasticsearch container as an image (unknown procedure at the time of writing)
* Save all images and give them to the client
#### OR
* Save all images and give them to the client with docker-compose.yml 
* Also give the index with data from the git repository orphadata_elastic