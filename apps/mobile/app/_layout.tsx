import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
  useFonts,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./lib/theme";

export default function RootLayout() {
  // Atkinson Hyperlegible Next, one face per weight (see `fonts` in lib/theme). Render a blank canvas
  // until they load so no screen flashes in the system font first. A load error falls through to the
  // system font rather than blocking the app.
  const [loaded, error] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleNext_700Bold,
  });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      />
    </SafeAreaProvider>
  );
}
