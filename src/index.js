const { groupAndCountUrls } = require('./urlGrouping.js');
const { generateRegex } = require('./regexGenerating.js');
const { fetchResponseTimeData } = require('./dataFetching.js');
const { processAndExport } = require('./resultProcessing.js');

const main = async () => {
    // TODO:
    // STEP 1: fetch data and save to ../data/urls.csv
    // STEP 2: group & count URLs, save result to the ../data/groupedUrls.json
    let urlArray = await groupAndCountUrls();
    // STEP 3: generate Statistics (result)
    urlArray = await generateRegex(urlArray)
    urlArray = await fetchResponseTimeData(urlArray)
    // STEP 4: process 
    urlArray = await processData(urlArray)
    // TODO:
    // STEP 5: export to csv
    
}

main()