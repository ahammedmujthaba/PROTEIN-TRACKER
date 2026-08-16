import React, { useRef, useState } from 'react';
import { StyleSheet, View, StatusBar, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// Local dev server URL for testing on physical phone via same Wi-Fi network
const SERVER_URL = 'http://192.168.1.35:3000/';

export default function App() {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080c14" />
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: SERVER_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          bounces={false}
          overScrollMode="never"
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080c14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  webview: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#080c14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
