/**
 * Groups the output for the "Incoming Requests for the time period" from the "Manual detection of heavy requests"
 * 
 *
 * @input  urls.csv with format "/v/dev-0.0/tenants/dashboard/events,2199"
 * @output saves a list of urls groupped by "praxis-XXXXX" into urls.json
 */
const csv = require('csvtojson');
var fs = require('fs');

// requires config
const csvFilePath = 'urls.csv'
const saveToFile = 'groupedUrls.json'
const variableReplacement = "XXXXX"
const collectionNames = ["subtenants", "calls", "callers"]
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

csv()
    .fromFile(csvFilePath)
    .then((jsonObj) => {
    })

/**
 * if the url contains collection (defined in the array collectionNames) 
 * IDs (which we define as variables), replaces them with the variableReplacement
 * @param string path 
 * e.g.
 * "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-10909/calls/614c1ea7ed7cb50019dfb8b0"
 * =>  "/v/dev-0.0/tenants/smartpatcher/subtenants/XXXXX/calls/XXXXX"
 */

function reduceVariablesInPath(path) {
    let pathArr = path.split("/")
    for (let i = 0; i < pathArr.length; i++) {
        // in a sequence ".../${collectionName}/<STRING>" will always be a variable <STRING>
        // e.g. callers/+491727528252
        if (collectionNames.includes(pathArr[i]) && pathArr[i + 1]) {
            pathArr[i + 1] = variableReplacement
        }
    }
    return pathArr.join("/")
}

/**
 * if the url contains search params (which we define as variables), replaces it replaces them with the variableReplacement
 * @param string searchPart 
 * e.g.
 * "/v/dev-0.0/tenants/10944/smartpatcher/subtenants?phone_number=10944&id=1094400"
 * => "/v/dev-0.0/tenants/10944/smartpatcher/subtenants?phone_number=XXXXX&id=XXXXX"
 * 
 * "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-diltschev/calls"
 * => "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-diltschev/calls"
 */

function replaceSearchVariablesInAString(searchPart) {
    let pArr = Object.fromEntries(new URLSearchParams(searchPart))

    let newSearchPart = searchPart

    Object.entries(pArr).forEach((paramArr) => {
        // paramArr =  ["phone_number", "10944"]
        let paramStr = `${paramArr[0]}=${paramArr[1]}`
        // paramStr = "phone_number=10944"

        // replacing the variable
        let newParamStr = `${paramArr[0]}=${variableReplacement}`

        // in case + got converted to %2B, change it back, so that the split() works
        newSearchPart = newSearchPart.replace("%2B", "+")
        // joining the searchPart with the replaced variable
        newSearchPart = newSearchPart.split(paramStr).join(newParamStr)
    })

    return newSearchPart;
}

// TODO: remove
function replaceSearchVariablesInAnArray(urlArray) {
    return urlArray.map(x => {
        let url = x.req.url;
        
        // split the search part from the path part
        // if url has params, replace the variables
        let searchPart = url.includes("?") ? "?".concat(replaceSearchVariablesInAString(url.split("?")[1])) : ""

        //join back the strings
        url = url.split("?")[0].concat(searchPart)

        return { "url": url, "count": Number(x["count(*)"]) }
    });
}

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

const main = async () => {
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

    // TODO: just for testing, remove
    //console.log(urlArray.slice(0,9))

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
    fs.writeFile(saveToFile, JSON.stringify(urlArray), { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })

}

main()
