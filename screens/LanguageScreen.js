import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { changeLanguageWithoutStorage } from '../i18n/i18n';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const LanguageScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [loading, setLoading] = useState(false);
  
  // Animation value
  const [scaleAnim] = useState(new Animated.Value(1));

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', color: '#E50808' },
    { code: 'en', name: 'English', flag: '🇬🇧', color: '#0052B4' }
  ];

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  // Get current language
  useEffect(() => {
    setSelectedLanguage(i18n.language || 'vi');
  }, [i18n.language]);

  const animateSelection = (langCode) => {
    // Animate scale down then up
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Change language
    changeLanguage(langCode);
  };

  const changeLanguage = async (langCode) => {
    if (isOffline) {
      Alert.alert('Lỗi', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để thay đổi ngôn ngữ.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Change language using our temporary solution
      await changeLanguageWithoutStorage(langCode);
      
      setSelectedLanguage(langCode);
      
      // Show confirmation
      const successMessage = langCode === 'vi' 
        ? 'Ngôn ngữ đã được thay đổi thành công!' 
        : 'Language has been changed successfully!';
      
      Alert.alert(
        langCode === 'vi' ? 'Thành công' : 'Success',
        successMessage
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi ngôn ngữ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#6a3de8" barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Đang thay đổi ngôn ngữ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6a3de8" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient 
        colors={['#6a3de8', '#5e3a6c']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}} 
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language')}</Text>
        <View style={styles.placeholderButton} />
      </LinearGradient>
      
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>{t('offline_message')}</Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Icon name="language" size={40} color="#6a3de8" style={styles.titleIcon} />
          <Text style={styles.title}>{t('select_language')}</Text>
        </View>
        
        <Text style={styles.description}>
          {t('language_description')}
        </Text>
        
        <View style={styles.languageListContainer}>
          {languages.map((language) => (
            <Animated.View 
              key={language.code}
              style={[
                styles.languageCardContainer,
                selectedLanguage === language.code && {
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.languageCard,
                  selectedLanguage === language.code && styles.selectedLanguageCard
                ]}
                onPress={() => animateSelection(language.code)}
                activeOpacity={0.9}
              >
                <LinearGradient 
                  colors={selectedLanguage === language.code ? 
                    ['#6a3de8', '#5e3a6c'] : 
                    ['#FFFFFF', '#F8F8F8']} 
                  style={styles.cardGradient}
                  start={{x: 0, y: 0}} 
                  end={{x: 1, y: 0}}
                >
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagText}>{language.flag}</Text>
                  </View>
                  
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === language.code && styles.selectedLanguageName
                  ]}>
                    {language.name}
                  </Text>
                  
                  {selectedLanguage === language.code && (
                    <View style={styles.checkIconContainer}>
                      <Icon name="check-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        <View style={styles.noteContainer}>
          <Icon name="info" size={20} color="#888" style={styles.noteIcon} />
          <Text style={styles.noteText}>
            {t('language_note')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
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
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  languageListContainer: {
    marginBottom: 32,
  },
  languageCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedLanguageCard: {
    borderWidth: 0,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  flagContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  flagText: {
    fontSize: 32,
  },
  languageName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedLanguageName: {
    color: '#FFFFFF',
  },
  checkIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6a3de8',
  },
  noteIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6a3de8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  offlineBanner: {
    backgroundColor: '#ff6f00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default LanguageScreen;