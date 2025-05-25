import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({
        displayName: name,
        photoURL: avatar || undefined,
      });
      Alert.alert('Thành công', 'Đăng ký thành công!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <View style={styles.iconContainer}>
        <Icon name="account-circle" size={100} color="#178387" />
      </View>
      <TextInput
        label="Họ và tên"
        value={name}
        onChangeText={setName}
        left={<TextInput.Icon name={() => <Icon name="person" size={20} />} />}
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        left={<TextInput.Icon name={() => <Icon name="email" size={20} />} />}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        left={<TextInput.Icon name={() => <Icon name="lock" size={20} />} />}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        label="Ảnh đại diện (URL)"
        value={avatar}
        onChangeText={setAvatar}
        left={<TextInput.Icon name={() => <Icon name="image" size={20} />} />}
        style={styles.input}
        autoCapitalize="none"
      />
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        style={styles.registerButton}
        contentStyle={styles.buttonContent}
      >
        Đăng Ký
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.loginButton}
        contentStyle={styles.buttonContent}
      >
        Đã có tài khoản? Đăng nhập
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  registerButton: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  loginButton: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buttonContent: {
    height: 48,
    justifyContent: 'center',
  },
});

export default RegisterScreen; 