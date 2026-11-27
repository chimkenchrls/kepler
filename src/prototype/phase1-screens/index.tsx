// PROTOTYPE, throwaway: three Phase 1 screen/navigation variants, switched with the bar at the top.
// The question: which screens exist, what is on each, how you move between them, and how many taps ₱40 pamasahe takes.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './store';
import * as A from './VariantA';
import * as B from './VariantB';
import * as C from './VariantC';

const VARIANTS = [
  { key: 'A', name: A.name, View: A.VariantA },
  { key: 'B', name: B.name, View: B.VariantB },
  { key: 'C', name: C.name, View: C.VariantC },
];

export default function Phase1ScreensPrototype() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const st = useStore();
  const pad = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const v = VARIANTS[i];
  const go = (d: number) => (setI((i + d + VARIANTS.length) % VARIANTS.length), st.resetTaps());

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: pad.top, paddingBottom: pad.bottom }}>
      <StatusBar style="dark" />
      {__DEV__ && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', paddingVertical: 6, paddingHorizontal: 8 }}>
          <Pressable onPress={() => go(-1)} hitSlop={10}><Text style={bar}>  ‹  </Text></Pressable>
          <Text style={[bar, { flex: 1, textAlign: 'center' }]}>{v.key} · {v.name}</Text>
          <Pressable onPress={st.resetTaps}>
            <Text style={[bar, { color: '#ffd54f' }]}>taps {st.taps}{st.lastTaps !== null ? ` · last save ${st.lastTaps}` : ''}</Text>
          </Pressable>
          <Pressable onPress={() => go(1)} hitSlop={10}><Text style={bar}>  ›  </Text></Pressable>
        </View>
      )}
      <View style={{ flex: 1 }} onTouchStart={st.tap}>
        <v.View key={v.key} />
      </View>
      {st.msg ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: pad.bottom + 90, backgroundColor: '#333', borderRadius: 8, padding: 12 }}>
          <Text style={{ color: '#fff', fontSize: 15 }}>{st.msg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const bar = { color: '#fff', fontSize: 14 } as const;
