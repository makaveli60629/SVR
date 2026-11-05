package com.svrpoker.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String ASSET_ROOT = "file:///android_asset/";
    private static final String LIVE_ROOT = "https://svrpoker.com/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUserAgentString(settings.getUserAgentString() + " SVRPokerMobile/0.1");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return route(view, request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return route(view, Uri.parse(url));
            }

            private boolean route(WebView view, Uri uri) {
                String url = uri.toString();

                if (url.startsWith(ASSET_ROOT + "game/")) {
                    String path = url.substring((ASSET_ROOT).length());
                    view.loadUrl(LIVE_ROOT + path);
                    return true;
                }

                if (url.startsWith(ASSET_ROOT + "site/")) {
                    String path = url.substring((ASSET_ROOT).length());
                    view.loadUrl(LIVE_ROOT + path);
                    return true;
                }

                if (url.startsWith(ASSET_ROOT + "mobile/")) {
                    return false;
                }

                if (url.startsWith("https://svrpoker.com/") || url.startsWith("http://svrpoker.com/")) {
                    view.loadUrl(url.replace("http://", "https://"));
                    return true;
                }

                return false;
            }
        });

        webView.loadUrl(ASSET_ROOT + "mobile/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
