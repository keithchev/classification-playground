var toyData = (function () {

    const precision = 1e5;

    function makeGaussBlobData (data) {

        var meanA = [-2, -2],
            meanB = [2, 2];

        var std = 1 * data.noise;

        data.A.data = make2DGaussData(meanA, std, data.N);
        data.B.data = make2DGaussData(meanB, std, data.N);

        return data;
    }


    function make2DGaussData(mean, std, N) {

        var data = _.zip(randn(N), randn(N)).map( d => {
            d = {
                x1: d[0] * std + mean[0], 
                x2: d[1] * std + mean[1],
            };
            return d;
        });
        return data;
    }


    function makeXORData (data) {

        var scale = 5;
        var noise = scale * (data.noise - 1);

        data.A.data = [];
        data.B.data = [];

        for (i = 0; i < data.N; i++) {
            data.A.data.push(randu2d( 0 - noise, scale + noise,  0 - noise, scale + noise ));
            data.A.data.push(randu2d( -scale-noise, 0 + noise,  -scale - noise, 0 + noise ));
            data.B.data.push(randu2d( -scale - noise, 0 + noise, 0 - noise, scale + noise ));
            data.B.data.push(randu2d( 0 - noise, scale + noise, -scale - noise, 0 + noise ));
        }
        return data;

        function randu2d (xmin, xmax, ymin, ymax) {
            return {
                x1: _.random(0, precision)/precision * (xmax-xmin) + xmin, 
                x2: _.random(0, precision)/precision * (ymax-ymin) + ymin
            }
        }
    }


    function makeCircleData (data) {

        var N = data.N;
        var radius = 5;
        var circNoise = data.noise * radius/5;

        // start with normal distro
        data.A.data = make2DGaussData([0, 0], radius/4, N);
        data.B.data = [];

        for (let i = 0; i < N; i++) {
            data.B.data.push( {
                x1: (radius + randu(-circNoise, circNoise)) * Math.cos(2*Math.PI * i/N),
                x2: (radius + randu(-circNoise, circNoise)) * Math.sin(2*Math.PI * i/N),
            });
        }
        return data;
    }


    function makeSpiralData (data) {
        return data;
    }



    function randu (min, max) {
        return _.random(0, precision)/precision * (max - min) + min;
    }



    var exports = {};

    exports.blob     = makeGaussBlobData;
    exports.XOR      = makeXORData;
    exports.circle   = makeCircleData;
    exports.spiral   = makeSpiralData;

    return exports;

})();
