import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#1d6fb8" size="large" />
    </View>
  );
}
