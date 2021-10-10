/**
 * Groups the output for the "Incoming Requests for the time period" from the "Manual detection of heavy requests"
 * 
 *
 * @input  urls.csv with format "/v/dev-0.0/tenants/dashboard/events,2199"
 * @output saves a list of urls groupped by "praxis-XXXXX" into {saveToFile}
 */
const csv = require('csvtojson')
const jsonfile = require('jsonfile')

// CONFIG
/**
 * csvFilePath must be CSV File with the following format "/v/dev-0.0/tenants/dashboard/events,2199"
 */
const csvFilePath = './data/urls.csv'
/**
 * saveToFile is the name of a JSON file to which the grouped URLs should be saved.
 */
const saveToFile = './data/groupedUrls.json'
/**
 * variableReplacement is a string that all variables in the URLs will be replaced with
 * * e.g. "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-10909/calls/614c1ea7ed7cb50019dfb8b0"
 * variableReplacement = "XXXXX"
 * =>  "/v/dev-0.0/tenants/XXXXX/subtenants/XXXXX/calls/XXXXX"
 */
const variableReplacement = "XXXXX"

/**
 * Defines granularity of the replacement of variables from the url's path.
 * startCollectionLevel = 1 means that, the ID of the first "{collection_Name}/{ID}" will not be replaced with the variableReplacement
 * e.g. "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-10909/calls/614c1ea7ed7cb50019dfb8b0"
 * startCollectionLevel = 0
 * =>  "/v/dev-0.0/tenants/XXXXX/subtenants/XXXXX/calls/XXXXX"
 * e.g. startCollectionLevel = 1
 * =>  "/v/dev-0.0/tenants/smartpatcher/subtenants/XXXXX/calls/XXXXX"
 */
const startCollectionLevel = 1
const urlsToIgnore = ["/", ""]

function longestCommonPrefix(words){
    // check border cases size 1 array and empty first word)
    if (!words[0] || words.length ==  1) return words[0] || "";
    let i = 0;
    // while all words have the same character at position i, increment i
    while(words[0][i] && words.every(w => w[i] === words[0][i]))
      i++;
    
    // prefix is the substring from the beginning to the last successfully checked i
    return words[0].substr(0, i);
  }

function splitArrIntoPairs(initialArray) {
    return initialArray.reduce(function(result, value, index, array) {
        if (index % 2 === 0)
          result.push(array.slice(index, index + 2));
        return result;
      }, []);
}

/**
 * Function takes csv file with urls & counts and returns an array with a summed up count for each URL group.
 * The URL grouping involves replacing variables such as IDs from the url's path, considering the specified startCollectionLevel option.
 * The search part are removed and not included in the grouping process.
 * 
 * @param {number} startCollectionLevel 
 * @param {File} csvFilePath 
 * @param {string} saveToFile 
 * @param {string} variableReplacement 
 */
async function groupAndCountUrls() {
    let urlArray = await csv().fromFile(csvFilePath);

    // STEP 1: Remove search part
    urlArray = urlArray.map(x => { return { "url": x.req.url.split("?")[0], "count": Number(x["count(*)"]) } })

    // STEP 2: find the longest common prefix of the URLs
    // this preix contains also the first collection in the path
    let urlsToConsider = urlArray.map(x => { return x.url }).filter(x => !urlsToIgnore.includes(x))
    let prefix = longestCommonPrefix(urlsToConsider)

    // STEP 3: replace IDs considering the startCollectionLevel
    urlArray.map(obj => {
        let url = obj.url;

        let prefixRegex = new RegExp(prefix, "i")

        // url: "/v/dev-0.0/tenants/smartpatcher/subtenants/cmc-orthopaedie/calls/614c1e8ced7cb50019dfb88a"
        // => url: ["/v/dev-0.0/tenants/", "smartpatcher", "subtenants", "cmc-orthopaedie", "calls", "614c1e8ced7cb50019dfb88a"]
        urlArr = url.replace(prefixRegex,"").split("/")
        // remove last "/" from prefix
        urlArr.unshift(prefix.slice(0,-1))

        let collectionLevels = splitArrIntoPairs(urlArr)
        
        // collectionLevels:
        // 0:  ["/v/dev-0.0/tenants/", "smartpatcher"]
        // 1: ["subtenants", "cmc-orthopaedie"]
        // 2: ["calls", "614c1e8ced7cb50019dfb88a"]

        for (let i = startCollectionLevel; i < collectionLevels.length; i++) {
            if (collectionLevels[i].length ===1 ) {
            }
            if (collectionLevels[i].length > 1 && collectionLevels[i][0] !== "" && collectionLevels[i][1] !== "") {
                collectionLevels[i][1] = variableReplacement
            }
        }

        // => pathPartArrReplacedVars: ["/v/dev-0.0/tenants/", "smartpatcher", "subtenants", "XXXXX", "calls", "XXXXX"]
        let urlArrReplacedVars = collectionLevels.flat().filter((x) => { return x !== "" })

        //join back the strings
        url = urlArrReplacedVars.join("/")

        obj.url = url
        return obj;
    })

    // sum count by url (now with duplicates)
    let counts = {}
    urlArray.forEach(function (x) { counts[x.url] = (counts[x.url] || 0) + x.count; });

    // TODO: just for testing, remove
    //urlArray = Object.keys(counts).sort();
    
    // convert back to an array
    urlArray = Object.keys(counts).map((x) => {
        return { "url": x, "count": counts[x] }
    }).sort((a,b) => (a.url > b.url) ? 1 : ((b.url > a.url) ? -1 : 0))
    

    //save to json file
    jsonfile.writeFile(saveToFile, urlArray, { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })
    
    return urlArray;
}

module.exports = {
    groupAndCountUrls,
    variableReplacement
};