const { groupAndCountUrls } = require('./urlGrouping.js');
const { generateRegex } = require('./helpers.js');
const { fetchRequestCount, fetchCPUValues, fetchURLs, fetchResponseTimeData } = require('./dataFetching.js');
const { detectPeak, processAndExport, transferDataToDashboard } = require('./resultProcessing.js');
const { calculateEndpointDistribution } = require('./endpointDistribution.js');

const main = async () => {
    // fetching data for the peak detection
    console.log("Fetching data for the peak detection...")
    await fetchRequestCount()
    await fetchCPUValues()
    
    // peak detection
    let all_data_points = await detectPeak()
    console.log("Detected the following data points:")
    all_data_points.forEach(element => {
        console.log(`Timestamp: ${new Date(element.timestamp).toLocaleString()} => expected CPU: ${parseFloat(element.cpuValue).toFixed(2)}%, actual CPU: ${parseFloat(element.expectedValue).toFixed(2)}%`)
    });
    
    console.log("Fetching data for the load analysis...")    
    await Promise.all(all_data_points.map(async (e) => {
         // fetch the list of received requests for each timestamp
         let urlArray = await fetchURLs(e.timestamp);
         // group & count URLs, save result to the ../data/groupedUrls.json
         await groupAndCountUrls(urlArray, e.timestamp);
      
         // generate Statistics (result)
         urlArray = await generateRegex(e.timestamp)
         await fetchResponseTimeData(urlArray, e.timestamp)
         
         // process & save to csv
         await processAndExport(e.timestamp)  
      }));

    await calculateEndpointDistribution()
    console.log("Transferring the data to the dashboard")
    await transferDataToDashboard()
    console.log("Run npm run start in /dashboard")
 
}

main()