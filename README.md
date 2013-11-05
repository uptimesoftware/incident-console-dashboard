# Incident Console Dashboard
## Tags : plugin   incident  

## Category: dashboard

### Description: 

 This dashboard allows users to visualize how many elements are current in the various states. Features include:

 * aggregated view of elements and alerts from one or more monitoring stations
 * smart grouping of elements based on the element's type
 * view the elements that make up of the smart group by mouse hover
 * easily access an element's status page by clicking on links in the tooltip
 * instantly filter alerts in the monitor status table by clicking on the bar

### Supported Monitoring Stations: 7.2, 7.1
### Supported Agents: None; no agent required
### Installation Notes:  
 [Install using the up.time Plugin Manager](https://github.com/uptimesoftware/plugin-manager-for-uptime)
 The up.time Controller is needed for this dashboard. Please read this example on how to configure it.

 After the Plugin Manager finishes installing the dashboard, execute the following steps to add a tab in up.time:

 1. On the system where up.time is installed, open the following file for edit:

 [up.time_root_dir]/GUI/incidentConsole/lib/main.js

 2. At the top of the file, change/add the values of the variables so that the dashboard can connect to the up.time API.
 NOTE: currently the password cannot contain special characters. If your password contains special characters, either change the password or setup a read-only user that does not have special characters in the password.

 3. Verify if the dashboard works by going to the following URL in a browser:

 http://[up.time_host]:[up.time_port]/incidentConsole

 4. Login to the monitoring station UI

 5. Click on the "Config" button at the top

 6. Click on "up.time Configuration" on the left

 7. Paste the following into the configuration text box:

 myportal.custom.tab2.enabled=true
 myportal.custom.tab2.name=Incidents
 myportal.custom.tab2.URL=/incidentConsole/

 Depending on how many custom tabs you already have in My Portal, you might need to change "tab2" to an appropriate value.

 8. Click the "Update" button

 9. You should now see a new tab in My Portal

 Note:
 IE sometimes goes into quirks mode which cause the dashboard to fail. Either force IE to disable quirks mode or use another browser such as Google Chrome.


### Dependencies: <p>n/a</p>

### Languages Used: 
* PHP
* Others

