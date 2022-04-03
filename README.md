# heavyReqDetector
A Javascript tool for detecting burdensome endpoints in REST-based systems, based on the correlation between system's load and changes in a specific metric (default CPU utilization). The user specifies the metric they're interested in and the tool delivers information about which endpoints of the system have impact the metric values the most. The tool is supposed to be used on top of another monitoring toot (default AWS Cloudwatch). 
### Methodology
A user specifies a time period in which the burdensomeness of the endpoints in regards to a specific metric should be examined. The tool finds "peaks" of the metric values - data points where the metric reached an unexpectedly high value for the number of requests in the time of that peak. Next, the tool extracts endpoints that were requested in each peak. For each endpoint the tool calculates a burdensomeness score. The burdensomeness score values are presented in a dashboard, alongside with other additional summaries of the collected data. 

### Config
When using the default version of the tool (metric: CPU utilisation, monitoring tool: AWS Cloudwatch), a user must only adjust the **config/config_file.json** \
Example of the config file can be found in the repository. Here's an explanation of the elements:\
**metric** - metric that is supposed to be examined. See "Using a metric different than CPU utilization" section on how to use the tool with a metric other than the default CPU utilisation. \
**start_time** - start of the time period we want to examine\
**end_time** - start of the time period we want to examine\
**interval_in_sec** - monitoring tools have offer different time granularity of monitoring data, e.g. with AWS Cloudwatch we can view metric values in intervals of 10sec, 1min, 2min, 5min, and 15min. The value must be specified in seconds. \
**EC2_instance_id** - internal ID of the VM in the AWS enironment. (Must be adapted if used with a different cloud provider).\
**number_of_points** - a user can specify how many data points should be used in the examination. Depending on the amount of data, the number of the data points can significantly increase the execution time.\
**timezone_diff** - time difference from the UTC+0 time zone (GMT). This is a workaround for the aws-cli package used in this project. (Must be adapted if used with a different cloud provider).\
**peak_duration_in_min** - a user can specify how long should be the time period of "peaks", i.e. the time intervals we will examine. Depending on the amount of data, this value can significantly increase the execution time.\

##### Using a metric different than CPU utilization
This tool's default configuration is to work with CPU utilisation. In order to measure an impact of an endpoint group on that metric, we have developed a a method in which we measure the response time of single requests and use that as a indicator of a burdensomeness on a CPU. In order to use this tool with other metrics, a user is required to adjust the source code. A user needs to pick a parameter that correlates with the metric they want to examine and integrate it in the code. The code lines, in which this adjustments must be done, are preceded by a comment <code>CONFIG: METRIC</code>.

##### Using a monitoring tool different than AWS Cloudwatch
This tool is by default configured to work with the AWS Cloudwatch as a source of monitoring data. The usage of different monitoring tools is possible and requires adding changes to the source code. In order to connect with a different monitoring tool, a suitable SDK or an npm package must be installed. Moreover, the **src/dataFetching.js** component must be adjusted to the syntax of the SDK / npm package. The functions that require such adjustments are preceded by a comment <code>CONFIG: MONITORING TOOL</code>.

### Usage
To run the tool, make sure you have properly set the configuration (config/config_file.json) and run the following command in the root directory.
```npm start``` \
In order to start the dashboard and view the results, run ```cd dashboard/ &&  npm run start```  and open http://localhost:3000/ in browser.

### Results - Burdensomeness Score
The results with the "Burdensomeness Scores" of the endpoints are presented in the "Burdensomeness Score" section.\
![main_view](https://user-images.githubusercontent.com/22178546/161438976-cde190b0-b442-4d7c-8b4e-3cd663602b8f.png)
### Additional output
##### Endpoint Distribution
The tool provide a view with the distribution of the endpoints depending on the "single-request impact" parameter. In the following example we can see the what endpoint groups make up the load, depending on the response time, e.g. the first bar represents the requests with response time bigger than a median and smaller than 2xmedian. \
![endpoint_distribution](https://user-images.githubusercontent.com/22178546/161439285-eb2b77f5-5127-4377-8c62-2a418f2027ec.png)
##### Peak Detection
The following view presents the results of the "peak" detection - detection of the data points, where the metric value was significantly high for the current load size.
![peak_detection](https://user-images.githubusercontent.com/22178546/161439379-16aa8a01-74e4-445c-9989-6029bd0d53ee.png)
##### Peak vs Non-Peak Statistics
In this view we can compare the results of the examination of the "peak" data points with data point, for which the metric value was close to an expected value for the current load size. \
![stats](https://user-images.githubusercontent.com/22178546/161439528-1dfef707-f639-4993-acd4-876f5de37bf8.png)


### Requirements
node 12+, aws cli

