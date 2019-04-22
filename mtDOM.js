// MtDOM.js

function makeMountain(el, mtn) {
    var children = Array.from(el && el.childNodes || el || '');
    el.base = mtn;
    if (children.length > 0) 
        return children.map(function (e) { return makeMountain(e, children); });
    return el;
}

function reckonMountainHeight(mtn) {
    mtn.elevation = (mtn.base ? mtn.base.elevation || 0 : 0) + (mtn.length || 0);
    return mtn.map ? 
        mtn.map(function (peak) { return reckonMountainHeight(peak); }) 
        : mtn.elevation;
}

function findRangeWidth(range) { // :: [Int | Array] | Int
    return range.length && !range.every(function(peak) { return peak == +peak }) ? // [Int | Array]
        range.map(function (peak) { return findRangeWidth(peak); }).length 
        : range.length ? // [Int]
            range.length
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
    var peaksAsHeights = mtn.map(function getPeakPixelHeight(peak, multi) {
        return peak == +peak ? 
            peak*vSize/(multi ? Math.log(multi) : 1) // Peaks get shorter as they rise. TODO: Infinity
            : peak.map(function (p) { return getPeakPixelHeight(p, (multi || 1) + 1); });
    }); 
    debugger;
    var peaksAsHeightWidthPairs = peaksAsHeights.map(function getPeakPixelWidth(heightOrPeak, divisor) {
        return heightOrPeak == +heightOrPeak ?
            (hSize/(divisor || 1)).toFixed(2) + "," + heightOrPeak
            : heightOrPeak.map(function (p) { return getPeakPixelWidth(p, hSize/heightOrPeak.length) })
                .reduce(function(a, b) { return a + b + " " }, "");
    });
    debugger;
    return peaksAsHeightWidthPairs;
}

function drawMountain (mtn) {
    var $svg = $('<svg style="height: 100vh; width: 100vw; pointer-events: none;" xmlns="http://www.w3.org/2000/svg" version="1.1">');
    var $polygon = $('<polygon></polygon>');
    var mapStyles = "stroke: #168fdc; stroke-width: 5; fill: #95CFF4; opacity: 0.75;";
    $polygon.attr('style', mapStyles);

    var mountainWidth = findRangeWidth(mtn);
    var mountainHeight = findRangeHeight(mtn);
    var horizontalUnit = mountainWidth/window.innerWidth;
    var verticalUnit = mountainHeight/window.innerHeight;
    
    debugger; 

    var points = generateTopography(mtn, horizontalUnit, verticalUnit);
    $polygon.attr('points', points);

    $svg.append($('<g></g>').append($polygon));
    
    return $(document.body).append($svg);
}

var mtn = [];
mtn = reckonMountainHeight(makeMountain(document.body, mtn));
drawMountain(mtn);
