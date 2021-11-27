var fs = require('fs');
const mkdirp = require('mkdirp');
const variableReplacement = "XXXXX"

function readJSONfromFile(path) {
   return JSON.parse(fs.readFileSync(path, 'utf8'));
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
    getPeakUTCs,
    readJSONfromFile,
    writeJSONToFile,
    variableReplacement
};