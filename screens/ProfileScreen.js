import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    displayName: 'Người dùng',
    email: 'user@example.com',
    photoURL: null,
    phoneNumber: '',
    address: '',
    joinDate: '',
  });

  useEffect(() => {
    const user = auth().currentUser;
    
    if (user) {
      // Lấy thông tin cơ bản từ Auth
      const { displayName, email, photoURL, phoneNumber } = user;
      
      // Lấy ngày tạo tài khoản
      const creationTime = new Date(user.metadata.creationTime);
      const formattedDate = `${creationTime.getDate()}/${creationTime.getMonth() + 1}/${creationTime.getFullYear()}`;
      
      setUserProfile({
        displayName: displayName || 'Người dùng',
        email: email || 'user@example.com',
        photoURL,
        phoneNumber: phoneNumber || '',
        address: '',
        joinDate: formattedDate,
      });
      
      // Lấy thông tin chi tiết từ Firestore
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          setLoading(false);
          
          if (documentSnapshot.exists) {
            const userData = documentSnapshot.data();
            setUserProfile(prev => ({
              ...prev,
              displayName: userData.displayName || prev.displayName,
              photoURL: userData.photoURL || prev.photoURL,
              phoneNumber: userData.phoneNumber || prev.phoneNumber,
              address: userData.address || '',
            }));
          }
        }, error => {
          console.error("Lỗi khi đọc dữ liệu:", error);
          setLoading(false);
        });
        
      return () => unsubscribe();
    } else {
      // Người dùng chưa đăng nhập, chuyển về màn hình đăng nhập
      navigation.navigate('Login');
    }
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        {userProfile.photoURL ? (
          <Image 
            source={{ uri: userProfile.photoURL }} 
            style={styles.profileAvatar} 
          />
        ) : (
          <View style={[styles.profileAvatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {userProfile.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.profileName}>{userProfile.displayName}</Text>
        <Text style={styles.profileEmail}>{userProfile.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        
        <View style={styles.infoItem}>
          <Icon name="phone" size={20} color="#0066cc" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>
            {userProfile.phoneNumber || 'Chưa cập nhật'}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="map-marker" size={20} color="#0066cc" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Địa chỉ</Text>
          <Text style={styles.infoValue}>
            {userProfile.address || 'Chưa cập nhật'}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="calendar" size={20} color="#0066cc" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Ngày tham gia</Text>
          <Text style={styles.infoValue}>{userProfile.joinDate}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate('ChangePasswordScreen')}
      >
        <Text style={styles.editButtonText}>Đổi mật khẩu</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.editButton, { backgroundColor: '#cc0000' }]}
        onPress={() => {
          auth()
            .signOut()
            .then(() => navigation.navigate('Login'))
            .catch(error => console.error('Lỗi đăng xuất:', error));
        }}
      >
        <Text style={styles.editButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  defaultAvatar: {
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoIcon: {
    marginRight: 10,
    width: 25,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#0066cc',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;