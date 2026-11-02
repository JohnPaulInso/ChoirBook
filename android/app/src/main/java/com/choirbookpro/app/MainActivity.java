package com.choirbookpro.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// (2026-07-13) register GoogleOneTapPlugin; prev: default BridgeActivity
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleOneTapPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
