/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// TODO splom 'needs' the grid component, register it here?

function calc(gd, trace) {
    return [{x: false, y: false, t: {}, trace: trace}];
}

function plot(gd, _, cdata) {
    console.log('splom plot', cdata)
}

module.exports = {
    moduleType: 'trace',
    name: 'splom',

    basePlotModule: require('./base_plot'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),

    calc: calc,
    plot: plot,
    hoverPoints: function() {},
    selectPoints: function() {},
    style: function() {},

    meta: {
        description: [
            'SPLOM !!!'
        ].join(' ')
    }
};
