package com.choirbookpro.app;

import android.os.Bundle;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.BridgeActivity;

// (2026-07-13) universal back dismisses overlays & songs; prev: closed app
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleOneTapPlugin.class);
        registerPlugin(AppPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(
                "(function(){ return !!(window.handleUniversalBack && window.handleUniversalBack()); })();",
                value -> {
                    if (!"true".equals(value)) {
                        runOnUiThread(() -> MainActivity.super.onBackPressed());
                    }
                }
            );
            return;
        }
        super.onBackPressed();
    }
}
