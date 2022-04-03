// CONFIG: MONITORING TOOL
var awsCli = require('aws-cli-js');
const { getPeakUTCs, readJSONfromFile, writeJSONToFile } = require('./helpers.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

var Options = awsCli.Options;
var Aws = awsCli.Aws;

var options = new Options(
    process.env.ACCESS_KEY,         /* accessKey    */
    process.env.SECRET_KEY,         /* secretKey    */
    null,                           /* sessionToken */
    null,                           /* currentWorkingDirectory */
    'aws'                           /* cliPath */
);

var aws = new Aws(options);
var config = readJSONfromFile('config/config_file.json');

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

// CONFIG: MONITORING TOOL
async function fetchRequestCount() { 
    const start_time_UTC = new Date(config.start_time.split('+')[0]).getTime()
    const end_time_UTC = new Date(config.end_time.split('+')[0]).getTime()
    // start the query 

    console.log("Peak detection: start query: requestCount")
    let query_id
    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${start_time_UTC} --end-time ${end_time_UTC} --query-string 'fields @timestamp, RequestCount | filter @logStream like "biz" and message like "request completed" | stats count(*) as RequestCount by bin(${config.interval_in_sec/60}min) | limit 10000'`).then(function (data) {
        query_id = data.object.queryId
    }).catch((e) => {
        console.log(e)
    });
    console.log(`requestCount query id: ${query_id}`)
    // run the query
    console.log("Peak detection: run query: requestCount")
    let status, res
    while (status !== "Complete") {
        res = await aws.command(`logs get-query-results --query-id ${query_id}`).then(function (data) {
            status = data.object.status
            if (status === 'Complete') {
                return data.object.results.map(x => { 
                    return { 
                    // adding the timezone difference, since Cloudwatch Logs substracts this difference twice
                    timestamp: new Date(x[0].value).addHours(config.timezone_diff).toISOString(), 
                    count: parseInt(x[1].value) 
                }})
            }
        }).catch((e) => {
            console.log(e)
        });
    }

    console.log("Peak detection: requestCount: done")
    await writeJSONToFile(`./data/peak_detection`, `request_count.json`, res)
    return res;
}

// CONFIG: MONITORING TOOL
async function fetchCPUValues() { 
    // start the query 
    console.log("Peak detection: fetch Cloudwatch metrics: CPU values")
    res = await aws.command(`cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name ${config.metric} --dimensions Name=InstanceId,Value=${config.EC2_instance_id} --statistics Maximum --start-time ${config.start_time} --end-time ${config.end_time} --period ${config.interval_in_sec}`).then(function (data) {
        return data.object.Datapoints
            // retrieve only timestamp and maximum CPU utilization
            .map(x => { return { 
                timestamp: new Date(x.Timestamp).toISOString(), 
                value: x.Maximum
            }})
            // sort by date ASC
            .sort((firstEl, secondEl) => { return new Date(secondEl["timestamp"]) - new Date(firstEl["timestamp"]) })
    }).catch((e) => {
        console.log(e)
    })

    console.log("Peak detection: CPU values: done")
    await writeJSONToFile(`./data/peak_detection`, `CPU_values.json`, res)
    return res;
}

// CONFIG: MONITORING TOOL
async function fetchURLs(timestamp) { 
        // calculate the start_time and end_time (UTC) of the peak 
        const { peak_start_time_UTC, peak_end_time_UTC } = getPeakUTCs(timestamp)
        // start the query 
        let query_id
        await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${peak_start_time_UTC} --end-time ${peak_end_time_UTC} --query-string 'fields @timestamp, req.url as RequestUrl | filter @logStream like "biz" and message like "request completed" | stats count(*) as RequestCount by req.url | limit 10000'`).then(function (data) {
            query_id = data.object.queryId
        }).catch((e) => {
            console.log(e)
        });
    
        // run the query
        let status, res
        while (status !== "Complete") {
            try {
                let { stdout } = await exec(`aws logs get-query-results --query-id ${query_id}`);       
                stdout = JSON.parse(stdout)     
                status = stdout.status
                if (status === 'Complete') {
                    res = stdout.results
                    .map(x => { return { 
                        // remove the search part from the url
                        url: x[0].value.split("?")[0], 
                        count: parseInt(x[1].value) 
                    }})
                }
    
            } catch (err) {
               console.error(err);
            };
        }
    
        return res;
}

// CONFIG: MONITORING TOOL
async function runQuery(regex, timestamp) {
    // calculate the start_time and end_time (UTC) of the peak 
    const { peak_start_time_UTC, peak_end_time_UTC } = getPeakUTCs(timestamp)
    // start the query 
    let query_id
    // CONFIG: METRIC
    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${peak_start_time_UTC} --end-time ${peak_end_time_UTC} --query-string 'fields @timestamp, @message, responseTime | filter @logStream like "biz" and message like "request completed" and req.url like ${regex} | stats avg(responseTime), pct(responseTime, 95), pct(responseTime, 99), pct(responseTime, 99.5), pct(responseTime, 50)'`).then(function (data) {
        query_id = data.object.queryId
    }).catch((e) => {
        console.log(e)
    });

    // run the query
    let status, res
    while (status !== "Complete") {
        res = await aws.command(`logs get-query-results --query-id ${query_id}`).then(function (data) {
            status = data.object.status
            if (status === 'Complete') {
                return data.object.results[0]
            }
        }).catch((e) => {
            console.log(e)
        });
    }
    return res;
}
/**
 * Function takes an array of urls & corresponding Regex.
 * It returns the statistics from Cloudwatch fetched for each url group.
 * 
 * e.g.
 *  {
        "url": "/v/dev-0.0/tenants/bmg/subtenants/XXXXX/calls",
        "count": 213,
        "regex": /\/v\/dev-0.0\/tenants\/bmg\/subtenants\/(.*)\/calls/
    }
 * =>
    {
        "url": "/v/dev-0.0/tenants/bmg/subtenants/XXXXX/calls",
        "count": 213,
        "regex": /\/v\/dev-0.0\/tenants\/bmg\/subtenants\/(.*)\/calls/, 
        "avg(responseTime)": ,
        "pct(responseTime, 95)": ,
        "pct(responseTime, 99)": ,
        "pct(responseTime, 99.5)":,
        "pct(responseTime, 50)":
    }
 * 
 * @param {array} urlArray 
 */
// CONFIG: MONITORING TOOL
async function fetchResponseTimeData(urlArray, timestamp) {
    for (let i = 0; i < urlArray.length; i++) {
        console.log(`processing: ${i+1}/${urlArray.length}`)
        let statResultArr = await runQuery(urlArray[i].regex, timestamp)
        statResultArr.forEach(el => {
            urlArray[i][el.field] = parseFloat(el.value)
        });
        urlArray[i].regex = urlArray[i].regex.source
    }

    await writeJSONToFile(`./data/mid-results/${timestamp}`, `endpoints_with_stats.json`, urlArray)
    return urlArray;
}
module.exports = {
    fetchRequestCount,
    fetchCPUValues,
    fetchURLs,
    fetchResponseTimeData
};