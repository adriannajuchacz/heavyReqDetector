var awsCli = require('aws-cli-js');
const jsonfile = require('jsonfile');
var fs = require('fs');

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
const start_time_UTC = new Date(config.start_time).getTime()
const end_time_UTC = new Date(config.end_time).getTime()
const statsToFetch = [
    {
        "statsType": "avg(responseTime)",
        "label": "avg_responseTime"
    },
    {
        "statsType": "pct(responseTime, 95)",
        "label": "pct95_responseTime"
    },
    {
        "statsType": "pct(responseTime, 99)",
        "label": "pct99_responseTime"
    },
    {
        "statsType": "pct(responseTime, 99.5)",
        "label": "pct99_5_responseTime"
    }
]

async function runQuery(statsType, regex) {
    // start the query 
    let query_id
    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${start_time_UTC} --end-time ${end_time_UTC} --query-string 'fields @timestamp, @message, responseTime | filter @logStream like "biz" and message like "request completed" and req.url like ${regex} | stats ${statsType}'`).then(function (data) {
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
                console.log(parseFloat(data.object.results[0][0].value))
                return parseFloat(data.object.results[0][0].value)
            }
        }).catch((e) => {
            console.log(e)
        });
    }
    return res;
}
/**
 * Function takes an array
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
        "avgResponseTime": ,
        "pct95": ,
        "pct99": ,
        "pct99_5":
    }
 * 
 * @param {array} urlArray 
 */
async function fetchResponseTimeData(urlArray) {
    for (let i = 0; i < urlArray.length; i++) {
        console.log(`processing: ${i}/${urlArray.length-1}`)
        for (let j = 0; j < statsToFetch.length; j++) {
            console.log(`       substep: ${statsToFetch[j].statsType}`)
            let statResult = await runQuery(statsToFetch[j].statsType, urlArray[i].regex)
            console.log(statResult)
            urlArray[i][statsToFetch[j].label] = statResult
        }
        console.log('============')
    }

    //save to json file
    jsonfile.writeFile("./data/urlsWithData.json", urlArray, { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })
}

module.exports = {
    fetchResponseTimeData
};