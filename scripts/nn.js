function makeNN() {

	var data, 				// data structure 
	    x, y, 				// feature array x and response vector y
	    weights, biases,	// list of weight vectors and offset vectors

	    alpha = .2, 		// learning rate - updated in alphaSlider callback
	    alphaSlider,		// (see nn.load)

	    lambda = 0,		// regz prefactor - updated in lambdaSlider callback
	    lambdaSlider,		// 

	    counter = 0,				// step counter
	    activationName = "tanh";   // default activations


		var activationFuncs = {
								logit: 
								{
									g:  x => 1/(1 + Math.exp(-x)),
								 	dg: x => { x = 1/(1 + Math.exp(-x)); return x*(1 - x); }
								},
								tanh: 
								{	
									g:  x => Math.tanh(x),
									dg: x => { x = Math.tanh(x); return 1 - x*x; }
								},
								relu: 
								{
									g: x => d3.max([0, x]),
									dg: x => x > 0 ? 1 : 0,
								},
							};


    const tol = .001;		// hard coded tolerance

	var featureVector = new FeatureVector();
		
	// initial architecture (num nodes/layer)
	var architecture = makeArchitecture().list([2, 4, 2, 1]);


	function nn () {}


	nn.data = function(val, doNotReset) {

		if (!arguments.length) return data;

		data = val;

        // if the feature function hasn't been defined
        if (!nn.featureFunction) return nn;

		x = [];
		y = [];

		data.A.data.forEach( d => {
			y.push([1]);
			x.push(nn.featureFunction([d.x1, d.x2]));
		});

		data.B.data.forEach( d => {
			y.push([0]);
			x.push(nn.featureFunction([d.x1, d.x2]));
		});

		// must reset whenever data is changed without nn.reset called
		if (!doNotReset) nn.reset();

		return nn;
	}


	nn.reset = function () {

		// make the feature function
		nn.featureFunction = featureVector.vector();

		// reload the data without resetting (necessary if feature function has changed)
		nn.data(data, true);

		// reinitialize weight vectors and offsets
		weights = [];
		biases  = [];

		var shape = architecture.list();

		_.each(shape, (val, ind) => {
			if (ind!=0) {
				let scaleFactor = Math.pow(shape[ind-1], -.5);
				weights.push(math.multiply(randomMatrix([shape[ind], shape[ind-1]]), scaleFactor));
				biases.push(randomMatrix([1, shape[ind]])[0]);
			}
		});


		counter = 0;

		nn.activation = activationFuncs[activationName];

		return nn;

	}

	// do one mini batch
	nn.step = function () {

		let N = x.length;
		let batchSize = 10; 

		let inds = _.shuffle(_.range(N));

		for (let n = 0; n < (N - batchSize); n+=batchSize) {

			batchInds = inds.slice(n, n + batchSize);

			_.forEach(batchInds, i => {

				let deltas = nn.back(x[i], y[i]);

				let dw = deltas[0], db = deltas[1];

				for (let j = 0; j < weights.length; j++) {

					// regularization
					weights[j] = math.multiply(weights[j], 1 - alpha*lambda/batchSize);

					// update
					weights[j] = math.add(weights[j], math.multiply(dw[j], -alpha/batchSize));
					biases[j]  = math.add(biases[j], math.multiply(db[j], -alpha/batchSize));
				}
			});
		}

		return nn;

	} // nn.step


	nn.back = function(x, y) {

		// nodes is a list of node activations (length = numLayers)
		// weights is a list of a list of weight vectors (length = numlayers - 1)

		let nodes = [], z = [];
		nodes.push(x);


		for (let i = 0; i < weights.length; i++) {
			z.push(math.add(math.multiply(weights[i], nodes[i]), biases[i]));
			nodes.push(_.last(z).map(nn.activation.g));
		}

		let nLayers = nodes.length;

		var dw = _.map(weights, () => []);
		var db = _.map(biases, () => []);

		// error in last layer (for logistic cost)
		let err = math.add(_.last(nodes), y.map(d => -d));

		// dw[i,j] = err[i]*nodes[j]
		dw[dw.length-1] = math.multiply(err.map(d => [d]), [nodes[nodes.length-2]]);
		db[db.length-1] = err;

		for (let i = nLayers-3; i >= 0; i--) {

			err = math.dotMultiply(math.multiply(math.transpose(weights[i+1]), err), z[i].map(nn.activation.dg));

			dw[i] = math.multiply(err.map(d => [d]), [nodes[i]]);
			db[i] = err;

		}

		return [dw, db];
	}


	nn.forward = function (x) {

		var nodes = x;

		_.each(weights, (w, ind) => {

			nodes = math.add(math.multiply(weights[ind], nodes), biases[ind]).map(nn.activation.g);
		});

		return nodes;
	}



	// draw the options when the model is loaded
	nn.load = function (div) {

		div = d3.select(div);
        div.selectAll("div, input, span").remove();

        // draw the feature vector selection divs
        featureVector.draw(div.node(), function (numFeatures) {

			// update the number of input layer nodes to match the number of features
			architecture.numInputNodes(numFeatures);

			// update the architecture textbox
			d3.select("#architecture-textbox").property("value", architecture.string());

			onChange();
        });

        // draw the architecture textbox
        arcDiv = div.append("div").attr("class", "slider-container");

		arcDiv.append("div")
			  .attr("class", "slider-label")
			  .text("Nodes per layer");

        arcDiv.append("input")
	          .attrs({type: "textbox", class: "long-textbox", id: "architecture-textbox"})
	          .property("value", architecture.string())
	          .on("input", function () {
	          	architecture.string(this.value);
	          	onChange();
	          });

        // select optz method buttons
        var activationDiv = div.append("div").attr("id", "select-activation-container");

        activationDiv.append("div").attr("class", "slider-label").text("Activation");

        var activationData = [{label: 'Logit', name: 'logit', selected: true},	
        					  {label: 'Tanh', name: 'tanh', selected: false},
        					  {label: 'ReLu', name: 'relu', selected: false}];

	    activationDiv.selectAll(".select-activation").data(activationData)
	    			 .enter().append("div")
	    			 .attrs({class: "plot-button select-activation"})
	    			 .text(d => d.label)
	    			 .on("click", function (d) {
	    			 	switchActiveButton(this, ".select-activation")
	    			 	activationName = d.name;
	    			 	onChange();
	    			 })
	    			 .classed("plot-button-active", d => d.name==activationName);


        // create parameter sliders w/ a simple callback that updates the relevant parameter
        // (alpha and lambda are closure-scoped)
        alphaSlider = new Slider(div.append("div").node(), "Learning rate", [.01, 1], value => alpha = value);
        alphaSlider.value(alpha);

        lambdaSlider = new Slider(div.append("div").node(), "L2 Regularization", [0, .1], value => lambda = value);
        lambdaSlider.value(lambda);

        // if any setting is changed that requires model reset (i.e., architecture, feature vector, activation function)
        function onChange () {
    		if (APP.player) APP.player.reset(); 
        }

		return nn;

	}


	// classifier value at x
	nn.classifyPoint = function (xThis) {

		return nn.forward(nn.featureFunction(xThis));

	}

	// classification thresholds for plotting
	nn.classDomain = function () {
		return [0, 1];
	}
 

	return nn;
}


