# heavyReqDetector
cli tool
## aws-cli-js Prerequisites
The aws command line interface must be installed and accessible in the path
## config
specify config/config_file.json with .... and config/query with a query that delivers a list of requests, create an .env file with aws credentials and 

# current codebase
## manual_deliverables/grouping.js
takes output from Cloudwatch on query: get Requests for a specific time period and group by url; returns grouped with variables like "praxis-XXXX"
## manual_deliverables/urls.csv
example of such an output, exported from the AWS Console (todo: should be requested through code)
## manual_deliverables/getCPUUtilizationMetric.sh
example script for sending requests to AWS Cloudwatch with time variables