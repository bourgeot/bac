(function ($) {
  Drupal.behaviors.bacCalculator = {
    attach: function (context) {
      $('#buzz-o-graphic').once('bac-graph', Drupal.bacInitialize);
      $('#weight-control').once('bac-controls', Drupal.bacWeightControl);
      $('#control-controls').once('bac-controls', Drupal.bacControlControl);
      $('#control-controls select').each( function () {
          $(this).once('bac-controls', Drupal.bacTimeSelect);
      });
      $('#drink-controls select').each( function() {
          $(this).once('bac-controls', Drupal.bacDrinkControl);
      });
    }
  };
  Drupal.bacWeightContol = function () {
    $("<div id='slider-weight'></div>").insertAfter( '#weight-control').slider({
      min: 80,
      max: 400,
      value: $( "#weight-control" ).val(),
      range: "min",
      slide: function( event, ui ) {
        $( "#weight-control" ).val(ui.value);
        //weight = ui.value;
        //recalculate();
      }
    });
    $( "#weight-control" ).val( $( "#slider-weight" ).slider( "value" ));
  };

  Drupal.bacDrinkControl = function() {
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
        //recalculate();
      }
    });
    $(this).change(function() {
        slider.slider("value", this.selectedIndex);
    });
    //$(this).val(slider.slider( "value" ));
  };

  Drupal.bacControlControl = function() {
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
        windowDataset();
        //recalculate();
      }
    });
  };
  Drupal.bacTimeSelect = function() {
    $(this).change(function() {
      if (this.name == 'start') {
        sliderControl.slider("values", 0, this.selectedIndex);
        if(this.selectedIndex > document.getElementById('end-time').selectedIndex) {
          document.getElementById('end-time').selectedIndex = this.selectedIndex;
          sliderControl.slider("values", 1, this.selectedIndex);
        }
      }
      else {
        sliderControl.slider("values", 1, this.selectedIndex);
        if(this.selectedIndex < document.getElementById('start-time').selectedIndex) {
          document.getElementById('start-time').selectedIndex = this.selectedIndex;
          sliderControl.slider("values", 0, this.selectedIndex);
        }
      }
      windowDataset();
    });
  };
  Drupal.bacInitialize = function () {
    //define the data
    var dataset = defineDataset();
    //console.log(dataset);
    var intervals = [];
    for (var i=0; i<dataset.length; i++) {
      intervals[i] = dataset[i].interval;
    }
    var margin = {top: 20, right: 10, bottom: 20, left: 50},
        width = 700 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom,
        w =  width + margin.left + margin.right,
        h = height + margin.top + margin.bottom;
    var x = d3.scale.ordinal().rangePoints([0, width], 1.0);
      x.domain(intervals);  //this is what will change.
    var y = d3.scale.linear().range([height, 0]);
      y.domain([0,0.5]);
    var xAxis = d3.svg.axis().scale(x)
      .orient("bottom").ticks(dataset.length);
    var yAxis = d3.svg.axis().scale(y)
      .orient("right").ticks(5);
    var bacLine = d3.svg.line()
      .x(function(d) { return x(d.interval); })
      .y(function(d) { return y(d.bac); });
    var svg = d3.select("#buzz-o-graphic").append("svg")
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
      .attr("d", bacLine(dataset));
      //initialize();
  }

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
  function windowDataset() {
  //change the  visible data based on the selected intervals
 } 

})(jQuery);
