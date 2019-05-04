const Apify = require('apify');
const ApifyClient = require('apify-client');
const moment = require('moment');
const { checkObject, isFinished, validateItem } = require('./tools');
const { RESTAURANT, HOTEL } = require('./data');

const PROXY_SETTINGS = {
    useApifyProxy: true,
    apifyProxyGroups: [
        'SHADER',
        'BUYPROXIES94952',
    ],
};
const { utils: { log } } = Apify;
Apify.main(async () => {
    const HOTEL_ID = HOTEL.id;
    const RESTAURANT_ID = RESTAURANT.id;
    const LAST_REVIEW = moment().subtract(12, 'months').format('YYYY-MM-DD');
    const { userId, token, defaultKeyValueStoreId } = Apify.getEnv();
    const apifyClient = new ApifyClient({
        userId,
        token,
    });
    const store = await Apify.openKeyValueStore('TRIP-ADVISOR-CHECKER');
    const input = await Apify.getValue('INPUT');
    const report = {};
    log.info('STARTING TEST');
    // call actor sync for one run to get info about hotel
    try {
        log.info('Testing single hotel');
        const { output } = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                hotelId: HOTEL_ID,
                lastReviewDate: LAST_REVIEW,
                includeReviews: true,
                proxyConfiguration: PROXY_SETTINGS,
            },
        );
        console.log(output.body.reviews);
        checkObject(output.body, HOTEL);
    } catch (e) {
        log.error(`Could not get data from actor for single hotel: ${HOTEL_ID}`, e);
        report.gettingHotel = { error: e };
        report.hasError = true;
    }

    try {
        log.info('Testing single restaurant');
        const { output } = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                restaurantId: RESTAURANT_ID,
                lastReviewDate: LAST_REVIEW,
                includeReviews: true,
                proxyConfiguration: PROXY_SETTINGS,
            },
        );
        checkObject(output.body, RESTAURANT);
    } catch (e) {
        log.error(`Could not get data from actor for single restaurant: ${RESTAURANT_ID}`, e);
        report.gettingRestaurant = { error: e };
        report.hasError = true;
    }

    // call actor async for dataset
    let output;
    try {
        log.info('Running full scrape of one location');
        output = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                locationFullName: 'Liberec',
                lastReviewDate: moment().subtract(5, 'months').format('YYYY-MM-DD'),
                includeRestaurants: true,
                includeHotels: true,
                includeReviews: false,
                proxyConfiguration: PROXY_SETTINGS,
            },
            { waitSecs: 0 },
        );
    } catch (e) {
        log.error('Could not call for actor async start', e);
        report.hasError = true;
    }
    const { defaultDatasetId } = await isFinished(apifyClient, output.id, output.actId);
    // const run = await apifyClient.acts.getRun({ runId: output.id, actId: output.actId });

    console.log(output, 'OUTPUT');
    // get latest data

    // get scraped data
    // compare
    apifyClient.setOptions({ datasetId: defaultDatasetId });
    const { items } = await apifyClient.datasets.getItems();
    const lastDataSetId = await store.getValue('LAST-DATASETID');
    if (lastDataSetId) {
        apifyClient.setOptions({ datasetId: lastDataSetId });
        const { items: refItems } = await apifyClient.datasets.getItems();
        const evaluated = refItems.map(validateItem);
        const wrongItems = evaluated.filter(item => !item.isItemCorrect);
        const stdDeviation = items.length / 10;
        report.hasError = wrongItems > stdDeviation || Math.abs(items.length - refItems.length) > stdDeviation;
        report.batch = {
            evaluated,
            wrongItems,
            wrongItemsCount: wrongItems.length,
        };
    }
    await store.setValue('LAST-DATASETID', defaultDatasetId);
    // output
    await Apify.setValue('REPORT', JSON.stringify(report), { contentType: 'application/json' });
    const mailObj = report.hasError ? { ...input.emailError } : { ...input.emailStandard };
    await Apify.call(
        'apify/send-mail',
        {
            ...mailObj,
            subject: `TripAdvisor scraper ${report.hasError ? 'Error' : 'Report'} `,
            html: `Hello,
                       <br/>
                               Test actor ${report.hasError ? '' : 'does not'} discovered that the TripAdvisor
                               <a href="https://my.apify.com/actors/C3EHyBNnFuHsT2Yn5#/runs/${output.id}">Scraper</a> has some error.
                              <br/>
                               You can check the report
                               <a href="https://api.apify.com/v2/key-value-stores/${defaultKeyValueStoreId}/records/REPORT?disableRedirect=true">
                              here.
                               </a>
                                Thanks! 
                               <br/>`,
        },
        { waitSecs: 0 },
    );
    if (report.hasError) {
        throw new Error('Ups Something went wrong check the report');
    }
    console.log('Done.');
});
