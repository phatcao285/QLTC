import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import { firebase } from '@react-native-firebase/auth';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState({
    current: true,
    new: true,
    confirm: true
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '#888'
  });

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  // Kiểm tra độ mạnh của mật khẩu
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: '',
        color: '#888'
      });
      return;
    }

    let score = 0;
    
    // Kiểm tra độ dài
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Kiểm tra chữ hoa, chữ thường
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    
    // Kiểm tra số và ký tự đặc biệt
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let message = '';
    let color = '';
    
    if (score <= 2) {
      message = 'Yếu';
      color = '#ff3b30';
    } else if (score <= 4) {
      message = 'Trung bình';
      color = '#ff9500';
    } else {
      message = 'Mạnh';
      color = '#34c759';
    }

    setPasswordStrength({
      score,
      message,
      color
    });
  };

  const toggleSecureTextEntry = (field) => {
    setSecureTextEntry(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!currentPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại.');
      return false;
    }

    if (!newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới.');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (isOffline) {
      Alert.alert('Lỗi', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để đổi mật khẩu.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const user = auth().currentUser;
      
      if (!user) {
        Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      // Xác thực lại với mật khẩu hiện tại
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      // Đăng nhập lại để xác thực mật khẩu hiện tại
      await user.reauthenticateWithCredential(credential);
      
      // Đổi mật khẩu
      await user.updatePassword(newPassword);
      
      Alert.alert(
        'Thành công', 
        'Mật khẩu đã được thay đổi thành công.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Không thể đổi mật khẩu.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Mật khẩu hiện tại không chính xác.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          // Đăng xuất và chuyển hướng đến màn hình đăng nhập
          await auth().signOut();
          navigation.navigate('Login');
          break;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>Bạn đang ngoại tuyến</Text>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Để đổi mật khẩu, vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.
          </Text>
          
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry={secureTextEntry.current}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => toggleSecureTextEntry('current')}
              >
                <Icon 
                  name={secureTextEntry.current ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  checkPasswordStrength(text);
                }}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry={secureTextEntry.new}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => toggleSecureTextEntry('new')}
              >
                <Icon 
                  name={secureTextEntry.new ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthLabel}>Độ mạnh:</Text>
                <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                  {passwordStrength.message}
                </Text>
                <View style={styles.strengthBarContainer}>
                  {[1, 2, 3, 4, 5, 6].map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.strengthBarSegment,
                        { 
                          backgroundColor: index < passwordStrength.score 
                            ? passwordStrength.color 
                            : '#e0e0e0'
                        }
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
            
            <Text style={styles.passwordHint}>
              Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </Text>
          </View>
          
          {/* Confirm New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={secureTextEntry.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => toggleSecureTextEntry('confirm')}
              >
                <Icon 
                  name={secureTextEntry.confirm ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>
                Mật khẩu xác nhận không khớp với mật khẩu mới.
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="lock" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
            </>
          )}
        </TouchableOpacity>
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
  infoContainer: {
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
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
  },
  passwordHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 8,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#888',
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    marginTop: 4,
    height: 4,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  submitButton: {
    backgroundColor: '#5e3a6c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

export default ChangePasswordScreen;