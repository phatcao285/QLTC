import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';

const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email!');
      return;
    }
    setLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Thành công', 'Đã gửi email đặt lại mật khẩu!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập địa chỉ email để nhận liên kết đặt lại mật khẩu.</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        left={<TextInput.Icon name={() => <Icon name="email" size={20} />} />}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button
        mode="contained"
        onPress={handleSendEmail}
        loading={loading}
        style={styles.button}
      >
        Gửi Email
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Quay lại đăng nhập
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#555',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginBottom: 12,
  },
});

export default ForgetPassword; 