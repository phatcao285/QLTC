import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function CustomDrawerContent(props) {
  const [userProfile, setUserProfile] = useState({
    name: 'Người dùng',
    email: 'user@example.com',
    avatar: null
  });

  useEffect(() => {
    const user = auth().currentUser;
    
    if (user) {
      // Nếu đã đăng nhập, lấy thông tin từ Auth
      const { displayName, email, photoURL } = user;
      setUserProfile({ 
        name: displayName || 'Người dùng', 
        email: email || 'user@example.com',
        avatar: photoURL 
      });
      
      // Lấy thêm thông tin từ Firestore
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists) {
            const userData = documentSnapshot.data();
            setUserProfile(prev => ({
              ...prev,
              name: userData.name || userData.displayName || prev.name,
              avatar: userData.avatar || userData.photoURL || prev.avatar
            }));
          }
        }, error => {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
        });
        
      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      // Navigation sẽ tự động chuyển đến màn hình đăng nhập do logic trong App.js
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  // Tạo các item tùy chỉnh cho drawer
  const customDrawerItems = () => {
    const items = [
      {
        name: 'Trang chủ',
        icon: 'home',
        route: 'MainTabs',
        color: '#5db7b7'
      },
      {
        name: 'Hồ sơ',
        icon: 'person',
        route: 'Profile',
        color: '#9c27b0'
      },
      {
        name: 'Thống kê',
        icon: 'bar-chart',
        route: 'Statistics',
        color: '#ff9800'
      },
      {
        name: 'Cài đặt',
        icon: 'settings',
        route: 'SettingsDrawer',
        color: '#607d8b'
      },
      {
        name: 'Trợ giúp',
        icon: 'help',
        route: 'HelpCenterDrawer',
        color: '#4caf50'
      },
      {
        name: 'Chatbot',
        icon: 'chat',
        route: 'ChatbotDrawer',
        color: '#6a3de8'
      }
    ];

    return items.map((item, index) => {
      const focused = props.state.index === props.state.routes.findIndex(
        route => route.name === item.route
      );

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.drawerItem,
            focused && styles.drawerItemFocused
          ]}
          onPress={() => props.navigation.navigate(item.route)}
        >
          <View style={[styles.iconContainer, { backgroundColor: focused ? item.color : 'rgba(0,0,0,0.04)' }]}>
            <Icon name={item.icon} size={22} color={focused ? '#fff' : item.color} />
          </View>
          <Text style={[
            styles.drawerItemText,
            focused && { color: item.color, fontWeight: 'bold' }
          ]}>
            {item.name}
          </Text>
          {focused && <View style={[styles.activeMark, { backgroundColor: item.color }]} />}
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ padding: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#9c27b0', '#6a11cb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.drawerHeader}
        >
          <View style={styles.headerContent}>
            {userProfile.avatar ? (
              <Image 
                source={{ uri: userProfile.avatar }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <LinearGradient
                  colors={['#5db7b7', '#5e3a6c']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
            )}
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.drawerItemsContainer}>
          {/* Menu tùy chỉnh thay vì DrawerItemList */}
          {customDrawerItems()}
        </View>
      </DrawerContentScrollView>
      
      {/* Nút đăng xuất ở cuối Drawer */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={22} color="#f44336" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  drawerItemsContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  defaultAvatar: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 8,
    position: 'relative',
  },
  drawerItemFocused: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  activeMark: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#f44336',
    fontWeight: '500',
  },
});

export default CustomDrawerContent;