var fs = require('fs');
const { variableReplacement } = require('./urlGrouping.js');
var config = JSON.parse(fs.readFileSync('config/config_file.json', 'utf8'));
/**
 * Function takes an array of the following format:
 * { "url": "/v/dev-0.0/tenants", "count": 330 }
 * for each element it adds a regex for the url.
 * 
 * e.g.
 *   {
        "url": "/v/dev-0.0/tenants/bmg/subtenants/XXXXX/calls",
        "count": 213
    }
 * =>
    {
        "url": "/v/dev-0.0/tenants/bmg/subtenants/XXXXX/calls",
        "count": 213,
        "regex": /\/v\/dev-0.0\/tenants\/bmg\/subtenants\/(.*)\/calls/
    }
 * 
 * @param {array} urlArray 
 */
 async function generateRegex(timestamp) {
   let urlArray = JSON.parse(fs.readFileSync(`./data/mid-results/${timestamp}/groupedUrls.json`, 'utf8'));
    return urlArray.map((urlObj) => {
       let variableReplacementRegex = new RegExp(variableReplacement, "g")
       let regex = new RegExp(urlObj.url.replace(variableReplacementRegex, "(.*)"))
       urlObj["regex"] = regex
       return urlObj
    })
 }

 Date.prototype.substractMinutes = function(m) {
   this.setTime(this.getTime() - (m*60*1000));
   return this;
}

function getPeakUTCs(timestamp) {
   const peak_start_time_UTC = new Date(timestamp).substractMinutes(config.peak_duration_in_min).getTime()
   const peak_end_time_UTC = new Date(timestamp).getTime()
   return {
      peak_start_time_UTC,
      peak_end_time_UTC
   }
}

module.exports = {
    generateRegex,
    getPeakUTCs
};