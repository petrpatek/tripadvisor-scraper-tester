function checkParams(referenceAttr, oldAttr) {
    if (referenceAttr !== oldAttr) {
        throw new Error(`Param ${referenceAttr} is not equal to ${oldAttr}`);
    }
}
function checkObject(newObject, referential) {
    Object.entries(referential).forEach(([key, value]) => {
        checkParams(newObject[key], value);
        if (newObject.reviews.length <= 0) {
            throw new Error('Object should contain at least some reviews');
        }
    });
}

function isFinished(client, id, actId) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            const run = await client.acts.getRun({ runId: id, actId });
            console.log(run);
            if (run.finishedAt) {
                clearInterval(interval);
                resolve(run);
            }
            attempts += 1;
            if (attempts > 60) {
                clearInterval(interval);
                reject();
            }
        }, 60 * 1000);
    });
}
function checkProperty(property, item) {
    return item.hasOwnProperty(property);
}

function validateItem(item) {
    const isItemCorrect = checkProperty('name', item)
            && checkProperty('address', item)
            && checkProperty('reviews', item)
            && checkProperty('type', item)
            && checkProperty('id', item);
    return {
        ...item,
        isItemCorrect,
    };
}
module.exports = {
    checkObject,
    isFinished,
    validateItem,
};
