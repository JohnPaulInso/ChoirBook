package com.choirbookpro.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

// (2026-07-13) add native immersive mode & force-rotate bridge for PPT; prev: wake lock only
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

    @PluginMethod
    public void setImmersiveMode(PluginCall call) {
        boolean hide = call.getBoolean("hide", true);
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        WindowInsetsController controller = activity.getWindow().getInsetsController();
                        if (controller != null) {
                            if (hide) {
                                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                            } else {
                                controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                            }
                        }
                    } else {
                        View decor = activity.getWindow().getDecorView();
                        if (hide) {
                            decor.setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            );
                        } else {
                            decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                        }
                    }
                } catch (Exception ignored) {}
                call.resolve();
            });
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void setOrientation(PluginCall call) {
        String mode = call.getString("mode", "auto");
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    if ("landscape".equals(mode)) {
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    } else if ("portrait".equals(mode)) {
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    } else {
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    }
                } catch (Exception ignored) {}
                call.resolve();
            });
        } else {
            call.resolve();
        }
    }

    // (2026-07-13) save exported PNG/Word to Downloads & post tap-to-open notification; prev: none
    @PluginMethod
    public void saveFileToDownloads(PluginCall call) {
        String filename = call.getString("filename", "song.png");
        String mimeType = call.getString("mimeType", "image/png");
        String base64Data = call.getString("base64Data", "");
        Context ctx = getContext();
        Activity activity = getActivity();
        if (ctx == null || base64Data == null || base64Data.isEmpty()) {
            call.reject("Missing file data");
            return;
        }
        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            Uri savedUri = null;
            String displayDir = "Downloads/ChoirBookPro";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = ctx.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ChoirBookPro");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                savedUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (savedUri != null) {
                    try (OutputStream os = resolver.openOutputStream(savedUri)) {
                        if (os != null) os.write(bytes);
                    }
                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    resolver.update(savedUri, values, null, null);
                }
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "ChoirBookPro");
                if (!dir.exists()) dir.mkdirs();
                File outFile = new File(dir, filename);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(bytes);
                }
                savedUri = Uri.fromFile(outFile);
            }

            // Request notification permission on Android 13+ if not yet granted
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && activity != null) {
                if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 9012);
                }
            }

            postDownloadNotification(ctx, filename, mimeType, savedUri, displayDir);

            JSObject ret = new JSObject();
            ret.put("saved", true);
            ret.put("directory", displayDir);
            ret.put("uri", savedUri != null ? savedUri.toString() : "");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage());
        }
    }

    private void postDownloadNotification(Context ctx, String filename, String mimeType, Uri fileUri, String displayDir) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            String channelId = "choirbook_downloads";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(channelId, "Song Downloads", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Notifications for downloaded printable lyrics");
                nm.createNotificationChannel(ch);
            }

            Intent openIntent = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (fileUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Intent viewFile = new Intent(Intent.ACTION_VIEW);
                viewFile.setDataAndType(fileUri, mimeType);
                viewFile.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                if (viewFile.resolveActivity(ctx.getPackageManager()) != null) {
                    openIntent = viewFile;
                }
            }
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(ctx, (int) (System.currentTimeMillis() & 0xffff), openIntent, flags);

            Notification.Builder builder = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? new Notification.Builder(ctx, channelId)
                : new Notification.Builder(ctx);
            builder.setContentTitle("Downloaded: " + filename)
                .setContentText("Saved in " + displayDir + " — Tap to open")
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setAutoCancel(true)
                .setContentIntent(pi);
            nm.notify((int) (System.currentTimeMillis() & 0x7fffffff), builder.build());
        } catch (Exception ignored) {}
    }
}
