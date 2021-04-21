# RDcode_Data_viz_bundle
Repository to build a stand alone docker version of RDcode data visualisation


### Virtual memory quick fix
    ERROR: [1] bootstrap checks failed
    max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]

for windows users, using wsl subsystem
open powershell run

    wsl -d docker-desktop
then

    sysctl -w vm.max_map_count=262144

