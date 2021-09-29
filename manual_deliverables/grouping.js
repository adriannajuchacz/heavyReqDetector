/**
 * Groups the output for the "Incoming Requests for the time period" from the "Manual detection of heavy requests"
 * 
 *
 * @input  urls.csv with format "/v/dev-0.0/tenants/dashboard/events,2199"
 * @output saves a list of urls groupped by "praxis-XXXXX" into urls.json
 */
const csv = require('csvtojson')
const jsonfile = require('jsonfile')

// requires config
const csvFilePath = 'urls.csv'
const saveToFile = 'groupedUrls.json'
const variableReplacement = "XXXXX"
const collectionNames = ["subtenants", "calls", "callers"]

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

function reduceVariablesInSearch(searchPart) {
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

const main = async () => {
    let urlArray = await csv().fromFile(csvFilePath);
    // fix format & replace Variables with "XXXXX"
    urlArray = urlArray.map(x => {
        let url = x.req.url;
        // reduce Variables separately in the path and search part of the url

        // if url has no params url.split("?")[0] = url
        let pathPart = reduceVariablesInPath(url.split("?")[0])
        // if url has params, replace the variables
        let searchPart = url.includes("?") ? "?".concat(reduceVariablesInSearch(url.split("?")[1])) : ""

        //join back the strings
        url = pathPart.concat(searchPart)

        return { "url": url, "count": Number(x["count(*)"]) }
    });

    // sum count by url (now with duplicates)
    let counts = {}
    urlArray.forEach(function (x) { counts[x.url] = (counts[x.url] || 0) + x.count; });


    //save to json file
    jsonfile.writeFile(saveToFile, counts, { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })

}

main()
