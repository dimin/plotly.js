/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var PTS_LINESONLY = require('../scatter/constants').PTS_LINESONLY;
var OPEN_RE = /-open/;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var dimLen = handleDimensionsDefaults(traceIn, traceOut);
    if(!dimLen) {
        traceOut.visible = false;
        return;
    }

    coerce('mode', traceOut._commonLength < PTS_LINESONLY ? 'lines+markers' : 'lines');
    coerce('text');

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);

        var isOpen = OPEN_RE.test(traceOut.marker.symbol);
        var isBubble = subTypes.isBubble(traceOut);
        coerce('marker.line.width', isOpen || isBubble ? 1 : 0);
    }

    coerce('xdirection');
    coerce('ydirection');

    handleAxisDefaults(traceIn, traceOut, layout, coerce);

    coerce('showdiagonal');
    coerce('showupperhalf');
    coerce('showlowerhalf');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};

function handleDimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions;
    if(!Array.isArray(dimensionsIn)) return 0;

    var dimLength = dimensionsIn.length;
    var commonLength = Infinity;
    var dimensionsOut = traceOut.dimensions = new Array(dimLength);
    var dimIn;
    var dimOut;
    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(dimIn, dimOut, attributes.dimensions, attr, dflt);
    }

    for(i = 0; i < dimLength; i++) {
        dimIn = dimensionsIn[i];
        dimOut = dimensionsOut[i] = {};

        var visible = coerce('visible');
        if(!visible) continue;

        var values = coerce('values');
        if(!values.length) {
            dimOut.visible = false;
            continue;
        }

        coerce('label');

        commonLength = Math.min(commonLength, values.length);
        dimOut._index = i;
    }

    for(i = 0; i < dimLength; i++) {
        dimOut = dimensionsOut[i];
        if(dimOut.visible) dimOut._length = commonLength;
    }

    traceOut._commonLength = commonLength;

    return dimensionsOut.length;
}

function handleAxisDefaults(traceIn, traceOut, layout, coerce) {
    var dimLen = traceOut.dimensions.length;
    var xaxesDflt = new Array(dimLen);
    var yaxesDflt = new Array(dimLen);
    var i;

    for(i = 0; i < dimLen; i++) {
        xaxesDflt[i] = 'x' + (i ? i + 1 : '');
        yaxesDflt[i] = 'y' + (i ? i + 1 : '');
    }

    var xaxes = coerce('xaxes', xaxesDflt);
    var yaxes = coerce('yaxes', yaxesDflt);

    // TODO what to do when xaxes.length or yaxes.length !== dimLen ???

    for(i = 0; i < xaxes.length; i++) {
        Lib.pushUnique(layout._splomXaxes, xaxes[i]);
    }
    for(i = 0; i < yaxes.length; i++) {
        Lib.pushUnique(layout._splomYaxes, yaxes[i]);
    }
}
