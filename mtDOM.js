// MtDOM.js
// Written by Tobias Merkle 0x70b1a5 in a fit of insanity 2019

function makeMountain(el, mtn) {
    var children = Array.from(el && el.childNodes || el || '');
    el.base = mtn;
    if (children.length > 0) 
        return children.map(function (e) { return makeMountain(e, children); });
    return el;
}

function reckonMountainHeight(mtn) {

    // TODO!!
    // And here we come to the impasse ... You can't set arbitrary properties on Array
    // I think in order for this to work I need to set .base and .elevation on the Array.prototype
    // Currently the two props are vanishing, however, and this makes all the numbers incorrect.

    mtn.elevation = (mtn.base ? mtn.base.elevation || 0 : 0) + (mtn.length || 0);
    return mtn.map ? 
        mtn.map(function (peak) { return reckonMountainHeight(peak); }) 
        : mtn;
}

// Array.flatten - thank you, based MDN. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Alternative
function flattenDeep(arr1) {
    return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
 }

function findRangeWidth(range) { // :: [Int | Array] | Int
    return range.length && !range.every(function(peak) { return peak == +peak }) ? 
        flattenDeep(range.map(function (peak) { return findRangeWidth(peak); })) // [Int | Array]
        : range.length ? 
            range.length // [Int]
            : +range || 0; // Int
};

function findRangeHeight(range) {
    var max = 0;
    if (Array.isArray(range)) {
        range.forEach(function(peak) {
            var nextPeakHeight = 0;

            if (Array.isArray(peak)) nextPeakHeight = findRangeHeight(peak);
            else nextPeakHeight = peak;

            max = Math.max(nextPeakHeight, max);
        });
    } else {
        max = Math.max(range, max);
    }
    return max;
}

function generateTopography(mtn, hSize, vSize) {
    var peaksAsHeights = mtn.map(function getPeakPixelHeight(peak, idx, array, multi) {
        debugger;
        return peak == +peak ? peak
            : peak && peak.elevation > -1 ? 
                peak.elevation*vSize/(multi ? Math.pow(Math.e, multi) : 1) // Peaks get shorter as they rise. 
                : peak.map(function (p) { return getPeakPixelHeight(p, null, null, (multi || 0) + 1); });
    }); 
    debugger;
    var peaksAsHeightWidthPairs = peaksAsHeights.map(function getPeakPixelWidth(heightOrPeak, idx, array, parentElevation, divisor) {
        return heightOrPeak == +heightOrPeak ?
            ((parentElevation || 0) + (hSize/(divisor || 1))).toFixed(2) + "," + heightOrPeak
            : heightOrPeak.map(function (p) { return getPeakPixelWidth(p, null, null, parentElevation || 0, hSize/heightOrPeak.length); })
                .reduce(function(a, b) { return a + b + " "; }, "");
    });
    debugger;
    return peaksAsHeightWidthPairs.join(' ');
}

function drawMountain (mtn) {
    var $svg = document.createElement('svg');
    $svg.setAttribute('style', "height: 100vh; width: 100vw; pointer-events: none;");
    $svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $svg.setAttribute('version', '1.1');
    var $polygon = document.createElement('polygon');
    var mapStyles = "stroke: #168fdc; stroke-width: 5; fill: #95CFF4; opacity: 0.75;";
    $polygon.setAttribute('style', mapStyles);

    var mountainWidth = findRangeWidth(mtn);
    var mountainHeight = findRangeHeight(mtn);
    var horizontalUnit = window.innerWidth/mountainWidth;
    var verticalUnit = window.innerHeight/mountainHeight;

    debugger;
    var points = generateTopography(mtn, horizontalUnit, verticalUnit);
    debugger;
    $polygon.setAttribute('points', points);

    $svg.appendChild(document.createElement('g')).appendChild($polygon);
    
    return document.body.appendChild($svg);
}

var mtn = [];
var rawMtn = makeMountain(document.body, mtn);

debugger;
mtn = reckonMountainHeight(rawMtn);
debugger;
drawMountain(mtn);
