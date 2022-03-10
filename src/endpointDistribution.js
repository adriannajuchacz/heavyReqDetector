var awsCli = require('aws-cli-js');
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
const { getPeakUTCs, readJSONfromFile, writeJSONToFile } = require('./helpers.js');
var config = readJSONfromFile('config/config_file.json');

function calculateIntervals(median, p995) {
    // intervals = [median, median*2, ... , median * x <= pct95 <= median * x+1]
    let intervals = []
    let curr_int = median
    for (let i=1; curr_int < p995; i++) {
        curr_int = i * median;
        intervals.push(curr_int)
    }
    return intervals
}

async function fetcheRequestCountPerEndpoint(regex, timestamp, minResponseTime, maxResponseTime) { 
    // calculate the start_time and end_time (UTC) of the peak 
    const { peak_start_time_UTC, peak_end_time_UTC } = getPeakUTCs(timestamp)
    // start the query 
    let query_id
    regex = new RegExp(regex);

    await aws.command(`logs start-query --log-group-name prod.aaron.ai --start-time ${peak_start_time_UTC} --end-time ${peak_end_time_UTC} --query-string 'fields @timestamp, @message, responseTime | filter @logStream like "biz" and message like "request completed" and req.url like ${regex} and responseTime > ${minResponseTime} and responseTime < ${maxResponseTime} | stats count(*) as RequestCount'`).then(function (data) {
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
                if (data.object.results.length === 0) return 0;
                return parseInt(data.object.results[0][0].value)
            }
        }).catch((e) => {
            console.log(e)
        });
    }
    return res;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

async function findMaxLevelAndAllEndpoints(peaksData) {
    let maxValue = 2;
    let endpoints = []
    // find all urls and max MedianMultiple
    peaksData.forEach(peak => {
        peak.endpointsData.forEach(endpoint => {
            endpoints.includes(endpoint.url) ? null : endpoints.push(endpoint.url)
            endpoint.intervalsData.forEach(interval => {
                (interval.ratioMedian > maxValue) ? maxValue = interval.ratioMedian : null
            })
        });
        
    });
    // TODO create endpointWithColors for dashboard RequestChart
    let endpointsWithColors = endpoints.map(x => {
        return {
            "url": x.url,
            "color": x.color
        }
            
    })
    await writeJSONToFile(`./dashboard/src/data`, `endpointsWithColors.json`, endpointsWithColors)

    return { 
        endpointsData: endpoints, 
        maxMultipleOfMedian: maxValue 
    };
}

async function processDataForDashboard() {
    let peaksData = readJSONfromFile(`./data/results/endpointDistribution_intervals.json`);
    
    let { endpointsData, maxMultipleOfMedian } = findMaxLevelAndAllEndpoints(peaksData)
    let preResults = []

    for (let level = 2; level <= maxMultipleOfMedian; level++) {
        let currentLevel = {
            multipleOfMedian: level,
            sumOfRequests: 0
        }
        currentLevel["endpoints"] = endpointsData.map(x => {
            return {
                "url": x,
                "requestCount": 0
            }
        })
        
        peaksData.forEach(peak => {
            peak.endpointsData.forEach(endpoint => {
                endpoint.intervalsData.forEach(interval => {
                    if(interval.ratioMedian === level) {
                        currentLevel.sumOfRequests += interval.requestCount
                        currentLevel.endpoints.map(e => {
                            if(e.url === endpoint.url) {
                                e.requestCount += interval.requestCount
                            }
                            return e;
                        })
                    }
                })
            });
            
        });
        preResults.push(currentLevel)
    }

    await writeJSONToFile("./data/results/", "endpointDistribution_preResults.json", preResults)

}

async function processPreResultsForRequestChart() {
    let preResults = readJSONfromFile(`./data/results/endpointDistribution_preResults.json`);
    let iteratorAndEndpointCount = preResults.map(x => {
        let eObj = {}
        x.endpoints.map(y => {
            eObj[y.url]= y.requestCount
        })
        return {
            multipleOfMedian: x.multipleOfMedian,
            ...eObj
        }
    })
    await writeJSONToFile(`./dashboard/src/data`, "endpointDistribution_iteratorAndEndpointCount.json", iteratorAndEndpointCount)
}

async function processPreResultsForRatioChart() {
    let preResults = readJSONfromFile(`./data/results/endpointDistribution_preResults.json`);
    let iteratorAndEndpointRatio = preResults.map(x => {
        let eObj = {}
        
        x.endpoints.map(y => {
            let percent = (y.requestCount/x.sumOfRequests) * 100
            eObj[y.url]= Math.round(percent * 100) / 100
        })
        return {
            multipleOfMedian: x.multipleOfMedian,
            ...eObj
        }
    })
    await writeJSONToFile(`./dashboard/src/data`, `endpointDistribution_iteratorAndEndpointRatio.json`, iteratorAndEndpointRatio)


}
async function calculateEndpointDistribution() {
    // load peaks
    let peaks = readJSONfromFile(`./data/results/peaks_data.json`);
    let peaksData = []
    //foreach peaks
    for (const el of peaks) {
        endpoints = readJSONfromFile(`./data/results/${el.timestamp}.json`);
        
        let peakData = {
            "timestamp": el.timestamp,
            "endpointsData": []
        }

        for (const endpoint of endpoints) {
            let endpointData = {
                "url": endpoint.url,
                "intervalsData": []
            }
            let intervals = calculateIntervals(endpoint.median, endpoint["pct(responseTime, 995)"])
            for(let i=0; i<(intervals.length - 1); i++) {
                let minResponseTime = intervals[i]
                let maxResponseTime = intervals[i+1]
                
                let requestCount = await fetcheRequestCountPerEndpoint(endpoint.regex, el.timestamp, minResponseTime, maxResponseTime)
                endpointData.intervalsData.push({
                    "ratioMedian": i+2,
                    "minValue": intervals[i],
                    "maxValue": intervals[i+1],
                    "requestCount": requestCount
                })
            }
            peakData.endpointsData.push(endpointData)
        };
        peaksData.push(peakData)
    };

    await writeJSONToFile("./data/results/", "endpointDistribution_intervals.json", peaksData)
    /**
     * let preResults = [
     *      {
     *          multipleOfMedian: 1,
     *          sumOfRequests: 1243,
     *          endpoints: [
     *              "/v/dev-0.0/tenants/smartpatcher/subtenants": 10,
     *              "/v/dev-0.0/tenants/dashboard/events": 3,
     *              "/v/dev-0.0/tenants/dashboard/statistics": 26,
     *              "/v/dev-0.0/tenants/eon/test": 0
     *          ]
     *      }
     *  
     * ]
     */
    // calculate ratio
    /**
     * let dashboardResult = [
     *      {
     *          multipleOfMedian: 1,
     *          endpoints: [
     *              "/v/dev-0.0/tenants/smartpatcher/subtenants": 10,
     *              "/v/dev-0.0/tenants/dashboard/events": 3,
     *              "/v/dev-0.0/tenants/dashboard/statistics": 26,
     *              "/v/dev-0.0/tenants/eon/test": 0
     *          ]
     *      }
     *  
     * ]
     */

    // save endpoints
    await writeJSONToFile(`./dashboard/src/data`, `endpointDistribution.json`, peaksData)
    processDataForDashboard()
}


module.exports = {
    calculateEndpointDistribution,
    processDataForDashboard,
    processPreResultsForRequestChart,
    processPreResultsForRatioChart
};