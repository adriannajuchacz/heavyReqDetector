import * as urlGrouping from './urlGrouping'

const main = async () => {

    // STEP 1: fetch data and save to ../data/urls.csv
    // STEP 2: group & count URLs, save result to the ../data/groupedUrls.json
    urlGrouping.groupAndCountUrls();
    // STEP 3: translate URLs to Regex
}

main()