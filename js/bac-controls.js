(function ($) {
  Drupal.behaviors.bacCalculator = {
    attach: function (context, settings) {
      //$('#buzz-o-graphic').once('bac-graph', Drupal.bacInitialize);
      $('#drink-controls select').each( function() {
        $(this).once('bac-controls', function() {
          //find the drink selects and add sliders
          //build the controls
          var slider;
          var select = this;
          slider = $("<div class='slider-drink-cntr'></div>").insertBefore(this).slider({
            //orientation: "vertical",
            animation:"fast",
            min: 0,
            max: 10,
            //value: $('#drink-cntr-' + i).selectedIndex,
            value: select.selectedIndex,
            range: "min",
            slide: function( event, ui ) {
              //select.selectedIndex = ui.value;
              select.selectedIndex = ui.value;
              recalculate();
            }
            /*end: function( event, ui) {
              recalculate();
            }*/
          });
          $(this).change(function() {
              slider.slider("value", this.selectedIndex);
              recalculate();
          });
        });
      });

      //define the axes and the data we are going to need later.
      var x, 
        y,
        xAxis,
        yAxis,
        svg,
        bacLine;
        
      //define the data
      var dataset = defineDataset();
      //set up
      initialize();
      
      //define dataset
      function defineDataset() {
        var datum,
          dataset = [];
        var intervals = document.getElementById('start-time').options;
        for(var i=0; i<intervals.length; i++) {
          datum=new Object();
            datum.interval = intervals[i].text;
            datum.bac = 0;
            datum.visible = true;
          dataset[i]=datum;
        }
        return dataset;
      }
      //recalculate the bacs
      function recalculate() {
        var sex;
        var weight = document.getElementById('weight-control').value;
        if(document.getElementById('edit-sex-m').checked == true) {
          sex = 'male';
        }
        else if(document.getElementById('edit-sex-f').checked == true) {
          sex = 'female';
        }
        else {
          sex = 'trans';
        }
        for(var i=0; i<dataset.length; i++) {
          drinks = document.getElementById('drink-select-' + i).selectedIndex;
          if (i == 0) {
            dataset[i].bac = bac(weight, sex, drinks, 0);         
          }
          else {
            dataset[i].bac = bac(weight, sex, drinks, dataset[i-1].bac);
          }
          document.getElementById('bac-' + i).textContent = dataset[i].bac;
        }
        var t = svg.transition().duration(300);
        t.select('.bac-line').attr("d", bacLine(dataset));
      }
      function update(startIndex, endIndex) {
        //pass the index of the start select
        //pass the index of the end select
        //change xdomain accordingly
        var intervals = [];
        var updateset = [];
        var j = 0;
        for (var k=0; k<dataset.length; k++) {
          if (k<startIndex) {
            dataset[k].bac = 0;
            $('#edit-bac-' + k).hide();
            $('.form-item-controls-area-drink-cntr-' + k).hide();
            //document.getElementById(
          }
          else if(k>endIndex) {
            $('#edit-bac-' + k).hide();
            $('.form-item-controls-area-drink-cntr-' + k).hide();
          }
          else {
            $('#edit-bac-' + k).show();          
            $('.form-item-controls-area-drink-cntr-' + k).show();
            intervals[j] = dataset[k].interval;
            updateset[j]=dataset[k];
            j++;
          }
        }
        x.domain(intervals);
        //update the chart
        var t = svg.transition().duration(300);
        t.select('.x.axis').call(xAxis);
        t.select('.bac-line').attr("d", bacLine(updateset));
    }
      //initialize
      function initialize() {
        //hide the update button
        $('input.form-submit').hide();
        var intervals = [];
        for (var i=0; i<dataset.length; i++) {
          intervals[i] = dataset[i].interval;
        }
        var margin = {top: 20, right: 10, bottom: 20, left: 50},
            width = 700 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom,
            w =  width + margin.left + margin.right,
            h = height + margin.top + margin.bottom;
        x = d3.scale.ordinal().rangePoints([0, width], 1.0);
          x.domain(intervals);  //this is what will change.
        y = d3.scale.linear().range([height, 0]);
          y.domain([0,0.5]);
        xAxis = d3.svg.axis().scale(x)
          .orient("bottom").ticks(dataset.length);
        yAxis = d3.svg.axis().scale(y)
          .orient("right").ticks(5);
        bacLine = d3.svg.line()
          .interpolate('monotone')
          .x(function(d) { return x(d.interval); })
          .y(function(d) { return y(d.bac); });
        svg = d3.select("#buzz-o-graphic").append("svg")
          .attr("id", "bac-graph-container")
          //better to keep the viewBox dimensions with variables
          .attr("viewBox", "0 0 " + w + " " + h )
          .attr("preserveAspectRatio", "xMidYMid meet");
        svg.append("g")         // Add the X Axis
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
        svg.append("g")         // Add the Y Axis
          .attr("class", "y axis")
          .call(yAxis);
        svg.append("path")      // Add the valueline path.
          .attr("class", "bac-line")
          .attr("d", bacLine(dataset));
          //initialize();
      }
      //weight control slider
      $('#weight-control', context).once('bac-calculator', function() {
        $("<div id='slider-weight'></div>").insertAfter( '#weight-control').slider({
          min: 80,
          max: 400,
          value: $( "#weight-control" ).val(),
          range: "min",
          slide: function( event, ui ) {
            $( "#weight-control" ).val(ui.value);
            recalculate();
          }
        });
        $( "#weight-control" ).val( $( "#slider-weight" ).slider( "value" ));
      });
      //event interval sliders
      $('#control-controls').once('bac-calculator', function() {
        var start = document.getElementById('start-time');
        var end = document.getElementById('end-time');
        sliderControl = $("<div class='slider-control-control'></div>").insertAfter(this).slider({
          range: true,
          min: 0,
          max: 23,
          values: [start.selectedIndex, end.selectedIndex],
          slide: function( event, ui ) {
            start.selectedIndex = ui.values[0];
            end.selectedIndex = ui.values[1];
          },
          stop: function( event, ui) {
            update(ui.values[0], ui.values[1]);
            recalculate();
          }
        });        
      });
      //sex radiobox set
      $('input[type=radio]').change(function() { recalculate();});
      //event intervals select boxes
      $('#control-controls select').each( function () {
          $(this).once('bac-controls', function() {
            $(this).change(function() {
              if (this.name == 'start') {
                var end = document.getElementById('end-time');
                sliderControl.slider("values", 0, this.selectedIndex);
                if(this.selectedIndex > end.selectedIndex) {
                  end.selectedIndex = this.selectedIndex;
                  sliderControl.slider("values", 1, this.selectedIndex);
                }
              update(this.selectedIndex, end.selectedIndex);  
              }
              else {
                var start = document.getElementById('start-time');
                sliderControl.slider("values", 1, this.selectedIndex);
                if(this.selectedIndex < start.selectedIndex) {
                  start.selectedIndex = this.selectedIndex;
                  sliderControl.slider("values", 0, this.selectedIndex);
                }
                update(start.selectedIndex, this.selectedIndex);
              }
              //recalculate();
            });          
          });
      });
      function bac( weight, sex, drinks, base ) {
				var MALE_CONST = 0.58,
					FEMALE_CONST = 0.49,
					DECREASE = 0.017,
					LBS_PER_KG = 2.2046,
					A = 23.36,
					B = 80.6,
					C = .045,
					D = 12;
				var bac, gFactor;
				if (sex == "male") {
					gFactor = MALE_CONST;
				}
				else if (sex == "female") {
					gFactor = FEMALE_CONST;
				}
				else {
					gFactor = parseFloat((MALE_CONST + FEMALE_CONST)/2);
				}
				//=23.36/(1000*B4*B2/2.2046)*80.6*B1*12*0.045-B5*0.017
				bac = B * drinks * D * C * A/(gFactor * 1000 * weight/LBS_PER_KG) + base - DECREASE;
				if(bac < 0) {
					bac = 0;
				}
				return bac;
			}

    }      
  };


})(jQuery);
