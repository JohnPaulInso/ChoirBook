package com.choirbookpro.app;

import android.accounts.AccountManager;
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

// (2026-07-13) native AccountManager Google picker bridge; prev: GoogleSignIn only
@CapacitorPlugin(name = "GoogleOneTap")
public class GoogleOneTapPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            Activity activity = getActivity();
            if (activity == null) {
                call.reject("Activity is null");
                return;
            }
            Intent chooseIntent = AccountManager.newChooseAccountIntent(
                null,
                null,
                new String[]{"com.google"},
                null,
                null,
                null,
                null
            );
            startActivityForResult(call, chooseIntent, "handleAccountPickerResult");
        } catch (Exception e) {
            try {
                GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .build();
                GoogleSignInClient client = GoogleSignIn.getClient(getContext(), gso);
                Intent signInIntent = client.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleAccountPickerResult");
            } catch (Exception ex) {
                call.reject("Google One Tap error: " + ex.getMessage(), ex);
            }
        }
    }

    // (2026-07-13) resolve chosen Google account from intent result; prev: strict GSO
    @ActivityCallback
    private void handleAccountPickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Intent data = result.getData();
            String email = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
            if (email == null || email.trim().isEmpty()) {
                try {
                    GoogleSignInAccount acct = GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException.class);
                    if (acct != null && acct.getEmail() != null) {
                        email = acct.getEmail();
                    }
                } catch (Exception ignored) {
                    try {
                        GoogleSignInAccount last = GoogleSignIn.getLastSignedInAccount(getContext());
                        if (last != null && last.getEmail() != null) {
                            email = last.getEmail();
                        }
                    } catch (Exception ignored2) {}
                }
            }
            if (email != null && !email.trim().isEmpty()) {
                String cleanEmail = email.trim().toLowerCase();
                String displayName = cleanEmail.split("@")[0];
                JSObject ret = new JSObject();
                ret.put("email", cleanEmail);
                ret.put("displayName", displayName);
                call.resolve(ret);
                return;
            }
            call.reject("Google account info is unavailable");
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
