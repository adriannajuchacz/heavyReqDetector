const { variableReplacement } = require('./urlGrouping.js');

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
 async function generateRegex(urlArray) {
    return urlArray.map((urlObj) => {
       let variableReplacementRegex = new RegExp(variableReplacement, "g")
       let regex = new RegExp(urlObj.url.replace(variableReplacementRegex, "(.*)"))
       urlObj["regex"] = regex
       return urlObj
    })
 }

 module.exports = {
    generateRegex
};