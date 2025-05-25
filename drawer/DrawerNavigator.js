import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

// Import các màn hình
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import StatisticsScreen from './StatisticsScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Home"
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0066cc',
          },
          headerTintColor: '#fff',
          drawerActiveTintColor: '#0066cc',
          drawerLabelStyle: {
            fontSize: 16,
          }
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'Trang chủ',
            drawerIcon: ({color}) => (
              <Icon name="home" size={24} color={color} />
            )
          }}
        />
        <Drawer.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            title: 'Hồ sơ',
            drawerIcon: ({color}) => (
              <Icon name="user" size={24} color={color} />
            )
          }}
        />
        <Drawer.Screen 
          name="Statistics" 
          component={StatisticsScreen} 
          options={{
            title: 'Thống kê',
            drawerIcon: ({color}) => (
              <Icon name="bar-chart" size={24} color={color} />
            )
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default DrawerNavigator;