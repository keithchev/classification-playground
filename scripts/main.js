
    // global object
    var APP = {};

    APP.plot = makePlot().init();

    APP.data = {
                A: {},
                B: {},
                type: "blobs",
                N: 10,
                noise: 1,
              };


    class Player {

      constructor () {

        this.started = false;
        this.callback = started => null;
        this.stopFlag = false;

        // model names to closures
        this.modelList = {"logistic": makeLogistic, "svm": makeSVM, "kmeans": makeKMeans};

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
          APP.plot.updateHeatmap();
          return false
        }, 0);
      }

      stop () { 
        this.stopFlag = true;  
      }

      reset () { 
        APP.model = APP.model.reset(); 
      }

      step() {
        if (this.started) return;
        APP.model.step();
        APP.plot.updateHeatmap();
      }

      // the callback to run when starting or stopping 
      onStartStop (callback) {
        this.callback = callback;
      }
    }


    // reset plot
    d3.select("#reset-plot").on("click", function () {  
      APP.plot.reset(); 
    });


    // --- DATA CONTROLS --- //

    // select data type
    d3.selectAll(".select-data").on("click", function () { 
      switchActiveButton(this, ".select-data");
      APP.data.type = _.last(d3.select(this).attr("id").split("-"));
      makeData();
      updateData();
    });

    APP.data.type = "blobs";
    switchActiveButton(d3.select("#select-blobs").node(), ".select-data");

    // buttons to select class to edit
    d3.selectAll(".select-class").on("click", function () { 
      switchActiveButton(this, ".select-class");
      APP.className = _.last(d3.select(this).attr("id").split("-")).toUpperCase();
    });

    // mouse mode: pan/zoom
    d3.select("#mouse-pan").on("click", function () {
      switchActiveButton(this, ".select-mouse");
      APP.panFlag = true;
    });

    APP.panFlag = true;
    switchActiveButton(d3.select("#mouse-pan").node(), ".select-mouse");

    // mouse mode: add a point 
    d3.select("#mouse-add-point").on("click", function () { 

      switchActiveButton(this, ".select-mouse");
      APP.panFlag = false;

      APP.plot.clickCallback = function (clickPos) {

        if (!APP.className) return;

        APP.data[APP.className].data.push({x1: clickPos[0], x2: clickPos[1]});
        
        updateData();
      }
    });

    // mouse mode: remove nearest point
    d3.select("#mouse-remove-point").on("click", function () { 

      switchActiveButton(this, ".select-mouse");
      APP.panFlag = false;

      APP.plot.clickCallback = function (clickPos) {

        if (!APP.className) return;

        var dist  = APP.data[APP.className].data.map(d => math.norm(math.subtract([d.x1, d.x2], clickPos)));

        APP.data[APP.className].data.splice(_.indexOf(dist, _.min(dist)), 1);
        updateData();
      }
    });

    // noise slider (arguments: node, label, range, callback(sliderNode))
    APP.noiseSlider = new Slider(d3.select("#slider-noise-container").node(), "Noise", [0, 2], 
      function (val) {
        APP.data.noise = val;
        makeData(); 
        updateData();
      }
    );

    // N slider (arguments: node, label, range, callback(sliderNode))
    APP.numSlider = new Slider(d3.select("#slider-num-container").node(), "Number of points", [5, 50], 
      function (val) {
        APP.data.N = val;
        makeData(); 
        updateData();
      }
    );

    APP.noiseSlider.value(APP.data.noise);
    APP.numSlider.value(APP.data.N);

    // --- SELECT MODEL CONTROLS --- //

    // select logistic
    d3.select("#select-logistic").on("click", function () { 
      switchActiveButton(this, ".select-model");
      APP.model = makeLogistic();
      APP.model.load(d3.select("#model-options-container").node());
      APP.model.data(APP.data).reset();
      APP.plot.drawHeatmap();

    });

    // select SVM
    d3.select("#select-svm").on("click", function () { 
      switchActiveButton(this, ".select-model");
      APP.model = makeSVM();
      APP.model.load(d3.select("#model-options-container").node());
      APP.model.data(APP.data).reset();
      APP.plot.drawHeatmap();
    });


    // --- PLAYER CONTROLS --- //

    APP.player = new Player();

    APP.player.onStartStop( function(isPlaying) { 
      d3.select("#start-model").text( function () { return isPlaying ? "Stop" : "Start" });
      d3.select("#start-model").classed("plot-button-active", isPlaying);
    });

    d3.select("#start-model").on("click", () => APP.player.startStop());
    d3.select("#step-model").on("click", () => APP.player.step());
    d3.select("#reset-model").on("click", () => APP.player.reset());


    // initialize data
    makeData(); 
    updateData();

    // initialize with SVM 
    switchActiveButton(d3.select("#select-svm").node(), ".select-model");
    APP.model = makeSVM();
    APP.model.load(d3.select("#model-options-container").node());
    APP.model.data(APP.data).reset();
    APP.plot.drawHeatmap();

    // start the model solution
    APP.player.startStop();

    function updateData() {
        APP.plot.updateData(); 
        if (APP.model) APP.model.data(APP.data);
      }

    function makeData() {

      var dataTypeToFunc = { "blobs":  toyData.blob,
                             "xor":    toyData.XOR,
                             "circle": toyData.circle, 
                             "spiral": toyData.spiral };

      APP.data = dataTypeToFunc[APP.data.type](APP.data);

    }

    // placeholder closures for and kmeans
    function makeKMeans () {}


    function makePlot() {

      var xAxis, yAxis, 
          x1Scale, x2Scale, classValScale,
          svg, svgG;

      var pad = 15, 
          plotWidth = 350, 
          plotHeight = 350;

      var transformLast = {x:0, y:0, k: 1};

      function plot() {}

      plot.init = function () {   

        svg  = d3.select("#plot-container")
                 .append("svg").attrs({width: plotWidth, height: plotHeight});

        svgG = svg.append("g").attr("transform", `translate(${pad}, ${pad})` );

        svgG.append("g")
            .attrs({class: "axis", id: "plot-x-axis", transform: `translate(0, ${plotHeight-pad-pad} )`});

        svgG.append("g")
            .attrs({class: "axis", id: "plot-y-axis"});

        svgG.append("g").attr("id", "scatter-dot-container");

        x1Scale = d3.scaleLinear().domain([-10, 10]).range([0, plotWidth - pad - pad]);
        x2Scale = d3.scaleLinear().domain([-10, 10]).range([plotHeight - pad - pad, 0]);

        xAxis = d3.axisBottom(x1Scale).tickSize(0);
        yAxis = d3.axisLeft(x2Scale).tickSize(0);


        svg.on("click", function () { 

          var clickPosScreen = d3.mouse(this);

          clickPos = [ x1Scale.invert(clickPosScreen[0]-pad), 
                       x2Scale.invert(clickPosScreen[1]-pad) ];

          if (plot.clickCallback) plot.clickCallback(clickPos);

        });

        var zoom = d3.zoom()
                     .filter( () => event.shiftKey || APP.panFlag)
                     .on("zoom", () => {
                        plot.transform(d3.event.transform);
                        plot.drawHeatmap();
                    });

        svg.call(zoom);

        svg.select("#plot-x-axis").call(xAxis);
        svg.select("#plot-y-axis").call(yAxis);

        return plot;

      }

      plot.clickCallback = function (clickPos) {}

      plot.getLastClickPos = function () {
        return [ x1Scale.invert(d3.select("#mouse-click-dot").attr("cx")), 
                 x2Scale.invert(d3.select("#mouse-click-dot").attr("cy")) ];
      }

      // update the data - adds/removes dots
      plot.updateData = function () {

        var dots;

        // class A
        dots = d3.select("#scatter-dot-container")
                 .selectAll(".scatter-dot-A").data(APP.data.A.data);

        dots.enter().append("circle")
            .attrs({"class": "scatter-dot-A", r: 3, "fill": "#ff6666"})
          .merge(dots)
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        dots.exit().remove();

        // class B
        dots = d3.select("#scatter-dot-container")
                 .selectAll(".scatter-dot-B").data(APP.data.B.data);

        dots.enter().append("circle")
            .attrs({"class": "scatter-dot-B", r: 3, "fill": "#6666ff"})
          .merge(dots)
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        dots.exit().remove();

        return plot;

      }



      plot.transform = function(transform) {

        var dk = transform.k/transformLast.k;

        var x1Domain = x1Scale.domain();
        var x2Domain = x2Scale.domain();

        // if zoomed
        if (dk!==1) {

          x1Domain = x1Domain.map( d => d*dk );
          x2Domain = x2Domain.map( d => d*dk );

          transformLast.x = transform.x - d3.mean(x1Scale.range());
          transformLast.y = transform.y - d3.mean(x2Scale.range());
          transformLast.k = transform.k;

        // if panned
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
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        svgG.selectAll(".scatter-dot-B")
            .attr("cx", d => x1Scale(d.x1))
            .attr("cy", d => x2Scale(d.x2));

        svg.select("#plot-x-axis").call(xAxis);
        svg.select("#plot-y-axis").call(yAxis);

      }


      plot.data = function (data_) {
        if (!arguments.length) return data;
        data = data_;
        return plot;
      }


      plot.drawHeatmap = function () {

        if (!APP.model) return;

        var numHeatmapTiles = 40;

        // class A, class B values
        var classValDomain = APP.model.classDomain();
        var classValMid    = d3.mean(classValDomain);

        // global var (referenced by plot.updateHeatmap)
        classValScale = d3.scaleLinear()
                          .range(["#66f", "#fff", "#f66"])
                          .domain([classValDomain[0], classValMid, classValDomain[1]])
                          .clamp(true);
            
        var tileSize = (x1Scale.domain()[1] - x1Scale.domain()[0]) / numHeatmapTiles;

        var x1Grid = d3.range(x1Scale.domain()[0], x1Scale.domain()[1], tileSize);
        var x2Grid = d3.range(x2Scale.domain()[0], x2Scale.domain()[1], tileSize);

        tileWidth  = Math.abs(x1Scale(x1Grid[1]) - x1Scale(x1Grid[0]));
        tileHeight = Math.abs(x2Scale(x2Grid[1]) - x2Scale(x2Grid[0]));

        var heatmapTiles = [];

        // initialize heatmap tile array
        x1Grid.map( function (x1) {
          x2Grid.map( function (x2) {
            heatmapTiles.push({x1: x1, x2: x2, classVal: classValMid, updateFlag: false});
          });
        });

        svgG.selectAll(".tile").remove();

        var tiles = svgG.selectAll(".tile").data(heatmapTiles);

        tiles.enter().append("rect")
             .attr("class", "tile")
             .attr("x", d => x1Scale(d.x1))
             .attr("y", d => x2Scale(d.x2) - tileHeight)
             .attr("width", tileWidth)
             .attr("height", tileHeight)
             .attr("fill", d => classValScale(d.classVal));

         plot.updateHeatmap();

         svgG.select("#scatter-dot-container").moveToFront();

      }

      // color the heatmap - assumes plot.drawHeatmap has been called
      plot.updateHeatmap = function () {

        if (!APP.model) return;

        var tiles = svgG.selectAll(".tile");

        tiles.data().forEach(d => {

          d.updateFlag = false;

          var classVal = APP.model.classifyPoint([d.x1, d.x2]);

          if (Math.abs(d.classVal - classVal) > .01) {
            d.updateFlag = true;
            d.classVal = classVal;
          }

        });

        tiles.filter(d => d.updateFlag)
             .attr("fill", d => classValScale(d.classVal));

      }



      return plot;

  } // makePlot





