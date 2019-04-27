// MtDOM.js
// Written by Tobias Merkle in a fit of insanity. He takes no responsibility for what lies beneath.
// April 2019

var resizeTaskId, $svg, stdDev, avg, sigmoidShortPeaks, bucketPeaks = true,
    delay = 100,
    BUCKET_SIZE = 10, 
    MAX_STANDARD_DEVIATIONS = 0;

function makeMountain(el, mtn, baseEl) {
    var children = Array.from(el && el.childNodes || el || '');
    el.base = mtn;
    el.elevation = baseEl;
    if (children.length > 0) 
        return children.map(function (e) { return makeMountain(e, children, baseEl + 1); });
    return el;
}

// function reckonMountainHeight(mtn, addRawLength) {
//     mtn.elevation = (mtn.base ? mtn.base.elevation || 1 : 0) + (mtn.elevation || (addRawLength && mtn.length || 1));
//     if (Array.isArray(mtn)) {
//         var nextPeak = [];
//         nextPeak.base = mtn;
//         nextPeak.elevation = mtn.elevation;
//         mtn.forEach(function (peak) { nextPeak.push(reckonMountainHeight(peak, addRawLength)); });
//         return nextPeak;
//     }
    
//     return mtn;
// }

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
    var numericalHeights = flattenDeep(mtn).map(function(flattenedPeak) { return (flattenedPeak.elevation || (flattenedPeak.base && flattenedPeak.base.elevation) || 0) });

    avg = numericalHeights.reduce(function(a, b) { 
        return a + b; 
    }, 0) / numericalHeights.length;
    stdDev = Math.sqrt(numericalHeights.reduce(function (a, b) { return a + Math.pow(b - avg, 2) }, 0) / numericalHeights.length);
    // var sum = Y;
    // var logSumExp = numericalHeights.map(function (p) { 
    //     sum += Math.pow(Math.E, p - Y); 
    //     return Math.log(sum);
    // });

    function peakToPoint(peak, idx, _, multi, divisor) { // Need to _ Array.prototype.map's param for array
        var elevation = ((peak.elevation + (peak.base && peak.base.elevation || 0)) || 1);
        // Sigmoid! See https://en.wikipedia.org/wiki/Generalised_logistic_function for why we are multiplying by the various values:
        // Use this to "buff up" small values.
        if (sigmoidShortPeaks) 
            elevation /= 1/(1 + Math.pow(Math.E, 0.1 * (-elevation)));
        if (MAX_STANDARD_DEVIATIONS > 0 && elevation > (avg + MAX_STANDARD_DEVIATIONS*stdDev)) // This magic number is arbitrary, for even higher heights increase it.
            elevation = avg + (MAX_STANDARD_DEVIATIONS-1)*stdDev;
        
        Y = Math.max(Y, elevation); // obviously, we want to calculate maximum Y here rather than before all these reduction calculations.
        X += (divisor > 0) ? (idx + 1)/divisor : 1; // For elements in nested arrays, their X hops should be 1/N as wide as elements in the root array.
        multi = multi || 0;

        return Array.isArray(peak) ? 
            peak.map(function (p, i, a) { return peakToPoint(p, i, a, multi + 1, peak.length); }) 
            : { x: +X, y: elevation }; 
    }  

    var pointArray = flattenDeep(mtn.map(peakToPoint)); 
    
    if (bucketPeaks) {
        var bucketMountain = [];
        for (let i = 0; i < pointArray.length; i += BUCKET_SIZE) {
            let bucketMax = pointArray.slice(i, i + BUCKET_SIZE + 1)
                .reduce(function(max, point) { return Math.max(max, point.y); }, 0);
            bucketMountain.push({ x: i, y: bucketMax });
        };
        pointArray = bucketMountain;
    }

    pointArray = [{ x: 0, y: 0 }].concat(pointArray).concat([{ x: X+1, y: 0 }]); 

    var stringifiedXYPoints = pointArray.map(function(point) { 
        return point.x.toFixed(2) + ',-' + point.y.toFixed(2)  // negative Y to draw peaks 'upward'.
    }).join(' ')

    return {
        width: pointArray[pointArray.length - 1].x,
        height: Y, 
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
        // style: 'animation: loom 10000ms infinite ease-in-out;',
        fill: 'url(#grad)',
    })
    // var $styles = document.createElement('style');
    // $styles.textContent = '@keyframes loom { 0%, 100% { fill: #50555a; } 33% { fill: #476c54; } 66%{ fill: #474442; } } } }';
    // document.body.appendChild($styles);
    // var $animation = makeSvgEl('animate', {
    //     attributeType: 'CSS',
    //     attributeName: 'fill',
    //     values: 'linear-gradient(135deg, rgba(255,0,255,.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%);\
    //     linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,0,255,.4) 50%, rgba(255,255,255,0) 100%);\
    //     linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,0,255,.4) 100%);',
    //     dur: '5s',
    //     repeatCount: 'indefinite'
    // }).appendChild
    // $polygon.append($animation);
    
    $svg = makeSvgEl('svg', {
        height: window.innerHeight,
        width: window.innerWidth - 16,
        version: 1.1,
        preserveAspectRatio: 'none',
        style: 'pointer-events: none; position: fixed; bottom: 0; left: 0; z-index: 1337; shape-rendering: optimizeSpeed; opacity: 0.85; ',
        viewBox: '0 -' + topography.height + ' ' + topography.width + ' ' + topography.height
    });

    // build SVG gradients 
    var $defs = makeSvgEl('defs');
    var $grad = makeSvgEl('linearGradient', { id: 'grad' });
    var stops = [
        makeSvgEl('stop', { 'stop-color': '#f1dcc1', offset: '0%' }),
        makeSvgEl('stop', { 'stop-color': '#3e3633', offset: '25%' }),
        makeSvgEl('stop', { 'stop-color': '#66716f', offset: '50%' }),
        makeSvgEl('stop', { 'stop-color': '#466144', offset: '75%' }),
        makeSvgEl('stop', { 'stop-color': '#58b15b', offset: '100%' })
    ];
    stops.forEach(function(stop) { $grad.appendChild(stop); });
    $defs.appendChild($grad);
    $svg.appendChild($defs);

    window.addEventListener('resize', function(e) {
        if (resizeTaskId)  clearTimeout(resizeTaskId);
        resizeTaskId = setTimeout(function() {
            onResize(e);
        }, delay);
    });
    
    return document.body.appendChild($svg)
        .appendChild($polygon);
}

function onResize(e) {
    console.log('onresize');
    if (!$svg) return;
    $svg.setAttribute('height', window.innerHeight);
    $svg.setAttribute('width', window.innerWidth);
}

var mtn = [];
var rawMtn = makeMountain(document.body, mtn, 1);
drawMountain(rawMtn);
