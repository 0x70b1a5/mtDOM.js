// MtDOM.js
// Written by Tobias Merkle in a fit of insanity. He takes no responsibility for what lies beneath.
// April 2019

function makeMountain(el, mtn) {
    var children = Array.from(el && el.childNodes || el || '');
    el.base = mtn;
    if (children.length > 0) 
        return children.map(function (e) { return makeMountain(e, children); });
    return el;
}

function reckonMountainHeight(mtn, addRawLength) {
    mtn.elevation = (mtn.base ? mtn.base.elevation || 0 : 0) + (mtn.elevation || mtn.length || 0);
    if (Array.isArray(mtn)) {
        var nextPeak = [];
        nextPeak.base = mtn;
        nextPeak.elevation = mtn.elevation;
        mtn.forEach(function (peak) { nextPeak.push(reckonMountainHeight(peak)); });
        return nextPeak;
    }
    
    return mtn;
}

// Array.flatten - thank you, based MDN. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Alternative
function flattenDeep(arr1) {
    return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
 }

function generateTopography(mtn) {
    var X = 0, Y = 0; // absolute X should increment with every new element.
    var pointArray = mtn.map(function peakToPoint(peak, idx, _, multi, divisor) { // Need to _ the map function's default params for array
        X += (divisor > 0) ? (idx + 1)/divisor : 1; // For elements in nested arrays, their X hops should be 1/N as wide as elements in the root array
        multi = multi || 0;
        Y = Math.max(Y, (peak && peak.elevation || 0));
        return Array.isArray(peak) ? // peak :: Array
            peak.map(function (p, i, a) { return peakToPoint(p, i, a, multi + 1, peak.length); }) 
            : Math.round(X * 10) + "," + peak.elevation; // /(multi ? Math.pow(Math.e, multi) : 1) Peaks get shorter as they rise. 
    }); 
    var flatBoi = flattenDeep(pointArray);
    return {
        width: Math.round(X * 10),
        height: Y,
        points: flatBoi.join(' ')
    }
}

function drawMountain (mtn) {
    var $svg = document.createElement('svg');
    $svg.setAttribute('style', "height: 100vh; width: 100vw; pointer-events: none; position: absolute; top: 0; left: 0; z-index: 1337;");
    $svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $svg.setAttribute('version', '1.1');
    var $polygon = document.createElement('polygon');
    var mapStyles = "stroke: #168fdc; stroke-width: 5; fill: #95CFF4; opacity: 0.75;";
    $polygon.setAttribute('style', mapStyles);
    
    var topography = generateTopography(mtn);

    $svg.setAttribute('viewBox', '0 0 ' + topography.width + ' ' + topography.height);
    $polygon.setAttribute('points', topography.points);

    $svg.appendChild($polygon);
    
    return setTimeout(function() { document.body.appendChild($svg); }, 0);
}

var mtn = [];
var rawMtn = makeMountain(document.body, mtn);

mtn = reckonMountainHeight(rawMtn);
drawMountain(mtn);
