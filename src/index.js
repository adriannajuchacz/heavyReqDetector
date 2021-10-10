const { groupAndCountUrls } = require('./urlGrouping.js');
const { generateRegex } = require('./regexGenerating.js');

const main = async () => {

    // STEP 1: fetch data and save to ../data/urls.csv
    // STEP 2: group & count URLs, save result to the ../data/groupedUrls.json
    let urlArray = await groupAndCountUrls();
    // STEP 3: translate URLs to Regex
    urlArray = generateRegex(urlArray)
}

main()