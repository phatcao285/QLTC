import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  // Đăng nhập với email/password
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      navigation.replace('MainApp');
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email không tồn tại';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mật khẩu không chính xác';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#512DA8" barStyle="light-content" />
      
      {/* Phần header với gradient */}
      <LinearGradient
        colors={['#673AB7', '#512DA8']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
          style={styles.logo}
        />
      </LinearGradient>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formSection}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Surface style={styles.formContainer}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                left={<TextInput.Icon icon="email" color="#673AB7" />}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                outlineColor="#e0e0e0"
                activeOutlineColor="#673AB7"
                theme={{ roundness: 10 }}
              />
              
              <TextInput
                mode="outlined"
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                left={<TextInput.Icon icon="lock" color="#673AB7" />}
                right={
                  <TextInput.Icon
                    icon={hidePassword ? "eye" : "eye-off"}
                    color="#673AB7"
                    onPress={() => setHidePassword(!hidePassword)}
                  />
                }
                style={styles.input}
                secureTextEntry={hidePassword}
                outlineColor="#e0e0e0"
                activeOutlineColor="#673AB7"
                theme={{ roundness: 10 }}
              />
              
              <TouchableOpacity 
                style={styles.forgotContainer} 
                onPress={() => navigation.navigate('ForgetPassword')}
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
              
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                uppercase={false}
                disabled={loading}
                color="#673AB7"
              >
                <Text style={styles.buttonText}>Đăng Nhập</Text>
              </Button>
            </View>
          </Surface>
          
          <View style={styles.bottomContainer}>
            <Text style={styles.noAccountText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 10,
  },
  formSection: {
    flex: 1,
    marginTop: -40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  formContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#673AB7',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 10,
    elevation: 2,
  },
  buttonContent: {
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  noAccountText: {
    color: '#666',
    fontSize: 15,
  },
  registerText: {
    color: '#673AB7',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginScreen;