function checkParams(referenceAttr, oldAttr) {
    if (a !== b) {
        throw new Error(`Param ${referenceAttr} is not equal to ${oldAttr}`);
    }
}
function checkObject(newObject, referential) {
    referential.entries(([key, value]) => {
        checkParams(newObject[key], value);
    });
}
module.exports = {
    checkObject,
};
