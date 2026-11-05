package com.choirbookpro.app;

import android.app.Activity;
import android.content.Intent;
import android.view.WindowManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;

// (2026-07-13) Google sign-in & wake lock bridge; prev: one-tap only
@CapacitorPlugin(name = "GoogleOneTap")
public class GoogleOneTapPlugin extends Plugin {
    private static final String SERVER_CLIENT_ID = "303741150656-5ptj9tt99ff0lroco66brhmrt51a2eeh.apps.googleusercontent.com";
    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(SERVER_CLIENT_ID)
                .requestEmail()
                .build();
            Activity activity = getActivity();
            if (activity == null) {
                call.reject("Activity is null");
                return;
            }
            googleSignInClient = GoogleSignIn.getClient(activity, gso);
            googleSignInClient.signOut().addOnCompleteListener(activity, task -> {
                try {
                    Intent signInIntent = googleSignInClient.getSignInIntent();
                    startActivityForResult(call, signInIntent, "handleSignInResult");
                } catch (Exception ex) {
                    call.reject("Launch sign-in intent failed: " + ex.getMessage(), ex);
                }
            });
        } catch (Exception e) {
            call.reject("Google One Tap error: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            try {
                GoogleSignInAccount account = GoogleSignIn.getSignedInAccountFromIntent(result.getData()).getResult(ApiException.class);
                if (account != null && account.getIdToken() != null) {
                    JSObject ret = new JSObject();
                    ret.put("idToken", account.getIdToken());
                    ret.put("email", account.getEmail());
                    ret.put("displayName", account.getDisplayName());
                    call.resolve(ret);
                } else {
                    call.reject("Google account ID token is missing");
                }
            } catch (ApiException e) {
                call.reject("Google sign-in error " + e.getStatusCode() + ": " + e.getMessage(), e);
            } catch (Exception e) {
                call.reject("Google sign-in failed: " + e.getMessage(), e);
            }
        } else {
            call.reject("Google sign-in was cancelled or dismissed");
        }
    }

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
