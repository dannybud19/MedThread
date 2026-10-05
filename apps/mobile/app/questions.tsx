import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BackButton, Body, ClaimCard, Screen, Title } from "../components/ui";
import { entryId, questions } from "./lib/data";
import { space, type } from "./lib/theme";

// Screen 7 — Questions to clarify. One merged list.
export default function Questions() {
  const router = useRouter();
  const open = (category: string, subject: string) => router.push(`/subject/${entryId(category, subject)}`);

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Title>Questions to clarify</Title>
      {questions.length === 0 ? (
        <Body muted>Nothing to ask about right now.</Body>
      ) : (
        questions.map((q) => (
          <View key={q.id} style={styles.block}>
            <Text style={styles.prompt}>{q.prompt}</Text>
            {q.fromClaims.map((c) => (
              <ClaimCard key={c.id} claim={c} onPress={() => open(c.category, c.subject)} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.base, marginTop: space.base },
  prompt: { ...type.bodyStrong },
});
