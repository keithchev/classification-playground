function makeSVM() {

	var x, y, data, alpha, b;

	var tol = .01;
	var C = 1;
	

	function svm() {}

	svm.init = function () {

		alpha = math.zeros([y.length]);



	}

	svm.data = function(data) {

		if (!arguments.length) return data;

		x = [];
		y = [];

		data.A.data.forEach( d => {
			y.push(1);
			x.push([d.x1, d.x2]);
		});

		data.A.data.forEach( d => {
			y.push(-1);
			x.push([d.x1, d.x2]);
		});

	}


	svm.step = function () {

	}

	// classifier value 
	svm.p = function () {

	}

	// draw the options
	svm.loadOptions () {

	}
}