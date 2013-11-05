
 $(document).ready(function () {
	
	/*******************************************************/
	// To include multiple monitoring stations, change the following arrays. 
	// e.g. 
	//		var uptimeHostArray = ['monitoringStation1', 'monitoringStation1'];
	//		var uptimeUserArray = ['user1', 'user2'];
	//
	//			....and so on...
	
	// Monitoring Station Host 
	var uptimeHostArray = ['localhost'];
	// Username used to login
	var uptimeUserArray = ['admin'];
	// Password used to login
	var uptimePassArray = ['admin'];
	// API Port, default 9997
	var uptimeAPIPortArray = [9997];
	// API Version
	var uptimeVerArray = ['v1'];
	// Whether SSL is enabled.  true by default
	var uptimeSSLArray = [true];
	// Monitoring station's HTTP port
	var uptimeHTTPPortArray = [9999];
	/*******************************************************/
	
	var graphWidth = "550px";
	var graphHeight = "30px";

	showDashboard();
	ref = setInterval(showDashboard,  parseFloat( $(".refreshInterval").val() ) * 60 * 1000);

	$(".refreshInterval").change(function() {    
		var interval = parseFloat( $(this).val() ) * 60 * 1000;
		clearInterval(ref);
		console.log("New Interval: " + interval);
		if (interval > 0) {
			ref = setInterval(showDashboard, interval)     
		}
	});

	function showDashboard() {
		
		var uptimeAPIArray = new Array();
		
		// Update Refresh Time
		var currentTime = new Date();
		stringTime = getDateString(currentTime);
		$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);
		
		// Update the alert able in the background
		setTimeout(function() {
			oTable = initializeAlertTable("#recentStatusTable");
			for(i=0; i < uptimeHostArray.length; i++) {
				uptimeAPIArray[i] = new uptimeApi(uptimeUserArray[i], uptimePassArray[i], uptimeHostArray[i], uptimeAPIPortArray[i], uptimeVerArray[i], uptimeSSLArray[i]);
				getRecentMonitorStatus(uptimeAPIArray[i],uptimeHostArray[i],uptimeHTTPPortArray[i],"",oTable);
			}
		},0);
		
		
		$("#groups").slideUp('slow',0,function(){
			$("#groups").empty();
			$("#groups").hide().fadeIn('slow');
			getSmartGroups(uptimeAPIArray,uptimeHostArray,uptimeHTTPPortArray);
			
		});
	}
	
	
	function getTime() {
	
		var currentTime = new Date();
		var hours = currentTime.getHours();
		var minutes = currentTime.getMinutes();
		var seconds = currentTime.getSeconds();
		var day = currentTime.getDay();
		var month = currentTime.getMonth() + 1;
		var year = currentTime.getFullYear();

		if (minutes < 10)
		minutes = "0" + minutes

		var suffix = "AM";
		if (hours >= 12) {
			suffix = "PM";
			hours = hours - 12;
		}
		if (hours == 0) {
			hours = 12;
		}
		return month + "/" + day + "/" + year + "  " + hours + ":" + minutes + ":" + seconds + " " + suffix;
	}
	


	
	function displaySystemTypeAndStatus(groupId,typeName,OKCount,WARNCount,CRITCount,UNKNOWNCount, MAINTCount, index,elementId,elementName,uptime_host,uptime_http_port) {
	
		var totalCount = OKCount + WARNCount + CRITCount + UNKNOWNCount + MAINTCount;
		var pctOK = OKCount / totalCount;
		var pctWARN = WARNCount / totalCount;
		var pctCRIT = CRITCount / totalCount;
		var pctUNKNOWN = UNKNOWNCount / totalCount;
		var pctMAINT = MAINTCount / totalCount;
		
		var chartHeight=parseInt(graphWidth)-offset;
		
		if($(".graph#statusBarGraph"+groupId+"--"+typeName).length == 0) {
			
			var newGraphId = "";
			if($(".groupName#"+groupId+" .graph").length) {
				newGraphId = "";
				$(".groupName#"+groupId+" .graph").each(function() {
					var graphId = $(this).attr('id');
					
					// Find where we should insert the graph: before newGraphId 
					if (typeName > graphId.substr(graphId.indexOf("--")+2)) {
						return;
					}
					else {
						newGraphId = graphId.substr(graphId.indexOf("--")+2);
					}
				
				});
			}
			
			if (newGraphId == "") {
				$("div#groups div.groupName#"+groupId+" ul").append("<li><div class='graph' id='statusBarGraph"+groupId+"--"+typeName+"' style=\"width:"+graphWidth+"; height:"+graphHeight+";\"></div></li>");
			} else {
				$("<li><div class='graph' id='statusBarGraph"+groupId+"--"+typeName+"' style=\"width:"+graphWidth+"; height:"+graphHeight+";\"></div></li>").insertBefore($(".graph#statusBarGraph"+groupId+"--"+newGraphId).closest("li"));
			}
			
			displayStackedChart("statusBarGraph"+groupId+"--"+typeName);
		}
		
		addData("statusBarGraph"+groupId+"--"+typeName, {"id":typeName,"OK":pctOK*chartHeight, "Warning":pctWARN*chartHeight, "Critical":pctCRIT*chartHeight, "Unknown":pctUNKNOWN*chartHeight, "Maintenance":pctMAINT*chartHeight}, [UNKNOWNCount,MAINTCount,CRITCount,WARNCount,OKCount],index,elementId,elementName,uptime_host,uptime_http_port);
	}
	
	
	
	function getSmartGroups(uptimeApi, uptime_host,uptime_http_port) {
		// This defines which severity is the highest.  Higher the #, more severe it is.
		var convertSevToNum = { "OK" : 1, "WARN": 3, "CRIT": 4, "UNKNOWN": 2, "MAINT" : 0};
		
		var convertSevToNumAllStatus = { "OK" : 2, "WARN": 3, "CRIT": 4, "UNKNOWN": 1, "MAINT" : 0};
		
		// Order of how the severities are displayed, from left to right
		var convertSevPositionToNum = { "OK" : 4, "WARN": 3, "CRIT": 2, "MAINT": 1, "UNKNOWN": 0};
		
		var uptimeInfoArray = new Array();
		var uptimeAPIMSArray = new Array();
		var uptimeHostsArray = new Array();
		var uptimePortsArray = new Array();
		var groupNames = new Array();
		var tmpAPI;
		var tmpHost;
		var tmpPort;
		var ms;
		
		// Add title bar
		if ($(".TitleBar#SmartGroup").length == 0) {
			$("div#groups").append("<div class='TitleBar' id='SmartGroup'>Smart Groups</div>");
		}
		
		if (!(uptimeApi instanceof Array)) {
			uptimeInfoArray[0] = {api:uptimeApi, host:uptime_host, port:uptime_http_port}
			uptimeAPIMSArray[0] = uptimeApi;
			uptimeHostsArray[0] = uptime_host;
			uptimePortsArray[0] = uptime_http_port;
			
		} else {
			for(i=0; i < uptimeApi.length; i++) {
				uptimeInfoArray[i] = {api:uptimeApi[i], host:uptime_host[i], port:uptime_http_port[i]}
			}
			uptimeAPIMSArray = uptimeApi;
			uptimeHostsArray = uptime_host;
			uptimePortsArray = uptime_http_port;
			
		}
		
		for(ms=0; ms < uptimeAPIMSArray.length; ms++) {
			uptimeAPIMSArray[ms].getGroups("",function(allGroups) {
			
				for(i=0; i < allGroups.length; i++) {
					if((!$(".groupName#"+allGroups[i].name.replace(/ /g,"_")).length) && (allGroups[i].elements.length != 0)) {
						$("div#groups").append("<div class='groupName' id="+allGroups[i].name.replace(/ /g,"_")+">"+allGroups[i].name+"<ul></ul></div>").children(':last').hide().slideDown(300);
						groupNames.push({id:allGroups[i].id, name:allGroups[i].name.replace(/ /g,"_")});
					}
				}
			}); // End of get all groups
		}
		
		// Get all monitored elements
		var elementId = new Array(5);
		var elementName = new Array(5);
		var elementMS = new Array(5);
		var elementPort = new Array(5);
		for(x=0; x < 5; x++) {
			// Declaring 2nd dimension
			elementId[x] = new Array();
			elementName[x] = new Array();
			elementMS[x] = new Array();
			elementPort[x] = new Array();
			// Declaring/initializing the first item in the 3D array
			elementId[x][0] = new Array();
			elementName[x][0] = new Array();
			elementMS[x][0] = new Array();
			elementPort[x][0] = new Array();
		}
		
		var systemTypes = new Array(Object());
		
		$.each(uptimeInfoArray, function(infoIndex, uptimeInfo) {
			tmpAPI=uptimeInfo.api;
			tmpHost=uptimeInfo.host;
			tmpPort=uptimeInfo.port;

			tmpAPI.getElements("isMonitored=true",function(allElements) {

				var foundMatch = false;
				var firstRun = true;
				
				for(i=0; i<groupNames.length; i++) {
					if(groupNames[i].id == allElements[0].groupId) {
						currentGroupName = groupNames[i].name.replace(/ /g,"_");
						break;
					}
				}
				
				// Initialization
				if(typeof systemTypes[0] == "undefined") {
					systemTypes[0] = {type:allElements[0].typeSubtypeName.replace(/ /g,"_"), groupName:currentGroupName, MAINTCount:0, UNKNOWNCount:0, CRITCount:0, WARNCount:0, OKCount:0 };
				}

				
				// Loop through all elements
				$.each(allElements, function(index,element) {

					// Resetting variables
					foundMatch = false;
					var typeIndex = 0;
					var highestSev = "OK";
					
					// Group elements based on type (e.g. Windows, Linux) and the group ID
					for (i=0;i<systemTypes.length;i++) {
					
						for(k=0; k < groupNames.length; k++) {
							if(groupNames[k].id == element.groupId) {
								currentGroupName = groupNames[k].name.replace(/ /g,"_");
								break;
							}
						}
						
						if (systemTypes[i].type == element.typeSubtypeName.replace(/ /g,"_") && systemTypes[i].groupName == currentGroupName) {
							foundMatch = true;
							typeIndex = i;
							break;
						}
					}
					
					// If the element does not belong to an existing group, create a new item in the array & initialize the tooltip variables
					if (foundMatch == false) {
						for(k=0; k < groupNames.length; k++) {
							if(groupNames[k].id == element.groupId) {
								currentGroupName = groupNames[k].name.replace(/ /g,"_");
								break;
							}
						}
						
						systemTypes.push({type:element.typeSubtypeName.replace(/ /g,"_"), groupName: currentGroupName, OKCount:0, WARNCount:0, CRITCount:0, UNKNOWNCount:0, MAINTCount:0});
						typeIndex=systemTypes.length-1;
						for(y=0; y<elementId.length; y++) {
							elementId[y][typeIndex] = new Array ();
							elementName[y][typeIndex] = new Array ();
							elementMS[y][typeIndex] = new Array ();
							elementPort[y][typeIndex] = new Array ();
						}
					}

					tmpAPI.getElementStatus(element.id, function(elementStatus) {
						highestSev = "OK";
						// Loop through all the monitors 
						for(i=0; i<elementStatus.monitorStatus.length; i++) {
							if(elementStatus.monitorStatus[i].isMonitored && !elementStatus.monitorStatus[i].isHidden) {
								if (convertSevToNum[highestSev] < convertSevToNum[elementStatus.monitorStatus[i].status]) {
									highestSev = elementStatus.monitorStatus[i].status;
								}
							}
						}
						
						// Store the element name and ID for tooltips
						elementId[convertSevPositionToNum[highestSev]][typeIndex].push(element.id);
						elementName[convertSevPositionToNum[highestSev]][typeIndex].push(element.name);
						elementMS[convertSevPositionToNum[highestSev]][typeIndex].push(uptimeInfo.host);
						elementPort[convertSevPositionToNum[highestSev]][typeIndex].push(uptimeInfo.port);
						
						// Increment the severity/server count depending on the highest severity
						switch (highestSev) 
						{
						case "OK":
							systemTypes[typeIndex].OKCount++;
							break;
						case "WARN":
							systemTypes[typeIndex].WARNCount++;
							break;
						case "CRIT":
							systemTypes[typeIndex].CRITCount++;
							break;
						case "UNKNOWN":
							systemTypes[typeIndex].UNKNOWNCount++;
							break;
						case "MAINT":
							systemTypes[typeIndex].MAINTCount++;
							break;
						} //end of switch
						
						displaySystemTypeAndStatus(systemTypes[typeIndex].groupName,systemTypes[typeIndex].type,systemTypes[typeIndex].OKCount,systemTypes[typeIndex].WARNCount,systemTypes[typeIndex].CRITCount,systemTypes[typeIndex].UNKNOWNCount,systemTypes[typeIndex].MAINTCount, typeIndex,elementId,elementName,elementMS,elementPort);
						
					}); // end of looping through elements
				});
			}); // looping thru all monitoring stations
		});
	}
	
	
	function getDateString(inputDate) {
		var returnString = new Array();
		
		if (parseInt(inputDate.getMonth()+1) < 10) {
			stringMonth = "0"+parseInt(inputDate.getMonth()+1);
		} else stringMonth = inputDate.getMonth()+1;
		if (inputDate.getDate() < 10) {
			stringDate = "0"+inputDate.getDate();
		} else stringDate = inputDate.getDate();
		if (inputDate.getHours() < 10) {
			stringHour = "0"+inputDate.getHours();
		} else stringHour = inputDate.getHours();
		if (inputDate.getMinutes() < 10) {
			stringMinute = "0"+inputDate.getMinutes();
		} else stringMinute = inputDate.getMinutes();
		if (inputDate.getSeconds() < 10) {
			stringSecond = "0"+inputDate.getSeconds();
		} else stringSecond = inputDate.getSeconds();
		
		return [stringMonth, stringDate, stringHour, stringMinute, stringSecond]
		
	}
	
	
	function getRecentMonitorStatus(uptimeApi,uptime_host,uptime_http_port,beforeThisTime,oTable) {
		
		var allStatuses = new Array();
		var convertSevToNumAllStatus = { "OK" : 2, "WARN": 3, "CRIT": 4, "UNKNOWN": 1, "MAINT" : 0};
				
		uptimeApi.getElements("", function(allElements) {
			$.each(allElements, function(index,element) {
				
				
				if (element.isMonitored) {
				
					uptimeApi.getElementStatus(element.id, function(elementStatus) {
					
						for(i=0; i<elementStatus.monitorStatus.length; i++) {

							if(!elementStatus.monitorStatus[i].isHidden && elementStatus.monitorStatus[i].isMonitored) {
								date=elementStatus.monitorStatus[i].lastTransitionTime.split("-");
								year = date[0];
								month = Number(date[1]);
								
								day = date[2].slice(0,2);
								tmp = date[2].split("T");
								time = tmp[1].split(":");
								hour = time[0];
								minute = time[1];
								second = time[2];
								lastTransTime = new Date(year,month-1,day,hour,minute,second);
								
								if  (lastTransTime > beforeThisTime) {
									allStatuses.push({
										name: elementStatus.name,
										status: elementStatus.monitorStatus[i].status,
										message: elementStatus.monitorStatus[i].message,
										lastTrans: lastTransTime,
										monitorName: elementStatus.monitorStatus[i].name
									});
									if (elementStatus.monitorStatus[i].message == "") {
										var monitorMessage = "Unknown";
									} else {
										var monitorMessage = elementStatus.monitorStatus[i].message;
									}
									
									var data = oTable.fnGetData();
									var dataAlreadyExists = false;
									var dataIndexNeedsUpdate = -1;

									// Check if and where we need to update
									for(j=0; j < data.length; j++) {
										if (data[j].toString().indexOf(uptime_host+"_"+elementStatus.monitorStatus[i].id) != -1) {
											dataIndexNeedsUpdate = j;
											break;
										}
									}

									// Add div class to allow CSS
									var oSettings = oTable.fnSettings();
									var dateString = getDateString(lastTransTime);
									
									if (dataIndexNeedsUpdate == -1) {

										// Adding a Row
										var row = $('#recentStatusTable').dataTable().fnAddData( [
											uptime_host+"_"+elementStatus.monitorStatus[i].id,
											
											lastTransTime.getFullYear()+"-"+dateString[0]+"-"+dateString[1]+" "+dateString[2]+":"+dateString[3]+":"+dateString[4],
											
											"<a href=\"http://"+uptime_host+":"+uptime_http_port+"/main.php?section=Profile&id="+elementStatus.id+"&name="+elementStatus.name+"&displaytab=2\">"+elementStatus.name+"</a>",
											
											elementStatus.monitorStatus[i].status,
											elementStatus.monitorStatus[i].name,
											monitorMessage
										] );
										
										var n = oSettings.aoData[ row[0] ].nTr;
										
										// Animate/slow down row inserts
										$(n).hide();
										$(n).fadeIn(700);
										
										if (elementStatus.monitorStatus[i].status == "OK"){
											n.cells.item(2).className = "OK";
										} else if (elementStatus.monitorStatus[i].status == "CRIT"){
											n.cells.item(2).className = "Critical";
										} else {
											n.cells.item(2).className = elementStatus.monitorStatus[i].status.charAt(0).toUpperCase() + elementStatus.monitorStatus[i].status.slice(1).toLowerCase();
										}
									
									} else {
										// If existing row's date is not the same as current date, update the row
										if( data[dataIndexNeedsUpdate][1] != lastTransTime.toString()) {
											returnCode = oTable.fnUpdate([
												uptime_host+"_"+elementStatus.monitorStatus[i].id,
												lastTransTime.getFullYear()+"-"+dateString[0]+"-"+dateString[1]+" "+dateString[2]+":"+dateString[3]+":"+dateString[4],
												"<a href=\"http://"+uptime_host+":"+uptime_http_port+"/main.php?section=Profile&id="+elementStatus.id+"&name="+elementStatus.name+"&displaytab=2\">"+elementStatus.name+"</a>",
												elementStatus.monitorStatus[i].status,
												elementStatus.monitorStatus[i].name,
												monitorMessage
											],dataIndexNeedsUpdate);
											var n = oSettings.aoData[ dataIndexNeedsUpdate ].nTr;
											
											if (elementStatus.monitorStatus[i].status == "OK"){
												n.cells.item(2).className = "OK";
											} else if (elementStatus.monitorStatus[i].status == "CRIT"){
												n.cells.item(2).className = "Critical";
											} else {
												n.cells.item(2).className = elementStatus.monitorStatus[i].status.charAt(0).toUpperCase() + elementStatus.monitorStatus[i].status.slice(1).toLowerCase();
											}
										}
									}
								}
			
							}
						}
						
						allStatuses.sort(function(a,b) { 
							if (convertSevToNumAllStatus[b.status] != convertSevToNumAllStatus[a.status]){
								if (convertSevToNumAllStatus[b.status] < convertSevToNumAllStatus[a.status]) return -1;
								else if (convertSevToNumAllStatus[b.status] > convertSevToNumAllStatus[a.status]) return 1;
								else return 0;
							}
							return b.lastTrans - a.lastTrans
						});
					});
				}
			});
		});
	}
	
	
	function initializeAlertTable(tableString) {
	
		// Add title bar
		if ($(".TitleBar#RecentStatus").length == 0) {
			$("div#recentStatusTitle").append("<div class='TitleBar' id='RecentStatus'>Monitor Status</div>").hide().fadeIn('slow');
		}
		
		// Define custom sort on severity
		jQuery.extend( jQuery.fn.dataTableExt.oSort, {
			"enum-pre": function ( a ) {
				// Add / alter the switch statement below to match your enum list
				switch( a ) {
					case "CRIT":   return 1;
					case "WARN": return 2;
					case "OK":    return 3;
					case "UNKNOWN":    return 4;
					case "MAINT":    return 5;
					default:       return 5;
				}
			},
			"enum-asc": function ( a, b ) {
				return ((a < b) ? -1 : ((a > b) ? 1 : 0));
			},
			"enum-desc": function ( a, b ) {
				return ((a < b) ? 1 : ((a > b) ? -1 : 0));
			}
		} );
		
		// Initialize table if it's not initialized
		var table = $.fn.dataTable.fnTables(true);
		if ( !table.length > 0 ) {
			var oTable = $(tableString).dataTable({
				"aoColumnDefs": [ {"sTitle": "ID", "bVisible": false, "bSearchable": false, "aTargets":[0]}, 
									{"sTitle": "Time", "aTargets":[1], "sWidth": "130px"},
									{"sTitle": "Host", "aTargets":[2]},
									{"sTitle": "Status", "aTargets":[3], "sType": "enum", "sWidth": "60px"},
									{"sTitle": "Monitor", "aTargets":[4]},
									{"sTitle": "Monitor Info", "aTargets":[5]}
								],
				"aaSorting": [[ 1, "desc" ]],
				"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
					$(nRow).attr('id', aData[0]);
					return nRow;
				},
				"iDisplayLength": 25,
				"fnInitComplete": function(oSettings, json) {
					$(".dataTables_filter").append("<a class='resetFilter' href=#><img class='resetFilterIcon' src=images/close_icon.gif></a>");
				}
			});
			$(".resetFilter").click(function(e){
				oTable.fnFilter("");
			});
		} else {
			oTable = $(tableString).dataTable();
		}
		
		return oTable;
	}
	
	$('body').click(function(event) {
		if ($(event.target).is("input#clear")) {
			$("#groups").empty();
			$("#recentStatusTitle").empty();
			$("#lastRefresh").empty();
			
			var table = $.fn.dataTable.fnTables(true);
			if ( table.length > 0 ) {
				var oTable = $('#recentStatusTable').dataTable();
				oTable.fnDestroy();
				$("#recentStatusTable").empty();
			}
		}
		else if ($(event.target).is("input#test")) {
			
			uptime_api.getElements("groupId=6", function(allElements) {
				$.each(allElements,function(index,element) {
					$("div#monitors").append("<ul><li>"+element.name+"</li><ul>");
				});
			
			});
			
		}
		else if ($(event.target).is("input#listGroups")) {
			// Update Refresh Time
			var currentTime = new Date();
			stringTime = getDateString(currentTime);
			$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);
			
			uptime_api = new uptimeApi(uptime_user, uptime_pass, uptime_host, uptime_api_port, uptime_ver, uptime_ssl);
			getSmartGroups(uptime_api,uptime_host,uptime_http_port);
		} //End of clicking on Groups
		
		
		else if ($(event.target).is("input#recentStatus")) {
		
			
			oTable = initializeAlertTable("#recentStatusTable");
			
			// Update Refresh Time
			var currentTime = new Date();
			stringTime = getDateString(currentTime);
			$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);

			// Get an instance of the API
			uptime_api = new uptimeApi(uptime_user, uptime_pass, uptime_host, uptime_api_port, uptime_ver, uptime_ssl);
			// We can filter based on time.  For now, just passing a date way before current time to get all alerts
			//beforeDate = new Date(1012,9,1,1,1,1);
			getRecentMonitorStatus(uptime_api,uptime_host,uptime_http_port,"",oTable);
			
			
		}
		else if ($(event.target).is("input#groupsAndStatus")) {
			
			// Update Refresh Time
			var currentTime = new Date();
			stringTime = getDateString(currentTime);
			$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);
			
			
			//$("#groups").empty();
			$("#groups").fadeOut('slow',0,function(){ 
			
				$("#groups").empty();
				
				$("#groups").hide().fadeIn('slow');
				uptime_api1 = new uptimeApi(uptime_user, uptime_pass, uptime_host, uptime_api_port, uptime_ver, uptime_ssl);
				uptime_api2 = new uptimeApi(uptime_user, uptime_pass, "test_ms", uptime_api_port, uptime_ver, uptime_ssl);
				getSmartGroups([uptime_api1, uptime_api2],[uptime_host,"test_ms"],[uptime_http_port,uptime_http_port]);
				
				oTable = initializeAlertTable("#recentStatusTable");
				getRecentMonitorStatus(uptime_api1,uptime_host,uptime_http_port,"",oTable);
				
				oTable = initializeAlertTable("#recentStatusTable");
				getRecentMonitorStatus(uptime_api2,"test_ms",uptime_http_port,"",oTable);
				
			});
		}
		
	}); //End of click event
	
	
	
});
			
			
			
			
			