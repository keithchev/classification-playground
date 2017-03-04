function makeSVM() {

	var data, 			// data structure 
	    x, y, 			// feature array x and response vector y
	    alpha, b,		// lagrange multipliers and threshold

	    C = 1, 			// nonseparability penalty		
	    cSlider,		// slider for C (see svm.load)

	    gaussianRadius = 3,		// gaussian kernel radius
	    gaussianRadiusSlider,	// slider for radius (see svm.load)

	    polynomialOffset = 1,	// offset for polynomial kernel
	    polynomialOffsetSlider,	// offset slider
	    polynomialOrder = 3, 	// polynomial kernel order
	    polynomialOrderSlider,  // order slider

	    counter = 0,	// step counter
	    tol = .001,		// hard coded tolerance

	    kernelName = "linear"; // default kernel

	var featureVector = new FeatureVector();
	

	function svm () {}


	svm.data = function(val, doNotReset) {

		if (!arguments.length) return data;

		data = val;

        // if the feature function hasn't been defined
        if (!svm.featureFunction) return svm;

		x = [];
		y = [];

		data.A.data.forEach( d => {
			y.push(1);
			x.push(svm.featureFunction([d.x1, d.x2]));
		});

		data.B.data.forEach( d => {
			y.push(-1);
			x.push(svm.featureFunction([d.x1, d.x2]));
		});

		// must reset whenever data is changed without svm.reset called
		if (!doNotReset) svm.reset();

		return svm;
	}

	svm.reset = function () {

		// make the feature function
		svm.featureFunction = featureVector.vector();

		// reload the data without resetting (necessary if feature function has changed)
		svm.data(data, true);

		// reinitialize parameters
		alpha = math.zeros([y.length]);

		b = 0;
		counter = 0;

        var kernelList = {
                          "linear": linearKernel, 
                          "gaussian": gaussianKernel,
                          "polynomial": polynomialKernel,
                         };

		svm.kernel = kernelList[kernelName];

		C = cSlider.value();

		gaussianRadius   = gaussianRadiusSlider.value();
		polynomialOffset = polynomialOffsetSlider.value();
		polynomialOrder  = polynomialOrderSlider.value();

		return svm;

	}

	// do one SMO loop (roughly following Platt 1998)
	svm.step = function () {

		counter += 1;

		var debug = 0;

		var flagKKT, 
			ind1, ind2,
			alpha2New, 
			alpha1New,
			alpha1NotAtBounds,
			alpha2NotAtBounds,
			b1, b2, H, L;

		_.each(y, (val, ind2) => {

			var x2 = x[ind2],
				y2 = y[ind2],
				fx2 = wDotX(x2) - b;
				alpha2 = alpha[ind2];

			flagKKT = (alpha2 > 0 && y2*fx2 > (1 + tol)) + 
					  (alpha2 < C && y2*fx2 < (1 - tol));

			if (!flagKKT) {
				if (debug) console.log(`KKT okay at ${ind2}`);
				return;
			}

			ind1 = _.random(0, y.length-1);

			if (ind2===ind1) return;

			var y1 = y[ind1],
				x1 = x[ind1], 
				fx1 = wDotX(x1) - b,
				alpha1 = alpha[ind1],
				dot12 = svm.kernel(x1, x2),
				dot11 = svm.kernel(x1, x1),
				dot22 = svm.kernel(x2, x2);

			// attempt to update alpha2
			var denom = 2*dot12 - dot11 - dot22;

			// if denom greater than zero, punt (full SMO algo handles this)
			if (denom >= 0) {
				if (debug) console.log(`denom > 0 at ${ind1}, ${ind2}`);
				return;
			}
			
			// new alpha2
			alpha2New = alpha2 - y2 * ((fx1 - y1) - (fx2 - y2)) / denom;	
			
			// bounds on alpha2
			H = y1===y2 ? d3.min([C, alpha1 + alpha2]) : d3.min([C, C + alpha2 - alpha1]);
			L = y1===y2 ? d3.max([0, alpha1 + alpha2 - C]) : d3.max([0, alpha2 - alpha1]);

			// in SMO pseudocode, but don't understand this
			if (Math.abs(L - H) < tol) return;

			// clip alpha2
			if (alpha2New > H) alpha2New = H;
			if (alpha2New < L) alpha2New = L;

			// clamp to bounds 
			if (alpha2New < (0 + tol)) alpha2New = 0;
			if (alpha2New > (C - tol)) alpha2New = C;

			// if alpha2New is unchanged - not sure this is quite right
			if (Math.abs(alpha2New - alpha2) < tol) return;

			// update alpha1
			alpha1New = alpha1 + y1*y2 * (alpha2 - alpha2New);

			// update b
			alpha1NotAtBounds = alpha1New > 0 && alpha1New < C;
			alpha2NotAtBounds = alpha2New > 0 && alpha2New < C;

			b1 = b + (wDotX(x1) - b - y1)
			       + y1*(alpha1New - alpha1)*dot11
			       + y2*(alpha2New - alpha2)*dot12;		
			
			b2 = b + (wDotX(x2) - b - y2)
			       + y1*(alpha1New - alpha1)*dot12
			       + y2*(alpha2New - alpha2)*dot22;	

		    b = (b1 + b2)/2;

			if (alpha1NotAtBounds) b = b1;
			if (alpha2NotAtBounds) b = b2;

			// log new alphas
			alpha[ind1] = alpha1New;
			alpha[ind2] = alpha2New;

		});

		if (debug) {
			console.log(alpha);
			console.log(b);
		}

		return svm;

	} // svm.step


	// classifier value 
	svm.classifyPoint = function (xThis) {
		return wDotX(xThis) - b;
	}

	svm.classDomain = function () {
		return [-1, 1];
	}

	svm.gaussianRadius = function (val) {
		if (!arguments.length) return gaussianRadius;
		gaussianRadius = val;
		return svm;
	}

	// draw the options
	svm.load = function (div) {

		div = d3.select(div);
        div.selectAll("div, input, span").remove();

        // draw the feature vector selection divs
        featureVector.draw(div.node(), () => { if (APP.player) APP.player.reset(); });

        // select optz method buttons
        var kernelDiv = div.append("div").attr("id", "select-kernel-container");

        //linear kernel
        kernelDiv.append("div")
                       .attr("class", "plot-button select-kernel")
                       .text("Linear")
                       .on("click", function () {
                          switchActiveButton(this, ".select-kernel");
                          kernelName = "linear";
	                      if (APP.player) APP.player.reset(); 
                       })
                       .classed("plot-button-active", true);

        //gaussian kernel
        kernelDiv.append("div")
                       .attr("class", "plot-button select-kernel")
                       .text("Gaussian")
                       .on("click", function () {
                          switchActiveButton(this, ".select-kernel");
                          kernelName = "gaussian";
	                      if (APP.player) APP.player.reset(); 
                       });

        // polynomial kernel
        kernelDiv.append("div")
                       .attr("class", "plot-button select-kernel")
                       .text("Polynomial")
                       .on("click", function () {
                          switchActiveButton(this, ".select-kernel");
                          kernelName = "polynomial";
	                      if (APP.player) APP.player.reset(); 
                       });

        // gaussianRadius slider for gaussian kernel
        gaussianRadiusSlider = new Slider(div.append("div").node(), "Gaussian radius", [1, 10], 
        	function (slider) { 
        		if (APP.player) APP.player.reset(); 
        	});
        gaussianRadiusSlider.value(gaussianRadius);

        // offset slider for polynomial
        polynomialOffsetSlider = new Slider(div.append("div").node(), "Polynomial offset", [0, 10], 
        	function (slider) { 
        		if (APP.player) APP.player.reset(); 
        	});
        polynomialOffsetSlider.value(polynomialOffset);

        // order slider for polynomial
        polynomialOrderSlider = new Slider(div.append("div").node(), "Polynomial order", [1, 6], 
        	function (slider) { 
        		if (APP.player) APP.player.reset(); 
        	});
        polynomialOrderSlider.value(polynomialOrder);


        // all kernels: C 
        cSlider = new Slider(div.append("div").node(), "C", [.01, 10], 
        	function (slider) { 
        		if (APP.player) APP.player.reset(); 
        	});
        cSlider.value(C);

		return svm;

	}

	// dot product of two 1xn vectors
	function dot (a, b) {

		var dp = 0;

		_.each(a, (val, i) => dp += a[i]*b[i]);

		return dp;
	}


	function linearKernel (a, b) {
		return dot(a, b);
	}

	function gaussianKernel (a, b) {

		var dab = _.map(a, (val, i) => a[i] - b[i]);

		return Math.exp(-dot(dab, dab) / gaussianRadius);
	}

	function polynomialKernel (a, b) {

		return Math.pow( (dot(a, b) + polynomialOffset), polynomialOrder);
	}

	function wDotX (xThis) {

		var s = 0;

		_.each(y, (val, i) => {
			s += alpha[i] * y[i] * svm.kernel(xThis, x[i]);
		});

		return s;
	}

return svm;
}