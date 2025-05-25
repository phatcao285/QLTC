import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

const SettingsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('vi');

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  // Get user data and language preference
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      navigation.navigate('Login');
      return;
    }
    
    setUser(currentUser);
    
    const fetchUserSettings = async () => {
      try {
        // Fetch user settings from Firestore
        const settingsDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('settings')
          .doc('preferences')
          .get();
          
        if (settingsDoc.exists) {
          const settingsData = settingsDoc.data();
          if (settingsData.notifications !== undefined) {
            setNotifications(settingsData.notifications);
          }
          if (settingsData.darkMode !== undefined) {
            setDarkMode(settingsData.darkMode);
          }
        }
        
        // Get current language from i18n
        setCurrentLanguage(i18n.language || 'vi');
      } catch (error) {
        console.error('Error fetching user settings:', error);
      }
    };
    
    fetchUserSettings();
  }, [navigation, i18n.language]);

  const handleToggleNotifications = async (value) => {
    if (isOffline) {
      Alert.alert(t('error', 'Lỗi'), t('offline_update_error', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để cập nhật cài đặt.'));
      return;
    }
    
    setNotifications(value);
    
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('settings')
        .doc('preferences')
        .set({
          notifications: value,
          darkMode: darkMode
        }, { merge: true });
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      setNotifications(!value); // Revert if failed
      Alert.alert(t('error', 'Lỗi'), t('notification_update_error', 'Không thể cập nhật cài đặt thông báo.'));
    }
  };

  const handleToggleDarkMode = async (value) => {
    if (isOffline) {
      Alert.alert(t('error', 'Lỗi'), t('offline_update_error', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để cập nhật cài đặt.'));
      return;
    }
    
    setDarkMode(value);
    
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('settings')
        .doc('preferences')
        .set({
          notifications: notifications,
          darkMode: value
        }, { merge: true });
    } catch (error) {
      console.error('Error updating dark mode setting:', error);
      setDarkMode(!value); // Revert if failed
      Alert.alert(t('error', 'Lỗi'), t('darkmode_update_error', 'Không thể cập nhật cài đặt chế độ tối.'));
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert(t('error', 'Lỗi'), t('logout_error', 'Không thể đăng xuất. Vui lòng thử lại sau.'));
      setLoading(false);
    }
  };

  const navigateToAccount = () => {
    navigation.navigate('Account');
  };

  const navigateToChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const navigateToHelpCenter = () => {
    navigation.navigate('HelpCenter');
  };

  const navigateToLanguage = () => {
    navigation.navigate('Language');
  };

  // Function to display language name based on code
  const getLanguageName = (code) => {
    switch(code) {
      case 'en': return 'English';
      case 'vi': 
      default: return 'Tiếng Việt';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e3a6c" />
        <Text style={styles.loadingText}>{t('processing', 'Đang xử lý...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings', 'Cài đặt')}</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>{t('offline_message', 'Bạn đang ngoại tuyến')}</Text>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {/* Account Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('account', 'Tài khoản')}</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={navigateToAccount}
          >
            <View style={styles.settingInfo}>
              <Icon name="person" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('account_info', 'Thông tin tài khoản')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={navigateToChangePassword}
          >
            <View style={styles.settingInfo}>
              <Icon name="lock" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('change_password', 'Đổi mật khẩu')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        
        {/* App Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('app_settings', 'Ứng dụng')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('notifications', 'Thông báo')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#d0d0d0', true: '#c4a5e5' }}
              thumbColor={notifications ? '#5e3a6c' : '#f0f0f0'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="nightlight-round" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('dark_mode', 'Chế độ tối')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#d0d0d0', true: '#c4a5e5' }}
              thumbColor={darkMode ? '#5e3a6c' : '#f0f0f0'}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={navigateToLanguage}
          >
            <View style={styles.settingInfo}>
              <Icon name="language" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('language', 'Ngôn ngữ')}</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{getLanguageName(currentLanguage)}</Text>
              <Icon name="chevron-right" size={24} color="#888" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Support & About */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('support_info', 'Hỗ trợ & Thông tin')}</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={navigateToHelpCenter}
          >
            <View style={styles.settingInfo}>
              <Icon name="help" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('help_center', 'Trung tâm trợ giúp')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert(t('notice', 'Thông báo'), t('feature_in_development', 'Tính năng đang được phát triển'))}
          >
            <View style={styles.settingInfo}>
              <Icon name="privacy-tip" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('privacy_policy', 'Chính sách bảo mật')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert(t('notice', 'Thông báo'), t('feature_in_development', 'Tính năng đang được phát triển'))}
          >
            <View style={styles.settingInfo}>
              <Icon name="info" size={24} color="#5e3a6c" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t('about_app', 'Về ứng dụng')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="logout" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.logoutButtonText}>{t('logout', 'Đăng xuất')}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.versionText}>{t('version', 'Phiên bản')} 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0e6ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e3d0f7',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  placeholderButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  logoutButton: {
    backgroundColor: '#5e3a6c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0e6ff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5e3a6c',
  },
  offlineBanner: {
    backgroundColor: '#ff6f00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default SettingsScreen;