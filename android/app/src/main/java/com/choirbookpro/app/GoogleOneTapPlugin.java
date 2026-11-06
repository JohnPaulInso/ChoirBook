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

    // (2026-07-13) handle sign-in result with safe exception catch; prev: unused catch
    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            try {
                GoogleSignInAccount account = null;
                try {
                    account = GoogleSignIn.getSignedInAccountFromIntent(result.getData()).getResult(ApiException.class);
                } catch (Exception ignored) {
                    try {
                        account = GoogleSignIn.getLastSignedInAccount(getContext());
                    } catch (Exception ignored2) {}
                }
                if (account != null) {
                    JSObject ret = new JSObject();
                    if (account.getIdToken() != null) {
                        ret.put("idToken", account.getIdToken());
                    }
                    ret.put("email", account.getEmail() != null ? account.getEmail() : "");
                    ret.put("displayName", account.getDisplayName() != null ? account.getDisplayName() : "Choir Director");
                    call.resolve(ret);
                    return;
                }
                call.reject("Google account info is unavailable");
            } catch (Exception e) {
                call.reject("Google sign-in failed: " + e.getMessage(), e);
            }
        } else {
            call.reject("Google sign-in was cancelled or dismissed");
        }
    }

    // (2026-07-13) sign out google sign in client on logout; prev: none
    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).build();
            GoogleSignInClient client = GoogleSignIn.getClient(getContext(), gso);
            client.signOut().addOnCompleteListener(task -> {
                if (call != null) call.resolve();
            });
        } catch (Exception e) {
            if (call != null) call.resolve();
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
