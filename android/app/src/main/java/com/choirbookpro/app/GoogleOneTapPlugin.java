package com.choirbookpro.app;

import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// (2026-07-13) screen keep-awake helper bridge; prev: mixed auth & wake lock
@CapacitorPlugin(name = "GoogleOneTap")
public class GoogleOneTapPlugin extends Plugin {

    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        boolean enable = call.getBoolean("enable", true);
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                if (enable) {
                    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
                call.resolve();
            });
        } else {
            call.resolve();
        }
    }
}
