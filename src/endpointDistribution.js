async function calculateEndpointDistribution() {
    // load peaks
    let peaks = readJSONfromFile(`./data/results/peaks_data.json`);
    // let peaksData = []
    //foreach peaks
        // load all peak Endpoint with regex, median & pct99.5=> endpoints 
        /*
            peakData = {
                "timestamp": peak.timestamp,
                "endpointsData": []
            }
        */
        // foreach endpoint
            /*
            endpointData = {
                regex: endpoint.url,
                intervalsData: []
            }
            */
            // calculate intervals - outsource to a function

            // intervals = [median, median*2, ... , pct95]
            // for(let i=0; i<(intervals.length - 1); i++)
                // start_time = peak.timestamp - config.peak_duration_in_min
                // end_time = peak.timestamp
                // minResponseTime = intervals[i]
                // maxResponseTime = intervals[i+1]
                // fetch request count for start_time, end_time, minResponseTime<responseTime<maxResponseTime , endpoint.regex
                /*                
                    endpointData.intervalsData.push({
                        "ratioMedian": i+1,
                        "minValue": intervals[i]
                        "maxValue": intervals[i+1]
                        "requestCount": queryResult
                    })
                */
            
            // peakData.endpointsData.push(endpointData)
        // peaksData.push(peakData)    

    // save peaksData in dashboard
}

module.exports = {
    calculateEndpointDistribution
};