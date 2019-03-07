const Apify = require('apify');
const moment = require('moment');
const { checkObject } = require('./tools');
const { RESTAURANT, HOTEL } = require('./data');

const { utils: { log } } = Apify;
Apify.main(async () => {
    const HOTEL_ID = HOTEL.id;
    const RESTAURANT_ID = '8073863';
    const LAST_REVIEW = moment().subtract(12, 'months')
    const report = {};
    log.info('STARTING TEST');
    // call actor sync for one run to get info about hotel
    try {
        const { body } = await Apify.call(
            'petrpatek/tripadvisor-scraper',
            {
                hotelId: HOTEL_ID,
                lastReviewDate: LAST_REVIEW,
            },
        );
        checkObject(body, HOTEL);
    } catch (e) {
        log.error(`Could not get data from actor for hotel: ${HOTEL_ID}`);
        report.gettingHotel = { error: e };
    }
    const outputRestaurant = await Apify.call(
        'petrpatek/tripadvisor-scraper',
        {
            hotelId: '277678',
            lastReviewDate: LAST_REVIEW,
        },
    );
    console.log(output, 'OUTPUT');
    // call actor async for dataset
    await Apify.call(
        'petrpatek/tripadvisor-scraper',
        {
            locationFullName: 'Hong Kong',
            lastReviewDate: LAST_REVIEW,
            includeRestaurants: true,
            includeHotels: true,
            includeReviews: false,
        },
        { waitSecs: 0 },
    );
    // get latest data
    // get scraped data
    // compare
    // output
    console.log('Done.');
});
