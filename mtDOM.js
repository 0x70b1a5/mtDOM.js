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
    var X = 0, // absolute X should increment with every new element.
        Y = 0; // we only need this to find mtn's highest peak.
    
    // Normalize heights to produce a palatable visual for graphs with extreme spikes.
    // Assuming the current point graph has a large number of remote outliers,
    // the goal of this block should be to proportionally reduce the most freakishly tall peaks
    // such that they are a maximum of around 3-4 standard deviations higher than the rest.
    var numericalHeights = flattenDeep(mtn).map(function(flattenedPeak) { return flattenedPeak.elevation || (flattenedPeak.base && flattenedPeak.base.elevation) || 0 });

    var avg = numericalHeights.reduce(function(a, b) { 
        Y = Math.max(Y, b); 
        return a + b; 
    }, 0) / numericalHeights.length;
    var stdDev = Math.sqrt(numericalHeights.reduce(function (a, b) { return a + Math.pow(b - avg, 2) }, 0) / numericalHeights.length);

    var pointArray = mtn.map(function peakToPoint(peak, idx, _, multi, divisor) { // Need to _ Array.prototype.map's param for array
        var elevation = (peak.elevation || (peak.base && peak.base.elevation) || 0) + mtn.length;
        // if (elevation > 0) elevation /= 1/(Math.pow(Math.E, 1/elevation)); 
        // if (elevation > (avg + 6*stdDev)) // This magic number is arbitrary, for higher heights increase it.
        //     elevation /= Math.pow(Math.E, elevation/stdDev);

        X += (divisor > 0) ? (idx + 1)/divisor : 1; // For elements in nested arrays, their X hops should be 1/N as wide as elements in the root array.
        multi = multi || 0;

        return Array.isArray(peak) ? // peak :: Array
            peak.map(function (p, i, a) { return peakToPoint(p, i, a, multi + 1, peak.length); }) 
            : Math.round(X * 10) + ',-' + elevation // negative Y to draw peaks 'northward'.
    }); 

    var finalX = Math.round(X * 10) + 10;
    var stringifiedXYPoints = '0,0 ' + flattenDeep(pointArray).join(' ') + ' ' + finalX + ',0';

    return {
        width: finalX,
        height: Y, // not Y, because we normalized.
        points: stringifiedXYPoints
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
    
    var $polygon = makeSvgEl('polygon', { 
        points: topography.points, 
        stroke: '#168fdc', 
        'stroke-width': '2', 
        fill: '#95CFF4',
    });
    var $svg = makeSvgEl('svg', {
        height: window.innerHeight,
        width: window.innerWidth,
        version: 1.1,
        style: 'pointer-events: none; position: fixed; bottom: 0; left: 0; z-index: 1337;',
        viewBox: '0 ' + (-topography.height) + ' ' + window.innerWidth + ' ' + window.innerHeight
    });

    // todo ... SVG viewbox should adjust downward instead of scaling polygon upwards
    return document.body.appendChild($svg).appendChild($polygon);
}

var mtn = [];
var rawMtn = makeMountain(document.body, mtn);

mtn = reckonMountainHeight(rawMtn);
drawMountain(mtn);
