const { groupAndCountUrls } = require('./urlGrouping.js');
const { generateRegex } = require('./regexGenerating.js');
const { fetchRequestCount, fetchCPUValues, fetchURLs, fetchResponseTimeData } = require('./dataFetching.js');
const { detectPeak, processAndExport } = require('./resultProcessing.js');

const main = async () => {
    // fetching data for the peak detection
    console.log("Fetching data for the peak detection...")
    await fetchRequestCount()
    await fetchCPUValues()
    
    // peak detection
    let peaks = await detectPeak()
    console.log("Detected the following peaks:")
    peaks.forEach(element => {
        console.log(`Timestamp: ${new Date(element.timestamp).toLocaleString()} => ${parseFloat(element.difference*100).toFixed(2)}% higher CPU than expected`)
    });

    console.log("Fetching data for the load analysis...")    
    await peaks.forEach(async (element) => {
        // fetch the list of received requests for each timestamp
        let urlArray = await fetchURLs(element.timestamp);

        // group & count URLs, save result to the ../data/groupedUrls.json
        urlArray = await groupAndCountUrls(urlArray, element.timestamp);
     
        // generate Statistics (result)
        urlArray = await generateRegex(urlArray)
        urlArray = await fetchResponseTimeData(urlArray, element.timestamp)
        // process & save to csv
        await processAndExport(urlArray)
        
    })
 
}

main()