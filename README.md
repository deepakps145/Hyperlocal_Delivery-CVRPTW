# Hyperlocal_Delivery-CVRPTW

Download the graphhopper jar from java server
then add a config.yml file in the graphopper folder with the following content:

```yml
graphhopper:
  graph.location: graph-cache
  datareader.file: your-map-file.pbf
  prepare.ch.weightings: fastest
  prepare.min_network_size: 200
  profiles:
    - name: car
      vehicle: car
      weighting: fastest
      turn_costs: false
      # Add more profiles as needed
``` 
then run the following command in the
Graphhopper
java -Xmx4g -Xms4g -jar graphhopper-web-11.0.jar server config.yml