# Load Balancer Proxy

The Load Balancer or Proxy will be a RESTful HTTP(s) server which will field implement the standard RESTful functions. 
This server will forward these requests to the appropriate Cache Server based on some balancing scheme we will develop. The Load Balancer Server will be implemented in NodeJS. All responses to /data and /server will return in a JSON format.  

This API table is modeled after the framework detailed here: https://en.wikipedia.org/wiki/Representational_state_transfer#Example. 

| URI | GET | PUT | POST | DELETE |
|-----|-----|-----|------|--------|
| /, /index | Serve the Client Application | Not Supported | Not Supported | Not Supported |
| /app/<resource> | Support space for Client Application | Not Supported | Not Supported | Not Supported |
| /data | List details about the Load Balancer Server's data service and all URIs available. | Not Supported | Not Supported | Not Supported |
| /data/<key> | Retrieve <value> for <key> from the system. | Store or replace <key> and its <value> in the system. | Not Supported | Delete <key> and its <value> from the system. |
| /server | Lists all available Cache server and their status | Not Supported | Register a new Cache Server. | Delete all Cache Servers. |
| /server/<id> | List details about Cache Server <id>. | Replace an existing Cache Server <id>. | Not Supported | Delete Cache Server <id>. |
