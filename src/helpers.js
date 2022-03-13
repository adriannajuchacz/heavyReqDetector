var fs = require('fs');
const mkdirp = require('mkdirp');
const variableReplacement = "XXXXX"

function stepDone(step) {
   switch (step) {
      case "fetchRequestCount":
         path = `./data/peak_detection/request_count.json`
         break;
      case "fetchCPUValues":
         path = `./data/peak_detection/CPU_values.json`
         break;
      case "fetchResponseTime":
         path = `./data/results/peaks_data.json`
         break;
      case "endpointIntervals":
         path = `./data/results/endpointDistribution_intervals.json`
         break;
      default:
         path = "XXXXXXXXXXXXXXXXXXXXX"
         break;
   }
   return fs.existsSync(path)
}
function readJSONfromFile(path) {
   if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
   }
   return null
}

async function writeJSONToFile(dirPath, filename, obj) {
   await mkdirp(dirPath);
   //save to json file
   let filePath = dirPath + "/" + filename;
   fs.writeFileSync(filePath, JSON.stringify(obj), function (err) {
      if (err) console.error(err)
   })
}

var config = readJSONfromFile('config/config_file.json');
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
   let urlArray = readJSONfromFile(`./data/mid-results/${timestamp}/grouped_urls_with_count.json`);
   let regexArr = readJSONfromFile(`./data/mid-results/regex.json`);
   regexArr = (regexArr === null) ? [] : regexArr;
   let urlArrayWithRegex = urlArray.map((urlObj) => {
      let variableReplacementRegex = new RegExp(variableReplacement, "g")
      let regex = new RegExp(urlObj.url.replace(variableReplacementRegex, "(.*)"))
      regexArr.includes(regex.source) ? null : regexArr.push(regex.source)
      urlObj["regex"] = regex
      return urlObj
   })
   await writeJSONToFile(`./data/mid-results`, `regex.json`, regexArr)
   return urlArrayWithRegex
}

Date.prototype.substractMinutes = function (m) {
   this.setTime(this.getTime() - (m * 60 * 1000));
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
   getPeakUTCs,
   readJSONfromFile,
   writeJSONToFile,
   variableReplacement,
   stepDone
};