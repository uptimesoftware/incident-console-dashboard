var uptime_url_host = 'https://win-dleith.rd.local:9997/api/v1';
	var uptime_host = '';
	var uptime_user = 'admin';
	var uptime_password = 'admin';
	
function getSingleData(APICall,filter,callback) {
		var load_url = uptime_url_host + APICall;
		var returnData = new Object();
		
		if (!filter || filter == "") {
			$.ajax( {
				url: load_url,
				dataType: 'json',
				cache: false,
				username : uptime_user,
				password : uptime_password,
				success: function( alldata ) {
					//console.log(alldata);
					callback(alldata);
				}
			});
		}
	}
	
	//APICall = '/monitors/'
	function getData(APICall,filter,callback) {
		var load_url = uptime_url_host + APICall;
		var returnData = new Array();
		
		if (!filter || filter == "") {
			$.ajax( {
				url: load_url,
				dataType: 'json',
				cache: false,
				username : uptime_user,
				password : uptime_password,
				success: function( alldata ) {
					$.each(alldata,function(j,specificData) {
						returnData.push(specificData);
					});
					console.log(returnData);
					callback(returnData);
				}
			});
		}
		else {
			var moreThanOneCriteria = filter.search("&");
			if (moreThanOneCriteria != -1) {
				var filterArray = filter.split("&");
			} else {
				var filterArray = new Array();
				filterArray.push(filter);
			}
			var field = new Array();
			var value = new Array();
			var tmpArray = new Array();
		
			// Parse through the filters
			for (i=0; i < filterArray.length; i++) {
				tmpArray = filterArray[i].split("=");
				field[i] = tmpArray[0];
				value[i] = tmpArray[1];
					

			}
			$.ajax( {
				url: load_url,
				dataType: 'json',
				cache: false,
				username : uptime_user,
				password : uptime_password,
				success: function( data ) {
					$.each(data,function(j,data) {
						var meetCriteria = false;
						for (i=0; i < filterArray.length; i++) {
							if (data[field[i]].toString() == value[i].toString()) {
								meetCriteria = true;
							} else {
								meetCriteria = false;
								break;
							}
						}
						if (meetCriteria == true) {
							returnData.push(data);
						}
					});
					callback(returnData);
				}
			});
		}
	
	}
	
	function getMonitors(filter,callback) {
		getData('/monitors/',filter,callback);
	}
	
	function getGroups(filter,callback) {
		getData('/groups/',filter,callback);
	}
	
	function getElements(filter,callback) {
		getData('/elements/',filter,callback);
	}
	
	function getElementStatus(id,filter,callback) {
		getSingleData('/elements/'+id+'/status/',filter,callback);
	}