/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createRegl = require('regl');
var createLine = require('regl-line2d');

var Registry = require('../../registry');
var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var Cartesian = require('../../plots/cartesian');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var SPLOM = 'splom';

function plot(gd) {
    var fullLayout = gd._fullLayout;
    var _module = Registry.getModule(SPLOM);
    var splomCalcData = getModuleCalcData(gd.calcdata, _module);

    // clear gl frame, if any, since we preserve drawing buffer
    if(fullLayout._glcanvas && fullLayout._glcanvas.size()) {
        fullLayout._glcanvas.each(function(d) {
            if(d.regl) d.regl.clear({color: true});
        });
    }

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

    if(fullLayout._hasOnlyLargeSploms) {
        drawGrid(gd);
    }

    for(var i = 0; i < splomCalcData.length; i++) {
        _module.plot(gd, {}, splomCalcData);
    }
}

function drawGrid(gd) {
    var fullLayout = gd._fullLayout;
    var regl = fullLayout._glcanvas.data()[0].regl;
    var splomGrid = fullLayout._splomGrid;

    if(!splomGrid) {
        splomGrid = fullLayout._splomGrid = createLine(regl);
    }
    splomGrid.update(makeGridData(gd));
    splomGrid.draw();
}

function makeGridData(gd) {
    console.time('makeGridData')

    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var fullView = [0, 0, fullLayout.width, fullLayout.height];
    var splomXa = Object.keys(fullLayout._splomAxes.x);
    var splomYa = Object.keys(fullLayout._splomAxes.y);
    var lookup = {};
    var k;

    function push(ax, x0, x1, y0, y1) {
        var key = String(ax.gridcolor + ax.gridwidth);

        if(key in lookup) {
            lookup[key].data.push(NaN, NaN, x0, x1, y0, y1);
        } else {
            lookup[key] = {
                data: [x0, x1, y0, y1],
                join: 'rect',
                thickness: ax.gridwidth,
                color: ax.gridcolor,
                viewport: fullView,
                range: fullView
            };
        }
    }

    for(var i = 0; i < splomXa.length; i++) {
        var xa = AxisIDs.getFromId(gd, splomXa[i]);
        var xVals = xa._vals;

        for(var j = 0; j < splomYa.length; j++) {
            var ya = AxisIDs.getFromId(gd, splomYa[j]);
            var yVals = ya._vals;

            // ya.l2p assumes top-to-bottom coordinate system (a la SVG),
            // we need to compute bottom-to-top offsets and slopes:
            var yOffset = gs.b + ya.domain[0] * gs.h;
            var ym = -ya._m;
            // TODO !!
//             var yb = -ym * ya.r2l(ya.range[0], trace.calendar);
            var yb = -ym * ya.r2l(ya.range[0]);

            if(xa.showgrid) {
                for(k = 0; k < xVals.length; k++) {
                    var x = xa._offset + xa.l2p(xVals[k].x);
                    push(xa, x, yOffset, x, yOffset + ya._length);
                }
            }

            if(ya.showgrid) {
                for(k = 0; k < yVals.length; k++) {
                    var y = yOffset + yb + ym * yVals[k].x;
                    push(ya, xa._offset, y, xa._offset + xa._length, y);
                }
            }
        }
    }

    // TODO make batches for zeroline (w/ zerolinecolor and zerolinewidth)
    // TODO optimize showgrid: false case!

    var gridBatches = [];
    for(k in lookup) {
        gridBatches.push(lookup[k]);
    }

    console.log(lookup)

    console.timeEnd('makeGridData')
    return gridBatches;
}

function clean(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    // TODO clear regl-splom instances
    // TODO clear regl-line2d grid instance!

    Cartesian.cleanSubplots(newFullData, newFullLayout, oldFullData, oldFullLayout);
}

module.exports = {
    name: SPLOM,
    attrRegex: Cartesian.attrRegex,
    layoutAttributes: Cartesian.layoutAttributes,
    supplyLayoutDefaults: Cartesian.supplyLayoutDefaults,
    drawFramework: Cartesian.drawFramework,
    plot: plot,
    drawGrid: drawGrid,
    clean: clean,
    toSVG: Cartesian.toSVG
};
