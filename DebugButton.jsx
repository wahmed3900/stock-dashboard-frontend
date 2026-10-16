// DebugButton.jsx
// ⚠️  Only renders in __DEV__ mode — safe for Play Store / App Store builds

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Share,
  Linking,
  ScrollView,
} from 'react-native';
import ViewShot from 'react-native-view-shot'; // npm install react-native-view-shot

// ── Change this to your support email ──
const SUPPORT_EMAIL = 'wahmed07860786@gmail.com';

// ── Pulls whatever app version you have wired up ──
// If using Expo:  import Constants from 'expo-constants';
// const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';
const APP_VERSION = '1.0.0'; // replace or pull from your config

export default function DebugButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const viewShotRef = useRef(null);

  // Gate entirely — zero footprint in production builds
  if (!__DEV__) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildDebugText = () =>
    [
      `App Version: ${APP_VERSION}`,
      `OS:          ${Platform.OS}`,
      `OS Version:  ${Platform.Version}`,
      `Build Env:   ${process.env.NODE_ENV ?? 'unknown'}`,
      `DEV mode:    ${String(__DEV__)}`,
      `Timestamp:   ${new Date().toISOString()}`,
    ].join('\n');

  // ── Actions ──────────────────────────────────────────────────────────────

  const viewSystemInfo = () => {
    Alert.alert('🖥️ System Info', buildDebugText(), [{ text: 'OK' }]);
  };

  const triggerTestError = () => {
    try {
      throw new Error('Test Debug Exception');
    } catch (err) {
      Alert.alert('💥 Caught Test Error', err.message);
    }
  };

  const sendDebugEmail = async () => {
    const subject = encodeURIComponent('[Debug Report] StockAI');
    const body = encodeURIComponent(
      `Hi Support,\n\nHere is my debug info:\n\n${buildDebugText()}\n\n--- describe your issue below ---\n`
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        'No Email App Found',
        `Please email us at ${SUPPORT_EMAIL} with your debug info:\n\n${buildDebugText()}`
      );
      return;
    }
    await Linking.openURL(url);
  };

  const takeScreenshot = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Share.share({
        title: 'StockAI Debug Screenshot',
        message: `Debug screenshot — ${buildDebugText()}`,
        url: uri, // iOS attaches the image; Android varies by app
      });
    } catch (err) {
      Alert.alert('Screenshot Failed', err.message);
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    // ViewShot wraps the whole screen so the screenshot captures everything
    <ViewShot ref={viewShotRef} style={StyleSheet.absoluteFill} options={{ format: 'jpg', quality: 0.9 }}>
      {/* Floating trigger button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Open debug menu"
      >
        <Text style={styles.floatingButtonText}>🐞</Text>
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        {/* Tap outside to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          {/* Prevent taps inside from bubbling up */}
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <Text style={styles.sheetTitle}>🛠️ Developer Debug Menu</Text>
            <Text style={styles.sheetSubtitle}>Only visible in dev builds</Text>

            <ScrollView bounces={false}>
              <MenuItem emoji="📱" label="View System Info" onPress={viewSystemInfo} />
              <MenuItem emoji="💥" label="Test Crash / Error" onPress={triggerTestError} />
              <MenuItem emoji="📸" label="Screenshot & Share" onPress={takeScreenshot} />
              <MenuItem emoji="📧" label="Email Debug Report" onPress={sendDebugEmail} />
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ViewShot>
  );
}

// ── Small reusable row ────────────────────────────────────────────────────

function MenuItem({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating bug icon
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    zIndex: 9999,
  },
  floatingButtonText: { fontSize: 22 },

  // Modal backdrop
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  // Bottom sheet card
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },

  // Menu rows
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  menuEmoji: { fontSize: 20, marginRight: 12 },
  menuLabel: { fontSize: 15, color: '#222', fontWeight: '500' },

  // Close button
  closeButton: {
    marginTop: 20,
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
