# heavyReqDetector
A cli tool for determining endpoints in an API with a highest optimization and are most likely to be responsible for peaks in a CPU usage.

### Config
##### Time period
In config/config_file.json specify the time period, in which the requests occured.
##### List of requests
In data/urls.csv save a list of requests with a count.

### Output
The tool currently groups the requests into enpoint groups and collects data about the average time for each group, that can be later used to determine the endpoints with the highest optimization potential.

### Usage
```npm start```


### Requirements
node 12+, aws cli
