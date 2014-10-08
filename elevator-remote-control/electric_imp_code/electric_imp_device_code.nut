// Electric Imp Device code for being used with
// Evothings Elevator Remote Control mobile app.
//
// Certain messages received from the agent will make I/O pins on the
// Electric Imp to momentarily be turned on, which can be used to
// control a relay that acts as a switch.

function on_command(command)
{
    if (command == "unlock")
    {
        // Press the unlock button (activate relay).
        hardware.pin1.write(1);
        
        // Keep it held for a short moment...
        imp.sleep(0.1);
        
        // Release the unlock button (deactivate relay).
        hardware.pin1.write(0);
    
        // Send a reply back to the agent.
        agent.send("reply", "Elevator door was unlocked.");
    }
    else if (command == "call")
    {
        // Press the call button (activate relay).
        hardware.pin2.write(1);
        
        // Keep it held for a short moment...
        imp.sleep(0.1);
        
        // Release the call button (deactivate relay).
        hardware.pin2.write(0);
    
        // Send a reply back to the agent.
        agent.send("reply", "Elevator was called.");
    }
}

// Configure pins 1,2 to be able to be either on or off.
hardware.pin1.configure(DIGITAL_OUT);
hardware.pin2.configure(DIGITAL_OUT);

// Register handler for messages received from agent.
agent.on("command", on_command);
