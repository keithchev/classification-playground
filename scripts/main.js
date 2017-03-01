
    // global object
    APP = {};

    APP.plot = makePlot().init();

    var data = {
                A: {},
                B: {},
                type: "blobs",
                N: 50,
                noise: 0,
              };

    APP.data = data;



    class Player {

      constructor () {

        this.started = false;
        this.callback = started => null;
        this.stopFlag = false;

        // model names to closures
        this.modelList = {"logistic": makeLogistic, "svm": makeSVM, "kmeans": makeKMeans};

      }

      init () {

        APP.model = APP.model.init().data(APP.data);

      }

      startStop () {

        if (this.started) {
          this.started = false;
          this.stop();
        } else {
          this.started = true;
          this.start();
        }
        this.callback(this.started);
      }

      start () {
        this.stopFlag = false;
        d3.timer(() => { 
          if (this.stopFlag) return true;
          APP.model.step();
          APP.plot.drawModel();
          return false
        }, 0);
      }

      stop () { 
        this.stopFlag = true;  
      }

      reset () { 
        APP.model = APP.model.init(); 
      }

      step() {
        if (this.started) return;
        APP.model.step();
        APP.plot.drawModel();
      }

      // the callback to run when starting or stopping 
      onStartStop (callback) {
        this.callback = callback;
      }
    }

    // select mouse mode buttons
    d3.selectAll("#mouse-edit").on("click", function () { 
      switchActiveButton(this, "#mouse-edit");
      APP.mouseMode = "edit";
    });

    // reset plot
    d3.select("#reset-plot").on("click", function () {  APP.plot.reset(); });

    // --- DATA CONTROLS --- //

    d3.selectAll(".select-data").on("click", function () { 
      switchActiveButton(this, ".select-data");
      APP.data.type = _.last(d3.select(this).attr("id").split("-"));
      makeData();
      APP.plot.updateData();
      if (APP.model) APP.player.init();
    });

    // buttons to select class to edit
    d3.selectAll(".select-class").on("click", function () { 
      switchActiveButton(this, ".select-class");
      APP.className = _.last(d3.select(this).attr("id").split("-")).toUpperCase();
    });

    // add a point 
    d3.select("#add-point").on("click", function () { 

      var point = APP.plot.getLastClickPos();

      APP.data[APP.className].data.push({x1: point[0], x2: point[1]});
      APP.plot.updateData(); 

      if (APP.model) APP.player.init();

    });

    // remove nearest point
    d3.select("#remove-point").on("click", function () { 

      var point = APP.plot.getLastClickPos();

      var dist  = APP.data[APP.className].data.map(d => math.norm(math.subtract([d.x1, d.x2], point)));

      APP.data[APP.className].data.splice(_.indexOf(dist, _.min(dist)), 1);
      APP.plot.updateData(); 

      if (APP.model) APP.player.init();

    });

    // noise slider (arguments: node, label, range, callback(sliderNode))
    APP.noiseSlider = new Slider(d3.select("#slider-noise-container").node(), "Noise", [0, 10], 
      function (val) {
        APP.data.noise = val;
        makeData(); 
        APP.plot.updateData(); 
        if (APP.model) APP.player.init();
      }
    );

    APP.noiseSlider.value(0);


    // --- SELECT MODEL CONTROLS --- //

    // select logistic
    d3.select("#select-logistic").on("click", function () { 
      switchActiveButton(this, ".select-model");
      APP.model = makeLogistic();
      APP.model.loadOptions(d3.select("#model-options-container").node());
    });

    // select SVM
    d3.select("#select-svm").on("click", function () { 
      switchActiveButton(this, ".select-model");
      APP.model = makeSVM();
      APP.model.loadOptions(d3.select("#model-options-container").node());
    });


    // --- PLAYER CONTROLS --- //

    APP.player = new Player();

    d3.select("#start-model").on("click", () => APP.player.startStop());

    APP.player.onStartStop( function(isPlaying) { 
      d3.select("#start-model").text( function () { return isPlaying ? "Stop" : "Start" });
    });

    d3.select("#init-model").on("click", () => APP.player.init());
    d3.select("#reset-model").on("click", () => APP.player.reset());
    d3.select("#step-model").on("click", () => APP.player.step());



    makeData(); 
    APP.plot.updateData();


    function makeData() {

      var dataTypeToFunc = { "blobs": makeGaussBlobData,
                             "xor": makeXORData,
                             "circle": makeCircleData, 
                             "spiral": makeSpiralData };

      APP.data = dataTypeToFunc[APP.data.type](APP.data);

    }

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

    }

    function makeSpiralData (data) {

    }



    // placeholder closures for and kmeans
    function makeKMeans () {}


    function makePlot() {

      var xAxis, yAxis, x1Scale, x2Scale, svg, svgG, modelLine, modelLineSlope, modelLineOffset;

      var pad = 15, plotWidth = 400, plotHeight = 400;

      var transformLast = {x:0, y:0, k: 1};

      function plot() {}

      plot.init = function () {   

        svg  = d3.select("#plot-container").append("svg").attr("width", plotWidth).attr("height", plotHeight);
        svgG = svg.append("g").attr("transform", `translate(${pad}, ${pad})` );

        svgG.append("g").attrs({"class": "axis", "id": "plot-x-axis", "transform": `translate(0, ${plotHeight-pad-pad} )`});
        svgG.append("g").attrs({"class": "axis", "id": "plot-y-axis"});

        svgG.append("g").attr("id", "scatter");

        svgG.append("path").attr("id", "model-path");

        x1Scale = d3.scaleLinear().range([0, plotWidth - pad - pad]).domain([-10, 10]);
        x2Scale = d3.scaleLinear().range([plotHeight - pad - pad, 0]).domain([-10, 10]);

        xAxis = d3.axisBottom(x1Scale).tickSize(0);
        yAxis = d3.axisLeft(x2Scale).tickSize(0);

        modelLine = d3.line().x(d => x1Scale(d.x))
                             .y(d => x2Scale(d.y));

        svgG.append("circle").attrs({id: "mouse-click-dot", "cx": 0, "cy": 0, "r": 3, "fill": "black"});

        svg.on("click", function () { 
          if (APP.mouseMode!=="edit") return;
          var pos = d3.mouse(this);
          d3.select("#mouse-click-dot").attr("cx", pos[0]-pad).attr("cy", pos[1]-pad); 
        });

        var zoom = d3.zoom()
                     .filter( () => { return event.shiftKey; })
                     .on("zoom", () => { plot.transform(d3.event.transform); });

        svg.call(zoom);

        svg.select("#plot-x-axis").call(xAxis);
        svg.select("#plot-y-axis").call(yAxis);

        return plot;

      }

      // update the data - adds/removes dots
      plot.updateData = function () {

        var dots;

        dots = svgG.selectAll(".scatter-dot-A").data(APP.data.A.data);

        dots.enter().append("circle")
            .attrs({"class": "scatter-dot-A", r: 3, "fill": "#6666ff"})
          .merge(dots).transition()
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        dots.exit().remove();

        dots = svgG.selectAll(".scatter-dot-B").data(APP.data.B.data);

        dots.enter().append("circle")
            .attrs({"class": "scatter-dot-B", r: 3, "fill": "#ff6666"})
          .merge(dots).transition()
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        dots.exit().remove();

        return plot;

      }


      plot.getLastClickPos = function () {
        return [ x1Scale.invert(d3.select("#mouse-click-dot").attr("cx")), 
                 x2Scale.invert(d3.select("#mouse-click-dot").attr("cy")) ];
      }

      plot.transform = function(transform) {

        var dk = transform.k/transformLast.k;

        var x1Domain = x1Scale.domain();
        var x2Domain = x2Scale.domain();

        if (dk!==1) {

          x1Domain = x1Domain.map( d => d*dk );
          x2Domain = x2Domain.map( d => d*dk );

          transformLast.x = transform.x - d3.mean(x1Scale.range());
          transformLast.y = transform.y - d3.mean(x2Scale.range());
          transformLast.k = transform.k;

        } else {

          x1Domain = x1Domain.map( d => d - x1Scale.invert(transform.x - transformLast.x) );
          x2Domain = x2Domain.map( d => d - x2Scale.invert(transform.y - transformLast.y) );

        }

        updateDomains(x1Domain, x2Domain);

        return plot;

      }

      // center the plot on zero
      plot.reset = function () {

        var x1Domain = x1Scale.domain();
        var x2Domain = x2Scale.domain();

        x1Domain = math.subtract(x1Domain, d3.mean(x1Domain));
        x2Domain = math.subtract(x2Domain, d3.mean(x2Domain));

        updateDomains(x1Domain, x2Domain);

        return plot;
      }

      // internal function to update x1 and x2 domains
      updateDomains = function (x1Domain, x2Domain) {

        x1Scale.domain(x1Domain);
        x2Scale.domain(x2Domain);

        svgG.selectAll(".scatter-dot-A")
            .attr("cx", (d) => { return x1Scale(d.x1); })
            .attr("cy", (d) => { return x2Scale(d.x2); });

        svgG.selectAll(".scatter-dot-B")
            .attr("cx", (d) => { return x1Scale(d.x1); })
            .attr("cy", (d) => { return x2Scale(d.x2); });

        // d3.select("#model-path").attr("d", modelLine(makeModelLineData()));

        svg.select("#plot-x-axis").call(xAxis);
        svg.select("#plot-y-axis").call(yAxis);


      }




      plot.data = function (data_) {
        if (!arguments.length) return data;
        data = data_;
        return plot;
      }

      plot.drawLine = function (theta) {

        modelLineSlope   = -theta[1]/theta[2],
        modelLineOffset  = -theta[0]/theta[2], 

        d3.select("#model-path").attr("d", modelLine(makeModelLineData()));
      }

      function makeModelLineData() {
        var xDomain = x1Scale.domain();
        return [{"x": xDomain[0], "y": xDomain[0] * modelLineSlope + modelLineOffset},
                {"x": xDomain[1], "y": xDomain[1] * modelLineSlope + modelLineOffset}];
      }

      plot.drawModel = function () {

        classf = APP.model.classifyPoint([0,0]);

        var pScale = d3.scaleLinear().range(["#66f", "#fff", "#f66"]).domain(classf.domain);

        var x1Grid = d3.range(x1Scale.domain()[0], x1Scale.domain()[1], .5);
        var x2Grid = d3.range(x2Scale.domain()[0], x2Scale.domain()[1], .5);

        var width  = Math.abs(x1Scale(x1Grid[1]) - x1Scale(x1Grid[0]));
        var height = Math.abs(x2Scale(x2Grid[1]) - x2Scale(x2Grid[0]));

        var heatmapTiles = [];

        x1Grid.map( function (x1) {
          x2Grid.map( function (x2) {
            heatmapTiles.push({"x1": x1, "x2": x2, "p": APP.model.classifyPoint([x1, x2]).p});
          });
        });

        var tiles = svgG.selectAll(".tile").data(heatmapTiles);

        tiles.enter().append("rect")
             .attr("class", "tile")
             .attr("x", (d) => { return x1Scale(d.x1); })
             .attr("y", (d) => { return x2Scale(d.x2); })
             .attr("width", width)
             .attr("height", height)
            .merge(tiles)
             .attr("fill", (d) => { return pScale(d.p); });


      }

      return plot;

  } // makePlot





