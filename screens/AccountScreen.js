import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';  // Add Storage import
import NetInfo from '@react-native-community/netinfo';
import { launchImageLibrary } from 'react-native-image-picker';
import Modal from 'react-native-modal';

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Image states
  const [imageUrlModalVisible, setImageUrlModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Get user and profile data
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      navigation.navigate('Login');
      return;
    }
    
    setUser(currentUser);
    setEmail(currentUser.email || '');
    setAvatarUrl(currentUser.photoURL || '');
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Sử dụng dữ liệu từ Auth nếu không thể truy cập Firestore
        const fallbackProfile = {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          avatar: currentUser.photoURL || ''
        };
        
        setUserProfile(fallbackProfile);
        setDisplayName(fallbackProfile.name);
        setPhone('');
        
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
          
          if (userDoc.exists) {
            const profileData = userDoc.data() || {};
            setUserProfile(profileData);
            setDisplayName(profileData.name || currentUser.displayName || '');
            setPhone(profileData.phone || '');
            
            // Sử dụng ảnh từ profile nếu có, nếu không thì từ Auth
            const profilePhoto = profileData.avatar || currentUser.photoURL;
            if (profilePhoto) {
              setAvatarUrl(profilePhoto);
            }
          }
        } catch (firestoreError) {
          console.error('Error accessing Firestore:', firestoreError);
          // Vẫn sử dụng profile từ Auth nếu không thể truy cập Firestore
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigation]);
  
  // Xử lý nhập URL ảnh
  const handleImageUrlInput = () => {
    setImageUrlModalVisible(true);
  };
  
  // Xử lý lưu URL ảnh đã nhập - improved with validation
  const handleSaveImageUrl = () => {
    if (!imageUrlInput || !imageUrlInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập URL ảnh hợp lệ');
      return;
    }
    
    // Kiểm tra URL có hợp lệ không
    try {
      const url = new URL(imageUrlInput);
      
      // Check if URL length is acceptable for Firebase Auth (safe limit is around 2000 chars)
      if (imageUrlInput.length > 2000) {
        Alert.alert('Lỗi', 'URL quá dài. Vui lòng sử dụng URL ngắn hơn hoặc tải lên ảnh trực tiếp.');
        return;
      }
      
      // Additional check for common image extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => 
        url.pathname.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        Alert.alert(
          'Cảnh báo', 
          'URL không chứa phần mở rộng hình ảnh phổ biến. Bạn có chắc đây là URL hình ảnh không?',
          [
            {
              text: 'Hủy',
              style: 'cancel',
            },
            {
              text: 'Tiếp tục',
              onPress: () => {
                setAvatarUrl(imageUrlInput);
                setImageUrlModalVisible(false);
                updateProfilePhoto(imageUrlInput);
              }
            }
          ]
        );
        return;
      }
      
      // If all checks pass
      setAvatarUrl(imageUrlInput);
      setImageUrlModalVisible(false);
      updateProfilePhoto(imageUrlInput);
    } catch (e) {
      Alert.alert('Lỗi', 'URL không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };
  
  // Modified to use Firebase Storage instead of base64
  const pickImageFromLibrary = () => {
    if (isOffline) {
      Alert.alert('Lỗi', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để thay đổi ảnh.');
      return;
    }
    
    const options = {
      mediaType: 'photo',
      includeBase64: false, // Changed to false since we'll use the URI
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.7
    };
    
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        const source = response.assets[0];
        setFormLoading(true);
        
        // Use the URI to upload to Firebase Storage
        uploadImageToStorage(source.uri);
      }
    });
  };
  
  // New function to upload image to Firebase Storage
  const uploadImageToStorage = async (uri) => {
    try {
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = storage().ref(`profile_pictures/${user.uid}/${filename}`);
      
      // Create upload task
      const task = storageRef.putFile(uri);
      
      // Monitor upload progress
      task.on('state_changed', snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log(`Upload is ${progress}% done`);
      });
      
      // Wait for upload to complete
      await task;
      
      // Get the download URL
      const downloadURL = await storageRef.getDownloadURL();
      
      // Set the URL and update profile
      setAvatarUrl(downloadURL);
      updateProfilePhoto(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Lỗi', 'Không thể tải lên ảnh: ' + error.message);
      setFormLoading(false);
    }
  };
  
  // Cập nhật ảnh vào Firebase Auth và Firestore
  const updateProfilePhoto = async (photoUrl) => {
    if (!user) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    try {
      // Cập nhật trong Authentication
      await user.updateProfile({
        photoURL: photoUrl
      });
      
      // Cập nhật trong Firestore - sử dụng set với merge thay vì update
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            avatar: photoUrl,
            updatedAt: firestore.FieldValue.serverTimestamp()
          }, { merge: true }); // Sử dụng merge: true
        
        // Cập nhật local user state
        setUser({...user, photoURL: photoUrl});
        setUserProfile(prev => ({...prev, avatar: photoUrl}));
        
        Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật.');
      } catch (firestoreError) {
        console.error('Lỗi khi cập nhật Firestore:', firestoreError);
        // Vẫn tiếp tục với Auth đã cập nhật
        Alert.alert('Thông báo', 'Ảnh đại diện đã được cập nhật trong Auth nhưng không thể cập nhật trong cơ sở dữ liệu.');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật ảnh đại diện:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện: ' + error.message);
    } finally {
      setFormLoading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle saving profile changes
  const handleSaveChanges = async () => {
    if (isOffline) {
      Alert.alert('Lỗi', 'Bạn đang ngoại tuyến. Vui lòng kết nối mạng để cập nhật thông tin.');
      return;
    }
    
    if (!user) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    try {
      setFormLoading(true);
      
      // Update display name in Auth if changed
      if (user.displayName !== displayName) {
        await user.updateProfile({
          displayName: displayName
        });
      }
      
      // Sử dụng set với merge: true thay vì update
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            name: displayName || '',
            phone: phone || '',
            email: email || '',  // Đảm bảo email luôn được cập nhật
            avatar: avatarUrl || '', // Lưu ảnh vào profile
            updatedAt: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        
        setUserProfile(prevProfile => ({
          ...(prevProfile || {}),
          name: displayName || '',
          phone: phone || '',
          email: email || '',
          avatar: avatarUrl || ''
        }));
        
        Alert.alert('Thành công', 'Thông tin tài khoản đã được cập nhật.');
      } catch (firestoreError) {
        console.error('Lỗi khi cập nhật Firestore:', firestoreError);
        // Vẫn tiếp tục với Auth đã cập nhật
        Alert.alert('Thông báo', 'Thông tin cơ bản đã được cập nhật nhưng không thể cập nhật đầy đủ trong cơ sở dữ liệu.');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin tài khoản: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e3a6c" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
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
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSaveChanges() : setIsEditing(true)}
          disabled={formLoading}
        >
          {formLoading ? (
            <ActivityIndicator size="small" color="#5e3a6c" />
          ) : (
            <Icon name={isEditing ? "check" : "edit"} size={24} color="#5e3a6c" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>Bạn đang ngoại tuyến</Text>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {/* Profile picture */}
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: avatarUrl || 'https://i.imgur.com/0y0y0y0.jpg' }} 
            style={styles.profileImage}
            onError={() => setAvatarUrl('https://i.imgur.com/0y0y0y0.jpg')}
          />
          {isEditing && (
            <View style={styles.imageEditButtons}>
              <TouchableOpacity 
                style={styles.changePictureButton}
                onPress={pickImageFromLibrary}
              >
                <Icon name="photo-library" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.linkPictureButton}
                onPress={handleImageUrlInput}
              >
                <Icon name="link" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Add upload progress indicator */}
          {formLoading && uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{`${Math.round(uploadProgress)}%`}</Text>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
          )}
        </View>
        
        {/* User information form */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Họ và tên</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Nhập họ và tên"
              />
            ) : (
              <Text style={styles.infoValue}>{displayName || 'Chưa cập nhật'}</Text>
            )}
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email || 'Chưa cập nhật'}</Text>
            {isEditing && (
              <Text style={styles.hintText}>Email không thể thay đổi</Text>
            )}
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{phone || 'Chưa cập nhật'}</Text>
            )}
          </View>
          
          {userProfile?.createdAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày tham gia</Text>
              <Text style={styles.infoValue}>
                {userProfile.createdAt && userProfile.createdAt.toDate ? 
                  userProfile.createdAt.toDate().toLocaleDateString('vi-VN') : 
                  'Không xác định'}
              </Text>
            </View>
          )}
        </View>
        
        {isEditing && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={formLoading}
          >
            {formLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Modal nhập URL ảnh */}
      <Modal
        isVisible={imageUrlModalVisible}
        onBackdropPress={() => setImageUrlModalVisible(false)}
        onBackButtonPress={() => setImageUrlModalVisible(false)}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nhập URL ảnh từ Google</Text>
          
          <TextInput
            style={styles.urlInput}
            value={imageUrlInput}
            onChangeText={setImageUrlInput}
            placeholder="https://example.com/image.jpg"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setImageUrlModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={handleSaveImageUrl}
            >
              <Text style={styles.confirmButtonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageEditButtons: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    right: '25%',
  },
  changePictureButton: {
    backgroundColor: '#5e3a6c',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  linkPictureButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  infoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#5e3a6c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  // Modal styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e3a6c',
    marginBottom: 20,
    textAlign: 'center',
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#5e3a6c',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Upload progress styles
  progressContainer: {
    position: 'absolute',
    bottom: -30,
    width: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    height: 20,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#5e3a6c',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000',
    fontSize: 12,
    lineHeight: 20,
    zIndex: 1,
  },
});

export default AccountScreen;