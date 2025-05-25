import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';

// Màn hình chính
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgetPassword from './screens/ForgetPassword';
import AddTransaction from './screens/AddTransaction';
import EditTransaction from './screens/EditTransaction';
import TransactionList from './screens/TransactionList';
import SettingsScreen from './screens/SettingsScreen';
import AccountScreen from './screens/AccountScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import LanguageScreen from './screens/LanguageScreen';
import HelpCenterScreen from './screens/HelpCenterScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Drawer Content
import CustomDrawerContent from './drawer/CustomDrawerContent';

// Thiết lập i18n
import './i18n/i18n';

// Tùy chỉnh theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6a11cb',
    accent: '#5db7b7',
    background: '#f5f8fb',
    surface: '#ffffff',
    text: '#333333',
  },
};

// Theme cho Navigation
const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#6a11cb',
    background: '#f5f8fb',
    card: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
  },
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const HomeStack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Stack Navigator cho HomeScreen và các màn hình liên quan
function HomeStackScreen({ navigation }) {
  return (
    <HomeStack.Navigator 
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <HomeStack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        initialParams={{ parentNavigation: navigation }}
      />
      <HomeStack.Screen name="EditTransaction" component={EditTransaction} />
      <HomeStack.Screen name="TransactionList" component={TransactionList} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="Account" component={AccountScreen} />
      <HomeStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <HomeStack.Screen name="Language" component={LanguageScreen} />
      <HomeStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      
      {/* Đặt màn hình Chatbot bên trong HomeStack để nó không sử dụng Drawer */}
      <HomeStack.Screen 
        name="ChatbotScreen" 
        component={ChatbotScreen}
        options={{
          headerShown: true,
          headerTitle: 'Trợ lý tài chính',
          headerStyle: {
            backgroundColor: '#6a11cb',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          // Custom headerLeft để hiển thị nút quay lại thay vì drawer
          headerLeft: (props) => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
    </HomeStack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={stylesTab.tabBar}>
      {/* Home icon */}
      <TouchableOpacity
        style={stylesTab.tabButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Icon name="home" size={28} color={state.index === 0 ? '#6a11cb' : 'gray'} />
      </TouchableOpacity>
      {/* Plus button */}
      <TouchableOpacity
        style={stylesTab.plusButton}
        onPress={() => navigation.navigate('Add')}
        activeOpacity={0.7}
      >
        <Icon name="add" size={36} color="#fff" />
      </TouchableOpacity>
      {/* List icon */}
      <TouchableOpacity
        style={stylesTab.tabButton}
        onPress={() => navigation.navigate('List')}
      >
        <Icon name="list" size={28} color={state.index === 2 ? '#e57373' : 'gray'} />
      </TouchableOpacity>
    </View>
  );
}

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen} 
        initialParams={{ parentNavigation: navigation }}
      />
      <Tab.Screen name="Add" component={AddTransaction} />
      <Tab.Screen name="List" component={TransactionList} />
    </Tab.Navigator>
  );
}

// Drawer Navigator bao gồm MainTabs và các màn hình khác (KHÔNG bao gồm Chatbot)
function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#6a11cb',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        drawerStyle: {
          width: '75%',
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          overflow: 'hidden',
        },
        swipeEnabled: true,
      }}
      initialRouteName="MainTabs"
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs} 
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
          headerShown: true,
          headerTitle: 'Hồ sơ người dùng',
          headerStyle: {
            backgroundColor: '#6a11cb',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          drawerIcon: ({color}) => (
            <Icon name="person" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{
          title: 'Thống kê',
          headerShown: true,
          headerTitle: 'Phân tích chi tiêu',
          headerStyle: {
            backgroundColor: '#6a11cb',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          drawerIcon: ({color}) => (
            <Icon name="bar-chart" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="SettingsDrawer" 
        component={SettingsScreen} 
        options={{
          title: 'Cài đặt',
          headerShown: true,
          headerTitle: 'Cài đặt',
          headerStyle: {
            backgroundColor: '#6a11cb',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          drawerIcon: ({color}) => (
            <Icon name="settings" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="HelpCenterDrawer" 
        component={HelpCenterScreen} 
        options={{
          title: 'Trợ giúp',
          headerShown: true,
          headerTitle: 'Trung tâm trợ giúp',
          headerStyle: {
            backgroundColor: '#6a11cb',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          drawerIcon: ({color}) => (
            <Icon name="help" size={24} color={color} />
          )
        }}
      />
      
      {/* Bỏ màn hình ChatbotDrawer ra khỏi Drawer và chỉ sử dụng nó thông qua HomeStack */}
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f8fb' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
    </Stack.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6a11cb' }}>
      <Icon name="account-balance-wallet" size={64} color="#fff" />
    </View>
  );
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  if (loading) return <SplashScreen />;
  
  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#6a11cb" 
        translucent={false} 
      />
      <NavigationContainer theme={navigationTheme}>
        {user ? (
          <MainDrawer />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
};

const stylesTab = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6a11cb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'android' ? -32 : -24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default App;