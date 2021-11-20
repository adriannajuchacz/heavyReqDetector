const { groupAndCountUrls } = require('./urlGrouping.js');
const { generateRegex } = require('./regexGenerating.js');
const { fetchResponseTimeData } = require('./dataFetching.js');
const { processAndExport } = require('./resultProcessing.js');

const main = async () => {
    // TODO:
    // read the time_period & interval from conf
    // fetch the request Count per $interval for the $time_period
    // fetch the CPU usage per $interval for the $time_period
    // detect peak; find time point of the peak(s)
    // fetch request data (endpoint, count, ti) and save to ../data/urls.csv
    
    // group & count URLs, save result to the ../data/groupedUrls.json
    let urlArray = await groupAndCountUrls();
    // generate Statistics (result)
    urlArray = await generateRegex(urlArray)
    urlArray = await fetchResponseTimeData(urlArray)
    // process & save to csv
    await processAndExport(urlArray)
}

main()