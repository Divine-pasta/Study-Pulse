import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from './GlassCard';
import { exportAppBackup, importAppBackup } from '../utils/backupStorage';

interface BackupSectionProps {
  onRestoreComplete?: () => void | Promise<void>;
}

export const BackupSection: React.FC<BackupSectionProps> = ({ onRestoreComplete }) => {
  const { colors } = useTheme();
  const [busyAction, setBusyAction] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    try {
      setBusyAction('export');
      const { filename } = await exportAppBackup();
      Alert.alert('Backup Exported', `Created ${filename}. Save it to Downloads or Drive.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not export backup.';
      Alert.alert('Export Failed', msg);
    } finally {
      setBusyAction(null);
    }
  };

  const runFileRestore = async () => {
    try {
      setBusyAction('import');
      const result = await importAppBackup();
      if (!result) return;

      if (onRestoreComplete) {
        await onRestoreComplete();
      }

      Alert.alert(
        'Restore Complete',
        `Loaded "${result.fileName}" and restored ${result.restoredKeys} items.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not restore from file.';
      Alert.alert('Restore Failed', msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportPress = () => {
    Alert.alert(
      'Upload Backup File',
      'Choose a StudyBuddy .json file from your device. This will overwrite current local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload .json', onPress: runFileRestore },
      ]
    );
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.accentPrimarySoft }]}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.accentPrimary} />
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Offline Backup & Restore</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Export a .json file or pick a saved .json file to restore—no copy-pasting needed
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleExport}
          disabled={busyAction !== null}
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.accentPrimarySoft,
              borderColor: colors.accentPrimary,
            },
          ]}
        >
          {busyAction === 'export' ? (
            <ActivityIndicator size="small" color={colors.accentPrimary} />
          ) : (
            <Ionicons name="download-outline" size={16} color={colors.accentPrimary} />
          )}
          <Text style={[styles.actionText, { color: colors.accentPrimary }]}>Export .json</Text>
        </Pressable>

        <Pressable
          onPress={handleImportPress}
          disabled={busyAction !== null}
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.accentSecondarySoft,
              borderColor: colors.accentSecondary,
            },
          ]}
        >
          {busyAction === 'import' ? (
            <ActivityIndicator size="small" color={colors.accentSecondary} />
          ) : (
            <Ionicons name="folder-open-outline" size={16} color={colors.accentSecondary} />
          )}
          <Text style={[styles.actionText, { color: colors.accentSecondary }]}>Upload .json</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
