import React, { useLayoutEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';

// On Android, Back does not close the header's search bar, though
// `disableBackButtonOverride` defaults to false ("Specifies whether the back
// button should close search bar's text input or not"). Open the search bar on
// either screen, type, and press Back until something happens: README.md has
// the steps and what each press does.

type RootStackParamList = {
  Home: undefined;
  Results: undefined;
};

type Props<Name extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Name>;

// Each screen shows what its search bar holds, as onChangeText reports it.
function useSearchBar(navigation: Props<keyof RootStackParamList>['navigation']) {
  const [query, setQuery] = useState('');
  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search',
        onChangeText: (event) => setQuery(event.nativeEvent.text),
      },
    });
  }, [navigation]);
  return query;
}

function Home({ navigation }: Props<'Home'>) {
  const query = useSearchBar(navigation);
  return (
    <View style={styles.container}>
      <Text>Home. Search bar text: "{query}"</Text>
      <Button title="Open Results" onPress={() => navigation.navigate('Results')} />
    </View>
  );
}

function Results({ navigation }: Props<'Results'>) {
  const query = useSearchBar(navigation);
  return (
    <View style={styles.container}>
      <Text>Results. Search bar text: "{query}"</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Results" component={Results} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
