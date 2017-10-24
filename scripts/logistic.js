var makeLogistic = (function () {

    // logistic regression
    function makeLogistic () {

        var data, methodName, alpha, theta, x, y;
        var counter = 0;

        // alpha and slider vars (set in .logistic.loadOptions)
        var alpha, alphaSlider;

        var featureVector = new FeatureVector();

        featureVector.setOffsetFlag(true);

        // theta is 1xn array 
        // x is a 1xm array of 1xn arrays of features (in 2D: [1, x1, x2, x1**2, x2**2, x1*x2, etc])
        // y is a 1xm array of categories (0 or 1) 

        function logit(x) { 
            return 1/(1 + math.exp(-x)); 
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

            // console.log(counter);
            // console.log(theta);
            return logistic;
        }

        logistic.classifyPoint = function (x) {
            return logit(math.dot(logistic.featureFunction(x), theta));
        }

        logistic.classDomain = function () {
            return [0, 1];
        }


        logistic.alpha = function(val) {
            if (!arguments.length) return alpha;
            alpha = val;
            return logistic;
        }

        logistic.theta = function(val) {
            if (!arguments.length) return theta;
            theta = val;
            return logistic;
        }

        // full reset - if feature function changed
        logistic.reset = function () {

            counter = 0;

            var stepFunctions = {
                "batch": logistic.stepBGD,
                "stochastic": logistic.stepSGD,
            };

            // hard code the optz method 
            logistic.step = stepFunctions["stochastic"];

            // make the feature function using currently selected features
            logistic.featureFunction = featureVector.vector();

            // reconstruct the feature vectors from the data
            logistic.data(data);

            // random initial theta
            logistic.initTheta();

            // set alpha (initial slider value set in logistic.load)
            logistic.alpha(alphaSlider.value());

            return logistic;
        }

        logistic.initTheta = function () {
            // random theta
            theta = math.multiply(randn(d3.selectAll(".feature.plot-button-active").data().length + 1), 10);
        }


        logistic.data = function(val) {

            if (!arguments.length) return data;

            data = val;

            // if the feature function hasn't been defined
            if (!logistic.featureFunction) return logistic;

            // construct x (array of features) and y 
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


        logistic.load = function (div) {

            div = d3.select(div);
            div.selectAll("div, input, span").remove();

            // draw the feature vector selection divs
            featureVector.draw(div.node(), () => { if (APP.player) APP.player.reset(); });

            alphaSlider = new Slider(div.node(), "Learning rate", [.01, 1], 
                function (value) { 
                    logistic.alpha(value);
                });

            alphaSlider.value(.1);

            div.append("div")
               .attr("class", "plot-button")
               .text("Randomize theta")
               .on("click", () => {
                    logistic.initTheta();
               });

            return logistic;
        }

        return logistic;
    } // makeLogistic


    return makeLogistic;
})();