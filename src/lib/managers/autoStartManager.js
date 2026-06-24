import path from "path";
import { runPowershell } from "../runPowershell";
import { STRING_METADATA } from "../strings";

/**
 * Uses Powershell to generate a scheduled task that starts the tray application
 */
const enableStartOnLaunch = () => {
  console.log("Enabling automatic start with Windows");
  let actionPath = path.normalize(__dirname + "/../auto-start-task.ps1");

  // NOTE: an AtLogon task with a *group* principal (e.g. BUILTIN\Administrators)
  // runs on-demand but does NOT auto-fire at interactive logon. We bind the
  // trigger + principal to the current user so it actually starts at login.
  // (Keep this command comment-free: runPowershell flattens it to one line.)
  let psCommand = `
        $name = "${STRING_METADATA.name}";
        $description = "Runs ${STRING_METADATA.friendlyname} app at login";
        $user = "$env:USERDOMAIN\\$env:USERNAME";
        $argument = '-ExecutionPolicy Bypass -WindowStyle Hidden -File "${actionPath}" -FFFeatureOff';
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argument;
        $trigger = New-ScheduledTaskTrigger -AtLogon -User $user;
        $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest;
        $settings = New-ScheduledTaskSettingsSet -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -DontStopOnIdleEnd -ExecutionTimeLimit 0;
        $task = New-ScheduledTask -Description $description -Action $action -Principal $principal -Trigger $trigger -Settings $settings;

        Unregister-ScheduledTask -TaskName $name -Confirm:$false;
        Register-ScheduledTask $name -InputObject $task;
    `;

  runPowershell({
    stdout: false,
    commands: [psCommand],
    callback: () => {},
  });

  actionPath = null;
  psCommand = null;
};

/**
 * Uses Powershell to remove the generated startup task
 */
const disableStartOnLaunch = () => {
  console.log("Disabling automatic start with Windows");
  let psCommand = `
        $name = "${STRING_METADATA.name}";
        Unregister-ScheduledTask -TaskName $name -Confirm:$false;
    `;
  runPowershell({
    stdout: false,
    commands: [psCommand],
    callback: () => {},
  });

  psCommand = null;
};

export { enableStartOnLaunch, disableStartOnLaunch };
