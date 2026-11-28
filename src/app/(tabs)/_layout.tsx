import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Tabs } from 'expo-router';

// color as string: the tab bar passes string tint colours; its type is wider than the icon types allow
export default function TabLayout() {
  return (
    // firstRoute: Android back from any tab goes to Home, and from Home leaves the app
    <Tabs backBehavior="firstRoute">
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="entries"
        options={{
          title: 'Entries',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="list" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="add-circle" color={color as string} size={size} />,
        }}
        // + is not a real tab: it opens the full-screen add form on top of the tabs
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/entry');
          },
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="pie-chart" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}
