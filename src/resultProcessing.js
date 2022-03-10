var regression = require('regression');
const { readJSONfromFile, writeJSONToFile } = require('./helpers.js');

var config = readJSONfromFile('config/config_file.json');

async function detectPeak() {
    let requestCount = readJSONfromFile('data/peak_detection/request_count.json');
    let CPUValues = readJSONfromFile('data/peak_detection/CPU_values.json');

    // TODO:
    // if requestCount[0].timestamp !== CPUValues[0].timestamp
    // merge requests and CPU values
    let merged = []
    // format: [ [0, 1], [32, 67], [12, 79] ]
    let array_for_regression = []
    for (let i = 0; i < requestCount.length; i++) {
        if (requestCount[i].timestamp !== CPUValues[i].timestamp) {
            throw new Error('Make sure that the start_time is a start of a 15min interval, e.g. 2022-02-28T00:00:00+01:00');
        }
        if (requestCount[i] && CPUValues[i]) {
            merged.push({
                timestamp: requestCount[i].timestamp,
                cpuValue: CPUValues[i].value, 
                requestCount: requestCount[i].count
            })
            array_for_regression.push([requestCount[i].count, CPUValues[i].value])
        }
    }
    // calculate linear regression
    const result = regression.linear(array_for_regression, {
        order: 2,
        precision: 4,
      })
    
    // calculate expected values and difference
    for (let i = 0; i < merged.length; i++) {
        //calculate expected metric value
        let expectedValue = result.predict(merged[i].requestCount)[1]

        let difference = merged[i].cpuValue/expectedValue;
        merged[i]["difference"] = difference;
        merged[i]["expectedValue"] = expectedValue;
    }

    // save to the dashboard
    await writeJSONToFile(`./dashboard/src/data`, `unsorted_points.json`, merged)

    // sort by difference DESC
    merged.sort((firstEl, secondEl) => { return  secondEl.difference - firstEl.difference })
    await writeJSONToFile(`./data/peak_detection`, `sorted_points.json`, merged)
        
    // save to the dashboard
    await writeJSONToFile(`./dashboard/src/data`, `sorted_points.json`, merged)

    // return 3 top as peaks
    let peaks = merged.slice(0, config.number_of_points)
    await writeJSONToFile(`./data/results`, `peaks_data.json`, peaks)

    // return 3 last as non_peaks
    let non_peaks = merged.slice((-1) * config.number_of_points)
    await writeJSONToFile(`./data/results`, `non_peaks_data.json`, non_peaks)

    return [...peaks, ...non_peaks];
}


async function processAndExport(timestamp) {
    let urlArray = readJSONfromFile(`./data/mid-results/${timestamp}/endpoints_with_stats.json`);
    for (let i = 0; i < urlArray.length; i++) {
        // calculate cumulated_response_time
        let cumulated_response_time = urlArray[i]["count"] * urlArray[i]["avg(responseTime)"]

        urlArray[i]['pct(responseTime, 50)'] = (urlArray[i]['pct(responseTime, 50)'] === 0)? 0.01 : urlArray[i]['pct(responseTime, 50)'];
        // calculate the percentiles to median ratio
        let P95_to_median = urlArray[i]['pct(responseTime, 95)'] / urlArray[i]['pct(responseTime, 50)']
        let P99_to_median = urlArray[i]['pct(responseTime, 99)'] / urlArray[i]['pct(responseTime, 50)']
        let P995_to_median = urlArray[i]['pct(responseTime, 99.5)'] / urlArray[i]['pct(responseTime, 50)']

        // calculate the optimization potential 
        urlArray[i]["optimization_potential"] = cumulated_response_time * ((P95_to_median * P99_to_median * P995_to_median)/3)
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
            "regex": o.regex,
            "optimization_potential": Math.round(o.optimization_potential),
            "cumulated_response_time": Math.round(o.cumulated_response_time),
            "count": o.count,
            "median": parseFloat(o['pct(responseTime, 50)']).toFixed(2),
            "pct(responseTime, 95)": parseFloat(o['pct(responseTime, 95)']).toFixed(2),
            "pct(responseTime, 99)": parseFloat(o['pct(responseTime, 99)']).toFixed(2),
            "pct(responseTime, 995)": parseFloat(o['pct(responseTime, 99.5)']).toFixed(2)
        }
    })

    // WRITE THE RESULT TO A JSON FILE
    await writeJSONToFile(`./data/results`, `${timestamp}.json`, resultArr)
}

async function transferDataToDashboard() {
    let peaks = readJSONfromFile(`./data/results/peaks_data.json`);

    let allPeaks = []
    peaks.forEach(el => {
        let data = readJSONfromFile(`./data/results/${el.timestamp}.json`);
        let peakObj = {
            "cpuData": {
                "expected_CPU": parseFloat(el.expectedValue).toFixed(2),
                "actual_CPU": parseFloat(el.cpuValue).toFixed(2),
                "timestamp": el.timestamp
            },
            "data": data
        }   
        allPeaks.push(peakObj)     
    });
    await writeJSONToFile(`./dashboard/src/data`, `peaks.json`, allPeaks)

    let non_peaks = readJSONfromFile(`./data/results/non_peaks_data.json`);
    let allNonPeaks = []
    non_peaks.forEach(el => {
        let data = readJSONfromFile(`./data/results/${el.timestamp}.json`);
        let obj = {
            "cpuData": {
                "expected_CPU": parseFloat(el.expectedValue).toFixed(2),
                "actual_CPU": parseFloat(el.cpuValue).toFixed(2),
                "timestamp": el.timestamp
            },
            "data": data
        }   
        allNonPeaks.push(obj)     
    });
    await writeJSONToFile(`./dashboard/src/data`, `non_peaks.json`, allNonPeaks)
}

module.exports = {
    detectPeak,
    processAndExport,
    transferDataToDashboard
};