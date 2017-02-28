    

    function switchActiveButton(buttonThis, buttonClass) {
      d3.selectAll(buttonClass).classed("plot-button-active", false);
      d3.select(buttonThis).classed("plot-button-active", true);
    }


    function getField(key) { 
    	return function (d) { return d[key]; } 
    }

    function logit(x) { 
    	return 1/(1 + math.exp(-x)); 
    }


    function randn(N) {

      // generate N normally-distributed random variables

      var two_pi = 2.0*3.14159265358979323846;
      var precision  = 1e5;
      var xlist = [];

      var U1, U2, R, x1, x2;

      for (i = 0; i < Math.ceil(N/2); i++) {

        U1 = _.random(0,precision)/precision; 
        U2 = _.random(0,precision)/precision;

        R = Math.sqrt(-2*Math.log(U1));

        x1 = R * Math.cos(two_pi*U2);
        x2 = R * Math.sin(two_pi*U2);

        xlist.push(x1);
        xlist.push(x2);
        
      }

      return _.first(xlist, N);

    }

    function randu(N) {

    	var x = [];

    	for (i = 0; i < N; i++) {
    		x.push(_.random(0, 1));
    	}

    	return x;
    }