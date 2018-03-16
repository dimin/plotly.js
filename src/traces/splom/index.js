/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createRegl = require('regl');
var createMatrix = require('regl-scattermatrix');

var ScatterGl = require('../scattergl');
var AxisIDs = require('../../plots/cartesian/axis_ids');

function calc(gd, trace) {
    var stash = {};
    var opts = {};
    var i;

    var dimLength = trace.dimensions.length;
    opts.data = new Array(dimLength);
    opts.ranges = new Array(dimLength);
    opts.domains = new Array(dimLength);

    for(i = 0; i < dimLength; i++) {
        opts.data[i] = trace.dimensions[i].values;

        var xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
        var ya = AxisIDs.getFromId(gd, trace.yaxes[i]);
        opts.ranges[i] = [xa.range[0], ya.range[0], xa.range[1], ya.range[1]];
        opts.domains[i] = [xa.domain[0], ya.domain[0], xa.domain[1], ya.domain[1]];
    }

    var scene = stash.scene = {};
    scene.scatterOpts = opts;

    return [{x: false, y: false, t: stash, trace: trace}];
}

function plot(gd, _, cdata) {
    if(!cdata.length) return;

    var fullLayout = gd._fullLayout;
    var scene = cdata[0][0].t.scene;

    // make sure proper regl instances are created
    fullLayout._glcanvas.each(function(d) {
        if(d.regl || d.pick) return;
        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
            pixelRatio: gd._context.plotGlPixelRatio || global.devicePixelRatio
        });
    });

    var regl = fullLayout._glcanvas.data()[0].regl;

    scene.matrix = createMatrix(regl);
    scene.matrix.update(scene.scatterOpts);
    scene.matrix.draw();
}

// TODO splom 'needs' the grid component, register it here?

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
