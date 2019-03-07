function checkParams(referenceAttr, oldAttr) {
    if (referenceAttr !== oldAttr) {
        throw new Error(`Param ${referenceAttr} is not equal to ${oldAttr}`);
    }
}
function checkObject(newObject, referential) {
    Object.entries(referential).forEach(([key, value]) => {
        checkParams(newObject[key], value);
        if (newObject.reviews.length <= 0) {
            throw new Error('Object should contain atleast some reviews');
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
module.exports = {
    checkObject,
    isFinished,
};
