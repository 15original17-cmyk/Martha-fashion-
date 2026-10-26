package com.marthafashion.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Bitmap;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private ValueCallback<Uri[]> mUploadMessage;
    private final static int FILECHOOSER_RESULTCODE = 1001;
    // 100% Offline-First Autonomous Local Martha Fashion App
    // No Google Account, No Sign-In, No Network dependency at launch
    private static final String LOCAL_APP_URL = "file:///android_asset/web/index.html";
    private static final String DEV_URL = "https://ais-dev-w4zmunnt4yz2wwv7weeuom-497052180324.europe-west2.run.app";

    private final int COLOR_LUXE_BG = 0xFFFFFBF5; // Elegant warm ivory background

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Light luxury status bar and navigation bar configuration
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.setStatusBarColor(COLOR_LUXE_BG);
            window.setNavigationBarColor(COLOR_LUXE_BG);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                View decorView = window.getDecorView();
                decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        }

        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(COLOR_LUXE_BG);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(COLOR_LUXE_BG);

        // Gold style progress bar on top
        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgressBar.setMax(100);
        mProgressBar.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 8
        ));
        mProgressBar.setProgress(0);

        layout.addView(mWebView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));
        layout.addView(mProgressBar);

        setContentView(layout);
        initWebView();
    }

    private void initWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " MarthaFashionApp/1.2.0 MarthaFashionNativeApp");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Bridge to reliably detect running in installed Android app
        mWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public boolean isInstalledApp() {
                return true;
            }
            @JavascriptInterface
            public String getAppVersion() {
                return "1.2.0";
            }
        }, "MarthaNativeAndroid");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleCustomUrl(url);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    view.evaluateJavascript("window.isMarthaNativeApp = true; try { localStorage.setItem('martha_is_installed_app', 'true'); } catch(e){}", null);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                mProgressBar.setVisibility(View.GONE);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    view.evaluateJavascript("window.isMarthaNativeApp = true; try { localStorage.setItem('martha_is_installed_app', 'true'); } catch(e){}", null);
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                if (failingUrl != null && !failingUrl.startsWith("file:///")) {
                    mWebView.loadUrl(LOCAL_APP_URL);
                } else {
                    showErrorScreen(description);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request.isForMainFrame()) {
                    String url = request.getUrl() != null ? request.getUrl().toString() : "";
                    if (!url.startsWith("file:///")) {
                        mWebView.loadUrl(LOCAL_APP_URL);
                    }
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request.isForMainFrame()) {
                    int statusCode = errorResponse.getStatusCode();
                    if (statusCode >= 400) {
                        view.post(new Runnable() {
                            @Override
                            public void run() {
                                mWebView.loadUrl(LOCAL_APP_URL);
                            }
                        });
                    }
                }
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                android.util.Log.d("MarthaFashion", consoleMessage.message() + " [" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + "]");
                return true;
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                } else {
                    mProgressBar.setVisibility(View.GONE);
                }
            }

            // Image file picker for custom order & measurements photo uploads
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                    mUploadMessage = null;
                }
                mUploadMessage = filePathCallback;

                Intent intent = null;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    intent = fileChooserParams.createIntent();
                } else {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                }
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    mUploadMessage = null;
                    Toast.makeText(MainActivity.this, "Impossible d'ouvrir la galerie.", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        // 100% Offline-First : Direct instant load of local embedded app
        // No Google login, No network requirement, No blank screen
        mWebView.loadUrl(LOCAL_APP_URL);
    }

    private boolean handleCustomUrl(String url) {
        if (url == null) return false;

        // Block any Google login or authentication redirect completely
        if (url.contains("accounts.google.com") || url.contains("google.com/signin") || url.contains("google.com/accounts")) {
            return true;
        }

        // Native WhatsApp intent dispatcher
        if (url.startsWith("https://wa.me/") || url.startsWith("https://api.whatsapp.com/") || url.startsWith("whatsapp://")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(url));
                intent.setPackage("com.whatsapp");
                startActivity(intent);
                return true;
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception ex) {
                    Toast.makeText(this, "WhatsApp n'est pas installé sur cet appareil.", Toast.LENGTH_LONG).show();
                    return true;
                }
            }
        }

        // Phone calls
        if (url.startsWith("tel:")) {
            try {
                Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                startActivity(intent);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        // External social media
        if (url.contains("instagram.com") || url.contains("facebook.com") || url.contains("tiktok.com")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mUploadMessage == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            mUploadMessage.onReceiveValue(results);
            mUploadMessage = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private void showErrorScreen(String errorMsg) {
        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>"
            + "body{background:#FFFBF5;color:#1A1A1A;font-family:sans-serif;margin:0;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;text-align:center;}"
            + ".crest{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#AA820A,#D4AF37,#F5D77F);display:flex;align-items:center;justify-content:center;color:#1A1A1A;font-weight:900;font-size:24px;margin-bottom:16px;box-shadow:0 8px 20px rgba(212,175,55,0.3);}"
            + "h1{font-size:22px;margin:0 0 8px;color:#1A1A1A;}p{font-size:13px;color:#6B655F;margin:0 0 20px;max-width:300px;line-height:1.5;}"
            + ".btn{background:linear-gradient(135deg,#D4AF37,#F5D77F);color:#1A1A1A;padding:12px 28px;border-radius:9999px;font-weight:bold;text-decoration:none;display:inline-block;border:none;cursor:pointer;font-size:13px;box-shadow:0 4px 15px rgba(212,175,55,0.3);}"
            + "</style></head><body>"
            + "<div class='crest'>M</div>"
            + "<h1>Martha Fashion</h1>"
            + "<p>L'application n'a pas pu charger la page demandée.<br><small style='color:#AA820A;'>" + (errorMsg != null ? errorMsg : "Vérification des ressources locales...") + "</small></p>"
            + "<button class='btn' onclick='location.href=\"" + LOCAL_APP_URL + "\"'>Réessayer</button>"
            + "</body></html>";
        mWebView.loadDataWithBaseURL("file:///android_asset/web/", html, "text/html", "utf-8", null);
    }
}
