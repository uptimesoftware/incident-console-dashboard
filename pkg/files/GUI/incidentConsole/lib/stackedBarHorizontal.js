/*
	Based on En J Christensen's Dynamic Stacked Bar Chart example:
	http://benjchristensen.com/2011/12/16/dynamic-stacked-bar-chart-using-d3-js/

*/

	// capture the height/width defined in the div so we only have it defined in one place
	function chartHeight(chartId) {
		return parseInt(document.getElementById(chartId).style.height);
	}
	function chartWidth(chartId) {
		return parseInt(document.getElementById(chartId).style.width);
	}

	// TODO we need a ceiling value
	var ceiling = 550;
	// Y scale will fit values from 0-10 within pixels 0 - height
	var x;
	
	// How many pixels away from the left the bar to start the label text
	var offset=180;
	
	function getX(chartId) {
		return d3.scale.linear().domain([0, ceiling]).range([0, chartWidth(chartId)]);
	}

	/**
	* Create an empty shell of a chart that bars can be added to
	*/
	function displayStackedChart(chartId) {
		x = getX(chartId);
		// create an SVG element inside the div that fills 100% of the div
		var vis = d3.select("#" + chartId).append("svg:svg").attr("width", "100%").attr("height", "100%")
		// transform down to simulate making the origin bottom-left instead of top-left
		// we will then need to always make Y values negative
		.append("g").attr("class","barChart").attr("transform", "translate(" + chartWidth(chartId) + ",0)"); 
	}

	var propertyNames = ["Unknown", "Maintenance", "Critical", "Warning", "OK"];

	function filterAlert(event) {
		hostString = event.data.hostString;
		var oTable = $('#recentStatusTable').dataTable();
		if (oTable.length != 0) {
			oTable.fnFilter("");
			oTable.fnFilter("("+hostString.replace(/\,/g,"|").replace(/ /g,".*")+")",null,true);
		}

	}
	
	/**
	* Add or update a bar of data in the given chart
	*
	* The data object expects to have an 'id' property to identify itself (id == a single bar)
	* and have object properties with numerical values for each property in the 'propertyNames' array.
	*/
	function addData(chartId, data, actualCounts,groupId,elementId,elementName,uptime_host,uptime_http_port) {
		// if data already exists for this data ID, update it instead of adding it
		//var existingBarNode = document.querySelectorAll(".bar#" + chartId );
		var existingBarNode = $(".bar#" + chartId );
		
		if(existingBarNode.length > 0) {
			var existingBar = d3.select(existingBarNode[0]);
				
			// update the data on each data point defined by 'propertyNames'
			for(index in propertyNames) {
				existingBar.select("rect." + propertyNames[index])
					.transition().ease("linear").duration(300)
					.attr("x", barX(data, propertyNames[index],chartId)) 
					.attr("width", barHeight(data, propertyNames[index]));
					
				
				var tooltipString = actualCounts[index]+" elements is "+propertyNames[index];
				for (p=0;p<elementName[index][groupId].length;p++) {
					tooltipString = tooltipString + "<br><a href=\"http://"+uptime_host[index][groupId][p]+":"+uptime_http_port[index][groupId][p]+"/main.php?section=Profile&id="+elementId[index][groupId][p]+"&name="+elementName[index][groupId][p]+"&displaytab=2\">"+elementName[index][groupId][p]+"</a>";
				}

				$('.bar#'+chartId +' rect.'+propertyNames[index]).qtip('api').set('content.text',tooltipString);
				
				var hostString = elementName[index][groupId].toString();
				$('#'+chartId + ' rect.'+propertyNames[index]).off('click',filterAlert).on("click", {hostString: hostString}, filterAlert);
				
			}
		} else {
			// it's new data so add a bar
			var barDimensions = updateBarWidthsAndPlacement(chartId);

			// Find where we should add the new bar
			var newBarIndex = "";
			if ($("#" + chartId + " g.barChart g.bar").length) {
				$("#" + chartId + " g.barChart g.bar").each(function() {
					var barId = $(this).attr('id');
								
					if (data.id > barId.substr(barId.indexOf("_")+1)) {
						return;
					} else {
						newBarIndex = barId.substr(barId.indexOf("_")+1);
					}
				});
			}
			
			// Append or insert bar depending on the name of the system type (alphabetical sort)
			// Setting opacity to 0 initially so we can fade in
			var barGroup = d3.select("#" + chartId).selectAll("g.barChart")
				.append("g")
					.attr("class", "bar")
					.attr("id", chartId)
					.attr("opacity", "0");

			// now add each data point to the stack of this bar
			for(index in propertyNames) {
				barGroup.append("rect")
					.attr("class", propertyNames[index])
					.attr("height", (barDimensions.barWidth-1)) 
					.attr("y", function () { return (barDimensions.numBars-1) * barDimensions.barWidth;} )
					.attr("x", barX(data, propertyNames[index],chartId))
					.attr("width", barHeight(data, propertyNames[index]));
					
				// Build tooltip string
				var tooltipString = actualCounts[index]+" elements is "+propertyNames[index];
				tooltipString = tooltipString + "<br><a href=\"http://"+uptime_host[index][groupId]+":"+uptime_http_port[index][groupId]+"/main.php?section=Profile&id="+elementId[index][groupId]+"&name="+elementName[index][groupId]+"&displaytab=2\">"+elementName[index][groupId]+"</a>";
				
				var hostString = elementName[index][groupId].toString();
				
				$('#'+chartId + ' rect.'+propertyNames[index]).off('click',filterAlert).on("click", {hostString: hostString}, filterAlert);

				$('#'+chartId + ' rect.'+propertyNames[index]).qtip({
					content: {
						text: tooltipString
					},
					style: {
						classes: 'ui-tooltip-rounded',
						tip: {
							corner: true
						}
					},
					position: {
						my: 'top left',
						at: 'center',
						target: $('#'+chartId + ' rect.'+propertyNames[index])
					},
					show: {
						solo:true
					},
					hide: {
						event: 'unfocus'
					}
					
					
				});
			}

			// Add Label
			var barText = d3.select("#" + chartId).selectAll("g.barChart g#"+chartId)
				.append("text")
					.attr("x",-chartWidth(chartId))
					.attr("y",function () { return ((barDimensions.barWidth-1) * 2/ 3) +barDimensions.barWidth*(barDimensions.numBars-1);})
					.attr("fill","black");
			barText.text(data.id.replace(/_/g," "));
		}
		
		// Fade in the bar graph
		graph = d3.select(".bar#"+chartId);
		graph.transition().delay(300).duration(1000).attr("opacity", "1");
		
	}

	/**
	* Remove a bar of data in the given chart
	*
	* The data object expects to have an 'id' property to identify itself (id == a single bar)
	* and have object properties with numerical values for each property in the 'propertyNames' array.
	*/
	function removeData(chartId, barId) {		
		//var existingBarNode = document.querySelectorAll("#" + chartId);
		var existingBarNode = $("#" + chartId);
		if(existingBarNode.length > 0) {
			// bar exists so we'll remove it
			var barGroup = d3.select(existingBarNode.item());
			barGroup
				.transition().duration(200)
				.remove();
		}
	}

	/**
	* Update the bar widths and x positions based on the number of bars.
	* @returns {barWidth: X, numBars:Y}
	*/
	function updateBarWidthsAndPlacement(chartId) {
		/**
		* Since we dynamically add/remove bars we can't use data indexes but must determine how
		* many bars we have already in the graph to calculate x-axis placement
		*/
		//var numBars = document.querySelectorAll("#" + chartId + " g.bar").length + 1;
		var numBars = $("#" + chartId + " g.bar").length + 1;

		// determine what the width of all bars should be
		var barWidth = chartHeight(chartId)/numBars;
		if(barWidth > 50) {
			barWidth=50;
		}

		// reset the width and x position of each bar to fit
		//var barNodes = document.querySelectorAll(("#" + chartId + " g.barChart g.bar"));
		var barNodes = $("#" + chartId + " g.barChart g.bar");
		for(var i=0; i < barNodes.length; i++) {
			d3.select(barNodes.item(i)).selectAll("rect")
				//.transition().duration(10) // animation makes the display choppy, so leaving it out
				.attr("y", i * barWidth)
				.attr("height", (barWidth-1));
				
				// Update Label Position
				d3.select(barNodes.item(i)).selectAll("text")
					.attr("y",(((barWidth-1)*2/3) + barWidth * i));
		}

		return {"barWidth":barWidth, "numBars":numBars};
	}

	/*
	* Function to calculate the Y position of a bar
	*/
	function barX(data, propertyOfDataToDisplay, chartId) {
		/*
		* Determine the baseline by summing the previous values in the data array.
		* There may be a cleaner way of doing this with d3.layout.stack() but it
		* wasn't obvious how to do so while playing with it.
		*/
		var baseline = 0;
		for(var j=0; j < index; j++) {
			baseline = baseline + data[propertyNames[j]];
		}
		// make the y value negative 'height' instead of 0 due to origin moved to bottom-left
		x=getX(chartId);
		return -x(baseline + data[propertyOfDataToDisplay]);
	}

	/*
	* Function to calculate height of a bar
	*/
	function barHeight(data, propertyOfDataToDisplay) {
		//return data[propertyOfDataToDisplay];
		return data[propertyOfDataToDisplay];
	}

	// used to populate random data for testing
	function randomInt(magnitude) {
		return Math.floor(Math.random()*magnitude);
	}