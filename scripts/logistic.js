
    // logistic regression
    function makeLogistic () {

      var data, methodName, alpha, theta, x, y;
      var counter = 0;

      // step size hard coded for now
      alpha = .01;

      // theta is 1xn array 
      // x is a 1xm array of 1xn arrays of features (in 2D: [1, x1, x2, x1**2, x2**2, x1*x2, etc])
      // y is a 1xm array of categories (0 or 1) 

      var featureTypes = [[
                            {label: "x<sub>1</sub>",   f: x => x[0] }, 
                            {label: "x<sub>2</sub>",   f: x => x[1] }
                         ],[
                            {label: "x<sub>1</sub><sup>2</sup>", f: x => x[0]*x[0] }, 
                            {label: "x<sub>2</sub><sup>2</sup>", f: x => x[1]*x[1] }
                         ],[
                            {label: "x<sub>1</sub>*x<sub>2</sub>", f: x => x[0]*x[1] }
                         ],[
                            {label: "sin(x<sub>1</sub>)", f: x => Math.sin(x[0]) },
                            {label: "sin(x<sub>2</sub>)", f: x => Math.sin(x[1]) }
                        ]];

      function makeFeature (inds, f) {

        // assume f takes one argument
        if (typeof inds==="number") return x => f(x[inds]);

        // assume f takes two arguments (i.e., xi, xj)
        if (inds.length===2) return x => f(x[inds[0]], x[inds[1]]);
      }


      function logistic () {}

      // batch gradient descent
      logistic.stepBGD = function () { }

      // stochastic gradient descent
      logistic.stepSGD = function () {

        var i, j;

        for (i = 0; i < y.length; i++) {
          for (j = 0; j < theta.length; j++) {

            theta[j] = theta[j] + alpha * x[i][j] * (y[i] - logit(math.dot(theta, x[i])));
          }
        }

        counter = counter + 1;

        console.log(counter);
        console.log(theta);

        return logistic;

      }

      logistic.p = function (x) {
        return logit(math.dot(logistic.featureFunction(x), theta));
      }


      logistic.alpha = function(_) {
        if (!arguments.length) return alpha;
        alpha = _;
        return logistic;
      }

      logistic.theta = function(_) {
        if (!arguments.length) return theta;
        theta = _;
        return logistic;
      }

      // initialization/reset procedures
      logistic.init = function () {

        counter = 0;

        // random theta
        theta = math.multiply(randn(d3.selectAll(".feature.plot-button-active").data().length + 1), 10);

        // make the feature function using currently selected features
        logistic.featureFunction = makeFeatureFunction();

        // set the optz method (for now, only stochastic gradient)
        logistic.step = pickStepMethod();


        return logistic;
      }

      // construct the function to generate feature vector for [x1,x2] points
      function makeFeatureFunction () {

        var selectedFeatures = d3.selectAll(".feature.plot-button-active").data();

        return function (x) {

          // offset/bias term  
          var featureRow = [1];
          
          // add currently selected feature functions (x1, x1^2, etc)
          selectedFeatures.map( feature => featureRow.push(feature.f(x)) );
          return featureRow;
        };

      };

      // set update method (methodName is set when optimization div is clicked)
      function pickStepMethod () {

        var methodList = {
                          "batch": logistic.stepBGD, 
                          "stochastic": logistic.stepSGD,
                         };

        return methodList[methodName];

      }

      logistic.data = function(_) {

        if (!arguments.length) return data;
        data = _;

        x = []; 
        y = [];

        data.A.data.forEach(row => {
          y.push(1);
          x.push(logistic.featureFunction([row.x1, row.x2]));
        });

        data.B.data.forEach(row => {
          y.push(0);
          x.push(logistic.featureFunction([row.x1, row.x2]));
        });

        return logistic;
      }



      logistic.loadOptions = function (div) {

        div.selectAll("div").remove();

        var featureTypeDivs = div.append("div")
                                 .attr("id", "select-features-container")
                                 .selectAll("div").data(featureTypes)
                                 .enter().append("div")
                                 .attr("class", "feature-type");

        featureTypeDivs.selectAll("div").data(featureType => featureType)
                       .enter().append("div")
                       .attr("class", "plot-button feature")
                       .html(d => d.label)
                       .on("click", function (d) {
                          var isSelected = !d3.select(this).classed("plot-button-active");
                          d3.select(this).classed("plot-button-active", isSelected);
                        });


        // select optz method buttons
        var optimizationDiv = div.append("div").attr("id", "select-optimization-container");

        //stochastic gradient
        optimizationDiv.append("div")
                       .attr("class", "plot-button select-optimization")
                       .text("Stochastic gradient")
                       .on("click", function () {
                          switchActiveButton(this, ".select-optimization");
                          methodName = "stochastic";
                       });

        //batch gradient 
        optimizationDiv.append("div")
                       .attr("class", "plot-button select-optimization")
                       .text("Batch gradient")
                       .on("click", function () {
                          switchActiveButton(this, ".select-optimization");
                          methodName = "batch";
                       });


        return logistic;
      }

      return logistic;
    } // makeLogistic