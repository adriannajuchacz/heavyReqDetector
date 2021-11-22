var awsCli = require('aws-cli-js');
var fs = require('fs');
const jsonfile = require('jsonfile');

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
var config = JSON.parse(fs.readFileSync('config/config_file.json', 'utf8'));

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

Date.prototype.substractMinutes = function(m) {
    this.setTime(this.getTime() - (m*60*1000));
    return this;
}


async function fetchRequestCount() { 
    const start_time_UTC = new Date(config.start_time.split('+')[0]).getTime()
    const end_time_UTC = new Date(config.end_time.split('+')[0]).getTime()
    // start the query 
    let query_id
    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${start_time_UTC} --end-time ${end_time_UTC} --query-string 'fields @timestamp, RequestCount | filter @logStream like "biz" and message like "request completed" | stats count(*) as RequestCount by bin(${config.interval_in_sec/60}min) | limit 10000'`).then(function (data) {
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

    //save to json file
    fs.writeFile("./data/requestCount.json", JSON.stringify(res), function (err) {
        if (err) console.error(err)
    })
    return res;
}

async function fetchCPUValues() { 
    // start the query 
    res = await aws.command(`cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=${config.EC2_instance_id} --statistics Maximum --start-time ${config.start_time} --end-time ${config.end_time} --period ${config.interval_in_sec}`).then(function (data) {
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
    });

    //save to json file
    fs.writeFile("./data/CPUValues.json", JSON.stringify(res), function (err) {
        if (err) console.error(err)
    })
    return res;
}

async function fetchURLs(timestamp) { 
        // calculate the start_time and end_time (UTC) of the peak 
        const peak_start_time_UTC = new Date(timestamp).substractMinutes(config.peak_duration_in_min).getTime()
        const peak_end_time_UTC = new Date(timestamp).getTime()
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
            res = await aws.command(`logs get-query-results --query-id ${query_id}`).then(function (data) {
                status = data.object.status
                if (status === 'Complete') {
                    return data.object.results
                    .map(x => { return { 
                        // remove the search part from the url
                        url: x[0].value.split("?")[0], 
                        count: parseInt(x[1].value) 
                    }})
                }
            }).catch((e) => {
                console.log(e)
            });
        }
    
        return res;
}

async function runQuery(regex) {
    // start the query 
    let query_id
    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${start_time_UTC} --end-time ${end_time_UTC} --query-string 'fields @timestamp, @message, responseTime | filter @logStream like "biz" and message like "request completed" and req.url like ${regex} | stats avg(responseTime), pct(responseTime, 95), pct(responseTime, 99), pct(responseTime, 99.5), pct(responseTime, 50)'`).then(function (data) {
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
async function fetchResponseTimeData(urlArray, timestamp) {
    // TODO: calculate start_time and end_time of a peak
    for (let i = 0; i < urlArray.length; i++) {
        console.log(`processing: ${i+1}/${urlArray.length}`)
        let statResultArr = await runQuery(urlArray[i].regex)
        statResultArr.forEach(el => {
            urlArray[i][el.field] = parseFloat(el.value)
        });
    }
    //save to json file
    fs.writeFile("./data/urlsWithData.json", JSON.stringify(urlArray), { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })
    return urlArray;
}
module.exports = {
    fetchRequestCount,
    fetchCPUValues,
    fetchURLs,
    fetchResponseTimeData
};