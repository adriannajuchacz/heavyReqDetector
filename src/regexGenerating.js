//import { variableReplacement } from './urlGrouping.js' 

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
        "regex": ""
    }
 * 
 * @param {array} startCollectionLevel 
 * @param {string} variableReplacement 
 * @param {string} saveToFile 
 * @param {string} variableReplacement 
 */
 async function generateRegex(urlArray) {
    console.log(urlArray)
 }

 module.exports = {
    generateRegex
};