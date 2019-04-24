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
    var pointArray = mtn.map(function peakToPoint(peak, idx, _, multi, divisor) { // Need to _ Array.prototype.map's param for array
        X += (divisor > 0) ? (idx + 1)/divisor : 1; // For elements in nested arrays, their X hops should be 1/N as wide as elements in the root array
        multi = multi || 0;
        Y = Math.max(Y, (peak && peak.elevation || 0));
        debugger;
        return Array.isArray(peak) ? // peak :: Array
            peak.map(function (p, i, a) { return peakToPoint(p, i, a, multi + 1, peak.length); }) 
            : [Math.round(X * 10), peak.elevation]// /(multi ? Math.pow(Math.E, multi) : 1) // Peaks get shorter as they rise. 
    }); 
    var flatBoi = flattenDeep(pointArray);
    // even-indexed elements are X, odd-indexed elements are Y.
    // Normalize Y heights to produce a palatable visual.
    for (var yi = 1; yi < flatBoi.length; yi += 2) {
        // todo!
    }

    return {
        width: Math.round(X * 10),
        height: Y,
        points: flatBoi.join(' ')
    }
}

function makeSvgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}

function drawMountain (mtn) {
    var topography = generateTopography(mtn);
    
    var $polygon = makeSvgEl('polygon', { points: topography.points, stroke: '#168fdc', 'stroke-width': '2', fill: '#95CFF4' });
    var $svg = makeSvgEl('svg', {
        height: window.innerHeight,
        width: window.innerWidth - 32,
        style: 'pointer-events: none; position: absolute; top: 0; left: 0; z-index: 1337;',
        version: 1.1,
        viewBox: '0 0 ' + topography.width + ' ' + topography.height
    });

    return document.body.appendChild($svg).appendChild($polygon);
}

var mtn = [];
var rawMtn = makeMountain(document.body, mtn);

mtn = reckonMountainHeight(rawMtn);
drawMountain(mtn);
