// Electric Imp Agent code for being used with
// Evothings Elevator Remote Control mobile app.
// 
// The mobile app sends HTTP requests to the agent URL (presented by the
// Electric Imp IDE) which will be forwarded to the Electric Imp device.
// The device will reply to the agent, which forwards the reply back to
// the app.

function requestHandler(request, response)
{

    // Allow function on_reply_from_device to give reply to this request.
    gResponse <- response;

    // Make sure the request query string contains a command parameter.
    if ("command" in request.query)
    {
        // Send any 'unlock' command to the device.
        if (request.query.command == "unlock")
        {
            device.send("command", "unlock");
        }
        // Send any 'call' command to the device.
        else if (request.query.command == "call")
        {
            device.send("command", "call");
        }
        else
        {
            response.send(200, "Unknown command, it can be either 'unlock'" +
                " or 'call'.");
        }
    }
    else
    {
        response.send(200, "Missing command parameter in query string.");
    }

}

function on_reply_from_device(message)
{
    // Let the app know that we allow requests from anywhere.
    gResponse.header("Access-Control-Allow-Origin", "*");
    
    // Send a reply back to the app.
    gResponse.send(200, message);
    
    // Display a message in the Electric Imp IDE console.
    server.log(message);
}
 
// Register handler for HTTP requests made to this agent.
http.onrequest(requestHandler);

// Register handler for messages received from device.
device.on("reply", on_reply_from_device);
