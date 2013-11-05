Incident Console
----------------
This dashboard allows users to visualize how many elements are current in the various states.  Features include:

* aggregated view of elements and alerts from one or more monitoring stations
* smart grouping of elements based on the element's type
* view the elements that make up of the smart group by mouse hover
* easily access an element's status page by clicking on links in the tooltip
* instantly filter alerts in the monitor status table by clicking on the bar 


Requirements
------------
* PHP libCurl


Installation Instructions
-------------------------
After the [Plugin Manager](http://support.uptimesoftware.com/the-grid/plugin-manager.php) finishes installing the dashboard, execute the following steps to add a tab in up.time:

1\. On the system where up.time is installed, open the following file for edit:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[up.time\_root\_dir]/GUI/incidentConsole/lib/main.js

2\. At the top of the file, change the values of the variables so that the dashboard can connect to the up.time API.  The following are the variables:

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

3\. Verify if the dashboard works by going to the following URL in a browser:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;http://[up.time\_host]:[up.time\_port]/incidentConsole

4\. Login to the monitoring station UI

5\. Click on the "Config" button at the top

6\. Click on "up.time Configuration" on the left

7\. Paste the following into the configuration text box:
    
    myportal.custom.tab2.enabled=true
    myportal.custom.tab2.name=Incidents
    myportal.custom.tab2.URL=/incidentConsole/


Depending on how many custom tabs you already have in My Portal, you might need to change "tab2" to an appropriate value.

8\. Click the "Update" button

9\. You should now see a new tab in My Portal



*Note:* IE sometimes goes into quirks mode which cause the dashboard to fail.  Either force IE to disable quirks mode or use another browser such as Google Chrome.
