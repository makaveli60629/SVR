package com.svrpoker.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final String ONLINE_URL = "https://svrpoker.com/game/android-stable.html?v=phase378&apk=rc2";
    private static final String FALLBACK_URL = "file:///android_asset/fallback.html";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView webView;
    private TextView status;
    private boolean showingFallback = false;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(false);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(2, 4, 10));

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(8), dp(6), dp(8), dp(6));
        bar.setBackgroundColor(Color.rgb(8, 13, 25));

        status = new TextView(this);
        status.setText("SVR RC2 • CONNECTING");
        status.setTextColor(Color.rgb(127, 252, 255));
        status.setTextSize(12f);
        status.setGravity(Gravity.CENTER_VERTICAL);
        bar.addView(status, new LinearLayout.LayoutParams(0, dp(44), 1f));

        Button stable = button("STABLE TABLE");
        stable.setOnClickListener(v -> loadFallback("Manual stable table"));
        bar.addView(stable, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));

        Button refresh = button("REFRESH");
        refresh.setOnClickListener(v -> loadOnline());
        bar.addView(refresh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUserAgentString(settings.getUserAgentString() + " SVRPokerAndroid/0.1.0-rc2");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        webView.clearCache(true);
        webView.clearHistory();

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
                status.setText("DOWNLOAD LINK COULD NOT OPEN");
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url.startsWith("file:///android_asset/")) {
                    showingFallback = true;
                    status.setText("SVR RC2 • OFFLINE STABLE TABLE");
                    return;
                }
                status.setText("SVR RC2 • VERIFYING GAME");
                handler.postDelayed(() -> verifyPlayablePage(view), 2500);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) loadFallback("Network error");
            }
        });

        root.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        loadOnline();
    }

    private Button button(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(10f);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        button.setPadding(dp(8), 0, dp(8), 0);
        return button;
    }

    private void loadOnline() {
        showingFallback = false;
        status.setText("SVR RC2 • LOADING CURRENT GAME");
        webView.stopLoading();
        webView.clearCache(true);
        webView.loadUrl(ONLINE_URL + "&t=" + System.currentTimeMillis());
    }

    private void verifyPlayablePage(WebView view) {
        if (showingFallback || view == null) return;
        String check = "(function(){var t=((document.body&&document.body.innerText)||'').toUpperCase();" +
                "return t.indexOf('JOIN NOW')>=0||t.indexOf('ANDROID STABLE TABLE')>=0||t.indexOf('YOUR TURN')>=0;})()";
        view.evaluateJavascript(check, value -> {
            if ("true".equals(value)) {
                status.setText("SVR RC2 • GAME READY");
            } else {
                loadFallback("Online page did not expose JOIN NOW");
            }
        });
    }

    private void loadFallback(String reason) {
        if (showingFallback && FALLBACK_URL.equals(webView.getUrl())) return;
        showingFallback = true;
        status.setText("SVR RC2 • STABLE RECOVERY");
        webView.stopLoading();
        webView.loadUrl(FALLBACK_URL + "?reason=" + Uri.encode(reason));
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
