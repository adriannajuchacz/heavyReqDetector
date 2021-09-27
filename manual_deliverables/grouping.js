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
const file = 'urlsTest.json'
// TODO: Add other regex
const regex = /praxis-\d{5}/
const regexReplace = "praxis-XXXXX"

const variableRegexArr = [
    {
        "regex": /praxis-\d{5}/,
        "regexReplace": "praxis-XXXXX"
    }
]

// list of regex values, that will match with potential variables
// A variable is a part of a URL that is not a part of a collection, e.g. subtenant Id

csv()
    .fromFile(csvFilePath)
    .then((jsonObj) => {
    })

/**
 * if the url contains search params, replaces the variables with "XXXXX"
 * @param string url 
 * e.g.
 * "/v/dev-0.0/tenants/10944/smartpatcher/subtenants?phone_number=10944&id=1094400"
 * => "/v/dev-0.0/tenants/10944/smartpatcher/subtenants?phone_number=XXXXX&id=XXXXX"
 * 
 * "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-diltschev/calls"
 * => "/v/dev-0.0/tenants/smartpatcher/subtenants/praxis-diltschev/calls"
 */
// TODO: debug
// you should use node 12+ or add a polyfill for it
// TODO: refactor
function replaceSearchVariables(url) {
    console.log(url)
    if (url.includes("?")) {
        // take the part of url after ?
        // e.g. /v/dev-0.0/tenants/10944/smartpatcher/subtenants?phone_number=10944&id=1094400 => phone_number=10944&id=1094400
        let searchPart = url.split("?")[1]
        //after that:
        // url.split("?")[0] = /v/dev-0.0/tenants/10944/smartpatcher/subtenants
        // url.split("?")[1] = phone_number=10944&id=1094400
        let pArr = Object.fromEntries(new URLSearchParams(searchPart))

        let newSearchPart = searchPart
        Object.entries(pArr).forEach((paramArr) => {
            // paramArr =  ["phone_number", "10944"]
            let paramStr = `${paramArr[0]}=${paramArr[1]}`
            // paramStr = "phone_number=10944"

            // extracting the specific param from the searchPart
            let [prefix, suffix] = newSearchPart.split(paramStr)

            // replacing the variable
            let newParamStr = `${paramArr[0]}=XXXXX`
            // joining the searchPart with the replaced variable
            newSearchPart = newSearchPart.split(paramStr).join(newParamStr)
        })
        return url.split("?")[0].concat("?").concat(newSearchPart);
    }
}

const main = async () => {
    let urlArray = await csv().fromFile(csvFilePath);
    // fix format & replace Variables with "XXXXX"
    urlArray = urlArray.map(x => {
        let url = x.req.url;
        console.log(typeof x.req.url)
        url = replaceSearchVariables(url)
        return { "url": x.req.url, "count": Number(x["count(*)"]) }
    });

    // TODO: separate function
    // group defined variables
    // e.g. replace subtenant ids with praxis-XXXXX
    variableRegexArr.forEach((x) => {
        urlArray.map((s) => {
            s.url = s.url.split(x.regex).join(x.regexReplace)
            return s
        })
    })

    // sum count by url (now with duplicates)
    let counts = {}
    urlArray.forEach(function (x) { counts[x.url] = (counts[x.url] || 0) + x.count; });


    //save to json file
    jsonfile.writeFile("groupedUrls.json", counts, { spaces: 2 }, function (err) {
        if (err) console.error(err)
    })

}

main()
