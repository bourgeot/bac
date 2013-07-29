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

      /*test for json fortunes.
      $('<a id="ajax" href="#">Test</a>').insertAfter('body');
      $('<div id="yaa"></div>').insertAfter('body');
      $('#ajax').click(function (event) { event.preventDefault();
      $('#yaa').load('/fortune/json');
      });*/
      //define the axes and the data we are going to need later.
      var x,
        y,
        xAxis,
        yAxis,
        svg,
        area,
        peakColor = 'gray',
        fortune,
        fortunes = [],
        timeFormat = d3.time.format('%H'), //makes dates
        timeIntervals = [],
        bacLine;

      //define the data
      var dataset = defineDataset();
      //get the fortunes
      $.getJSON('/fortune/json', function(data) {
        fortunes = data;
      });

      //set up
      initialize();

      //define dataset and time intervals
      function defineDataset() {
        var datum,
          dataset = [];
        var intervals = document.getElementById('start-time').options;
        for(var i=0; i<intervals.length; i++) {
          datum=new Object();
            //datum.interval = intervals[i].text;
            timeIntervals[i] = timeFormat.parse((i+12).toString());
            datum.interval = timeIntervals[i];
            datum.interval = addMinutes(datum.interval, 55);
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
        //peak is the highest value.
        var peakTime,
          //peakColor = 'gray',
          peak = 0;
        for(var i=0; i<dataset.length; i++) {
          drinks = document.getElementById('drink-select-' + i).selectedIndex;
          if (i == 0) {
            dataset[i].bac = bac(weight, sex, drinks, 0);
          }
          else {
            dataset[i].bac = bac(weight, sex, drinks, dataset[i-1].bac);
          }
          document.getElementById('bac-' + i).textContent = Math.round(dataset[i].bac*1000)/1000;
          if(dataset[i].bac > peak) {
            peak = dataset[i].bac;
            peakTime = dataset[i].interval;
          }
        }
        //update fortune.
        $(fortunes).each(function(index) {
          if( this.min <= peak && this.max >= peak) {
            //add to the list of fortunes
            fortune = '<h4>' + this.title + '</h4><p>' + this.body + '</p>';
            $('#fortune').html(fortune);
            peakColor = this.color;
          }
        });
        //update the graph
        apply_transition(dataset);
        //var t = svg.transition().duration(300);
        //t.select('.bac-line').attr("d", bacLine(dataset));
        //t.select('.area').style('fill', peakColor).attr("d", area(dataset));


      }
      //utility function
      function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes*60000);
      }
      //function update
      function update(startIndex, endIndex) {
        //pass the index of the start select
        //pass the index of the end select
        //change xdomain accordingly
        var intervals = [],
          select,
          updateset = [],
          j = 0;
        for (var k=0; k<dataset.length; k++) {
          if (k<startIndex) {
            dataset[k].bac = 0;
            dataset[k].visible = false;
            //hide the drink counters and set them to zero
            $('#edit-controls-area-' + k).hide();
            select=document.getElementById('drink-select-' + k);
            select.selectedIndex = 0;
            $(select).change();
          }
          else if(k>endIndex) {
            dataset[k].visible = false;
            $('#edit-controls-area-' + k).hide();
            select = document.getElementById('drink-select-' + k);
            select.selectedIndex = 0;
            $(select).change();
          }
          else {
            dataset[k].visible = true;
            $('#edit-controls-area-' + k).show();
            updateset[j]=dataset[k];
            j++;
          }
        }
        recalculate();
        //x.domain([updateset[0].interval, updateset[updateset.length - 1].interval]);
        x.domain([timeIntervals[startIndex], timeIntervals[endIndex]]);
        //update the chart
        //var t = svg.transition().duration(300);
        //t.select('.x.axis').call(xAxis);
        //t.select('.bac-line').attr("d", bacLine(updateset));
        //t.select('.area').attr("d", area(updateset));
        apply_transition(updateset);
    }
      //initialize
      var xt;
      function initialize() {
        //hide the update button
        $('input.form-submit').hide();
        //console.log(dataset);
        var intervals = [];
        var format = d3.time.format('%I:%M %p');
        var indexFormat = d3.time.format('%H');
        for (var i=0; i<dataset.length; i++) {
          intervals[i] = dataset[i].interval;
        }
        var margin = {top: 20, left: 50, bottom: 20, right: 10},
            width = 700 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom,
            w =  width + margin.left + margin.right,
            h = height + margin.top + margin.bottom;
        x = d3.time.scale().range([0, width]);
        //x.domain([dataset[0].interval, dataset[dataset.length-1].interval]);
        x.domain([timeIntervals[0], timeIntervals[timeIntervals.length-1]]);        
        //x = d3.scale.linear().range([0, width], 1.0);
         // x.domain([0,dataset.length]);  //this is what will change.
        y = d3.scale.linear().range([height, 0]);
          y.domain([0,0.5]);
        xAxis = d3.svg.axis().scale(x).ticks(d3.time.hours, 1)
          .orient("bottom");
        yAxis = d3.svg.axis().scale(y)
          .orient("left").ticks(5);
        bacLine = d3.svg.line()
          .interpolate('monotone')
          .x(function(d) { return x(d.interval); })
          .y(function(d) { return y(d.bac); });
        area = d3.svg.area()
          .interpolate('monotone')
          .x(function(d) { return x(d.interval); })
          .y0(height)
          .y1(function(d) { return y(d.bac); });
        svg = d3.select("#buzz-o-graphic").append("svg")
          .attr("id", "bac-graph-container")
          //better to keep the viewBox dimensions with variables
          .attr("viewBox", "0 0 " + w + " " + h )
          .attr("preserveAspectRatio", "xMidYMid meet")
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ")");
        svg.append("g")         // Add the X Axis
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
        svg.append("g")         // Add the Y Axis
          .attr("class", "y axis")
          //.attr("transform", "translate(" + margin.left + ",0)")
          .call(yAxis);
        svg.append("path")      // Add the valueline path.
          .attr("class", "bac-line")
          .attr("clip-path", "url(#clip)")
          .attr("d", bacLine(dataset));
        svg.append("clipPath")
          .attr("id", "clip")  //add the clip path
          .append("rect")
            .attr("width", width)
            .attr("height", height);
        svg.append("path")  //add the area path
          .attr("class", "area")
          .attr("clip-path", "url(#clip)")
          .attr("d", area(dataset));
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
            //recalculate(); update has recalculate in it.
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
      function apply_transition(dataset) {
        var updateset = dataset;
        var anchor = [];
        var anchorPt = new Object;
          anchorPt.bac = 0;
          anchor.visible = true;
          anchorPt.interval = timeIntervals[document.getElementById('start-time').selectedIndex];
        anchor.push(anchorPt);
        var t = svg.transition().duration(300);
        t.select('.x.axis').call(xAxis);
        t.select('.bac-line').attr("d", bacLine(anchor.concat(updateset)));
        t.select('.area').style('fill', peakColor).attr("d", area(anchor.concat(updateset)));
      }

    }
  };


})(jQuery);
