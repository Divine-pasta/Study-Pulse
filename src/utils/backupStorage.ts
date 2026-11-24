import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface StudyBuddyBackupPayload {
  app: 'StudyBuddy';
  version: number;
  exportedAt: string;
  entries: Record<string, string>;
}

export async function exportAppBackup(): Promise<{ keyCount: number; filename: string }> {
  const allKeys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(allKeys);

  const entries: Record<string, string> = {};
  for (const [key, value] of pairs) {
    if (value !== null) {
      entries[key] = value;
    }
  }

  const payload: StudyBuddyBackupPayload = {
    app: 'StudyBuddy',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `StudyBuddy_Backup_${dateStamp}.json`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save StudyBuddy Backup',
    UTI: 'public.json',
  });

  return { keyCount: Object.keys(entries).length, filename };
}

/**
 * Opens the device file picker so the user can select a .json backup file directly
 * without pasting JSON text manually.
 */
export async function importAppBackup(): Promise<{
  restoredKeys: number;
  exportedAt: string;
  fileName: string;
} | null> {
  const pickerResult = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
    return null;
  }

  const pickedFile = pickerResult.assets[0];
  const rawContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`"${pickedFile.name}" is not valid JSON.`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as StudyBuddyBackupPayload).app !== 'StudyBuddy' ||
    typeof (parsed as StudyBuddyBackupPayload).entries !== 'object' ||
    (parsed as StudyBuddyBackupPayload).entries === null
  ) {
    throw new Error(`"${pickedFile.name}" is not a valid StudyBuddy backup file.`);
  }

  const backup = parsed as StudyBuddyBackupPayload;
  const kvPairs: [string, string][] = Object.entries(backup.entries).filter(
    ([k, v]) => typeof k === 'string' && typeof v === 'string'
  );

  if (kvPairs.length === 0) {
    throw new Error('This backup file has no saved entries to restore.');
  }

  await AsyncStorage.multiSet(kvPairs);

  return {
    restoredKeys: kvPairs.length,
    exportedAt: backup.exportedAt || 'Unknown date',
    fileName: pickedFile.name,
  };
}
