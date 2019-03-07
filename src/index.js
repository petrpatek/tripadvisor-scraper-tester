const Apify = require('apify');
const ApifyClient = require('apify-client');
const moment = require('moment');
const { checkObject, isFinished } = require('./tools');
const { RESTAURANT, HOTEL } = require('./data');

const { utils: { log } } = Apify;
Apify.main(async () => {
    const HOTEL_ID = HOTEL.id;
    const RESTAURANT_ID = RESTAURANT.id;
    const LAST_REVIEW = moment().subtract(12, 'months').format('YYYY-MM-DD');
    const { userId, token } = Apify.getEnv();
    const apifyClient = new ApifyClient({
        userId,
        token,
    });
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
            },
        );
        console.log(output.body.reviews);
        checkObject(output.body, HOTEL);
    } catch (e) {
        log.error(`Could not get data from actor for single hotel: ${HOTEL_ID}`, e);
        report.gettingHotel = { error: e };
    }

    try {
        log.info('Testing single restaurant');
        const { output } = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                restaurantId: RESTAURANT_ID,
                lastReviewDate: LAST_REVIEW,
                includeReviews: true,
            },
        );
        checkObject(output.body, RESTAURANT);
    } catch (e) {
        log.error(`Could not get data from actor for single restaurant: ${RESTAURANT_ID}`, e);
        report.gettingRestaurant = { error: e };
    }

    // call actor async for dataset
    let output;
    try {
        log.info('Running full scrape of one location');
        output = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                locationFullName: 'Prague',
                lastReviewDate: moment().subtract(5, 'months').format('YYYY-MM-DD'),
                includeRestaurants: true,
                includeHotels: true,
                includeReviews: false,
            },
            { waitSecs: 0 },
        );
    } catch (e) {
        log.error('Could not call for actor async start', e);
    }
   await isFinished(apifyClient, output.id, output.actId);
    //const run = await apifyClient.acts.getRun({ runId: output.id, actId: output.actId });

    console.log(output, 'OUTPUT');
    // get latest data

    // get scraped data
    // compare
    // output
    await Apify.setValue('REPORT', JSON.stringify(report), { contentType: 'application/json' });
    console.log('Done.');
});
