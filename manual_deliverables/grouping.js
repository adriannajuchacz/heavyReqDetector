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

csv()
    .fromFile(csvFilePath)
    .then((jsonObj) => {
    })

const main = async () => {
    let urlArray = await csv().fromFile(csvFilePath);
    // fix format
    urlArray = urlArray.map(x => {
        return { "url": x.req.url, "count": Number(x["count(*)"]) }
    });

    //TODO: adjust the code, so that it takes a list of regex & replacements not just one
    // replace subtenant ids with praxis-XXXXX
    urlArray.map((s) => {
        s.url = s.url.split(regex).join(regexReplace)
        return s
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
