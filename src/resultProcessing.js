const createCsvWriter = require('csv-writer').createObjectCsvWriter;
var regression = require('regression');
var fs = require('fs');
const mkdirp = require('mkdirp');

var config = JSON.parse(fs.readFileSync('config/config_file.json', 'utf8'));

async function detectPeak() {
    let requestCount = JSON.parse(fs.readFileSync('data/requestCount.json', 'utf8'));
    let CPUValues = JSON.parse(fs.readFileSync('data/CPUValues.json', 'utf8'));

    // TODO:
    // if requestCount[0].timestamp !== CPUValues[0].timestamp
    // merge requests and CPU values
    let merged = []
    // format: [ [0, 1], [32, 67], [12, 79] ]
    let array_for_regression = []
    for (let i = 0; i < requestCount.length; i++) {
        if (requestCount[i].timestamp !== CPUValues[i].timestamp) {
            throw new Error('Something went wrong with the fetching the CPUValues & RequestCount');
        }
        merged.push({
            timestamp: requestCount[i].timestamp,
            cpuValue: CPUValues[i].value, 
            requestCount: requestCount[i].count
        })
        array_for_regression.push([requestCount[i].count, CPUValues[i].value])
    }
    // calculate linear regression
    const result = regression.linear(array_for_regression, {
        order: 2,
        precision: 4,
      })
    
    // calculate expected values and difference
    
    // TODO: remove change
    for (let i = 0; i < merged.length; i++) {
        //calculate expected metric value
        let expectedValue = result.predict(merged[i].requestCount)[1]

        let difference = merged[i].cpuValue/expectedValue;
        merged[i]["difference"] = difference;
    }
    // TODO: calculate variance
    // sort by difference DESC
    merged.sort((firstEl, secondEl) => { return  secondEl.difference - firstEl.difference })
    // return 3 highest peaks
    return merged.slice(0, config.number_of_points)//.map(x => { return x.timestamp });
}


async function processAndExport(timestamp) {
    let urlArray = JSON.parse(fs.readFileSync(`./data/mid-results/${timestamp}/urlsWithData.json`, 'utf8'));
    for (let i = 0; i < urlArray.length; i++) {
        // calculate cumulated_response_time
        let weight = urlArray[i]["count"] * urlArray[i]["avg(responseTime)"]
        urlArray[i]["cumulated_response_time"] = weight

        // calculate the percentiles to median ratio
        urlArray[i]["5%_to_median"] = urlArray[i]['pct(responseTime, 95)'] / urlArray[i]['pct(responseTime, 50)']
        urlArray[i]["1%_to_median"] = urlArray[i]['pct(responseTime, 99)'] / urlArray[i]['pct(responseTime, 50)']
        urlArray[i]["0.5%_to_median"] = urlArray[i]['pct(responseTime, 99.5)'] / urlArray[i]['pct(responseTime, 50)']

        // calculate the optimization potential 
        urlArray[i]["optimization_potential"] = urlArray[i]["cumulated_response_time"] * urlArray[i]["5%_to_median"] * urlArray[i]["1%_to_median"] * urlArray[i]["0.5%_to_median"]
    }
    // Sort DESC by optimization_potential
    urlArray = urlArray.sort((firstEl, secondEl) => { return secondEl["optimization_potential"] - firstEl["optimization_potential"] })


    // add a letter symbol
    for (let i = 0; i < urlArray.length; i++) {
        // add symbol
        urlArray[i]["symbol"] = String.fromCharCode(97 + i).toUpperCase()
    }


    // MAP A RESULT OBJECT FROM URLARRAY
    let resultArr = urlArray.map((o) => {
        return {
            "symbol": o.symbol,
            "url": o.url,
            "optimization potential": o.optimization_potential,
            "cumulated response time": o.cumulated_response_time,
            "median": o['pct(responseTime, 50)'],
            "top 5%": o['pct(responseTime, 95)'],
            "top 1%": o['pct(responseTime, 99)'],
            "top 0.5%": o['pct(responseTime, 99.5)']
        }
    })
    // WRITE THE RESULT TO A CSV FILE
    try {
        await mkdirp(`./data/results`);
        const csvWriter = createCsvWriter({
            header: Object.keys(resultArr[0]).map((k) => { return { id: k, title: k } }),
            path: `./data/results/${timestamp}.csv`
        });
        csvWriter.writeRecords(resultArr)       // returns a promise
            .then(() => {
                console.log('...Done producing a result');
            });

    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    detectPeak,
    processAndExport
};