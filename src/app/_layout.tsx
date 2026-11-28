import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrate } from '../db/migrations';

export default function RootLayout() {
  return (
    // Opens the one Kepler database and brings it up to date before any screen renders.
    <SQLiteProvider databaseName="kepler.db" onInit={migrate}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="entry" options={{ title: 'New entry', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="accounts/index" options={{ title: 'Accounts' }} />
        <Stack.Screen name="accounts/edit" />
      </Stack>
      <StatusBar style="auto" />
    </SQLiteProvider>
  );
}
