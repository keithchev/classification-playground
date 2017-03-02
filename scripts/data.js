var toyData = (function () {

    function makeGaussBlobData (data) {

      var mean = {
                  A: {x1: -2, x2: -2}, 
                  B: {x1: 2, x2: 2}
                 };

      var std = 1;

      ["A", "B"].forEach( name => {

        data[name].data = _.zip(randn(data.N), randn(data.N)).map(r => { 
 
          var d = {
                    x1: r[0] * (std + data.noise) + mean[name].x1, 
                    x2: r[1] * (std + data.noise) + mean[name].x2
                  };

          return d;
        });
      });

      return data;

    }

    function makeXORData (data) {

      var scale = 5;

      var noise = data.noise;

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

        var precision = 1e5;

        return {
          x1: _.random(0, precision)/precision * (xmax-xmin) + xmin, 
          x2: _.random(0, precision)/precision * (ymax-ymin) + ymin
        };

      }

    }

    function makeCircleData (data) {


      return data;
    }

    function makeSpiralData (data) {


      return data;
    }


var exports = {};

exports.blob     = makeGaussBlobData;
exports.XOR      = makeXORData;
exports.circle   = makeCircleData;
exports.spiral   = makeSpiralData;

return exports;

})();