function makeArchitecture() {

	var architectureString, architectureList;

	// architectureList is just an array of node numbers: ex [2, 4, 1]
	// this is a lot of wrapper for very little functionality - 
	// designed to handle future, more sophisticated architecture descriptions/type-checking

	function architecture () {}

	architecture.string = function (val) {

		if (!arguments.length) {
			updateString();
			return architectureString;
		}

		// assume val is a valid architectureString
		architectureString = val;
		updateList();
		return architecture;
	}

	architecture.list = function (val) {
		if (!arguments.length) return architectureList;
		architectureList = val;
		return architecture;
	}

	architecture.numInputNodes = function (n) {
		if (!arguments.length) return architectureList[0];
		architectureList[0] = n;
		return architecture;
	}

	architecture.numOutputNodes = function (n) {
		if (!arguments.length) return architectureList.last();
		architectureList[architectureList.length - 1] = n;
		return architecture;
	}

	function updateString () {
		architectureString = architectureList + '';
		architectureString = architectureString.replace(/,/g, ', ');
	}

	function updateList () {
		architectureList = architectureString.split(',').map( d => parseInt(d) );
	}

	return architecture;
}

	// dot product between two vectors
	function vdot (x1, x2) {
		var dp = 0;
		_.each(x1, (val, i) => dp += x1[i]*x2[i]);
		return dp;
	}

	function vadd(x1, x2) {
		return _.map(x1, (val, ind) => x1[ind] + x2[ind]);
	}

	// dot product between matrix A and vector x
	// A is of the form [ [A11, A12, ...], [A21, A22, ...], [...] ]
	// x is a list [x1, x2, x3, ...]

	function mdot (A, x) {

		var y = [];

		_.each(A, (val, ind) => {
			y.push(vdot(A[ind], x));
		});

		return y;
	}

	function randomMatrix(size) {

		var m = [];

		for (var i = 0; i < size[0]; i++) {
			m.push(randn(size[1]));
		}

		return m;

	}