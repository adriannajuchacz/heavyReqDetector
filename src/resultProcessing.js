const jsonfile = require('jsonfile');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function processData(urlArray) {
    jsonfile.readFile("../data/urlsWithData.json", function (obj) {
        urlArray = obj
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
            const csvWriter = createCsvWriter({
                header: Object.keys(resultArr[0]).map((k) => {return {id: k, title: k}}),
                path: '../data/results.csv'
            });
            csvWriter.writeRecords(resultArr)       // returns a promise
                .then(() => {
                    console.log('...Done producing a result');
                });

        } catch (err) {
            console.error(err);
        }
    })
}

module.exports = {
    processData
};