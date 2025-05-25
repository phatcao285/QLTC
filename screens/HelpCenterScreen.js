import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

const HelpCenterScreen = ({ navigation }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(false);

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleContactSupport = async () => {
    try {
      await Linking.openURL('mailto:support@financeapp.com?subject=Hỗ trợ từ ứng dụng');
    } catch (error) {
      console.error('Error opening email app:', error);
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
        <Text style={styles.headerTitle}>Trung tâm trợ giúp</Text>
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
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.iconContainer}>
            <Icon name="support-agent" size={80} color="#5e3a6c" />
          </View>
          <Text style={styles.bannerTitle}>Chúng tôi luôn sẵn sàng hỗ trợ bạn</Text>
          <Text style={styles.bannerSubtitle}>
            Tìm kiếm giải pháp cho vấn đề của bạn hoặc liên hệ trực tiếp với đội ngũ hỗ trợ của chúng tôi
          </Text>
        </View>
        
        {/* Contact */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
          
          <View style={styles.contactContainer}>
            <View style={styles.contactItem}>
              <Icon name="email" size={24} color="#5e3a6c" style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@financeapp.com</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <Icon name="phone" size={24} color="#5e3a6c" style={styles.contactIcon} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Điện thoại</Text>
                <Text style={styles.contactValue}>1900 1234 (8h-22h hàng ngày)</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactSupport}
            >
              <Icon name="chat" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.contactButtonText}>Liên hệ ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* FAQs */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          
          <TouchableOpacity 
            style={styles.faqItem}
            onPress={() => toggleSection('faq1')}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Làm thế nào để thêm một giao dịch mới?</Text>
              <Icon 
                name={expandedSection === 'faq1' ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
            {expandedSection === 'faq1' && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>
                  Để thêm một giao dịch mới, bạn chỉ cần nhấn vào nút + ở giữa thanh điều hướng phía dưới màn hình. Sau đó, nhập các thông tin như loại giao dịch (chi tiêu hoặc thu nhập), danh mục, số tiền, ngày tháng và ghi chú (nếu cần). Nhấn "Lưu" để hoàn tất việc thêm giao dịch.
                </Text>
                <View style={styles.iconExampleContainer}>
                  <Icon name="add-circle" size={50} color="#5db7b7" />
                  <Icon name="arrow-forward" size={24} color="#888" />
                  <Icon name="attach-money" size={50} color="#5e3a6c" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.faqItem}
            onPress={() => toggleSection('faq2')}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Làm thế nào để xem báo cáo chi tiêu?</Text>
              <Icon 
                name={expandedSection === 'faq2' ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
            {expandedSection === 'faq2' && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>
                  Để xem báo cáo chi tiêu, bạn vào màn hình chính và cuộn xuống phần "Thống kê". Tại đây, bạn sẽ thấy các biểu đồ thể hiện chi tiêu theo danh mục, xu hướng chi tiêu theo thời gian, và tổng thu/chi. Bạn có thể nhấn vào từng biểu đồ để xem thông tin chi tiết hơn hoặc chọn khoảng thời gian khác để xem báo cáo (ngày, tuần, tháng, năm).
                </Text>
                <View style={styles.iconExampleContainer}>
                  <Icon name="pie-chart" size={50} color="#5e3a6c" />
                  <Icon name="bar-chart" size={50} color="#5db7b7" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.faqItem}
            onPress={() => toggleSection('faq3')}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Làm thế nào để thiết lập ngân sách hàng tháng?</Text>
              <Icon 
                name={expandedSection === 'faq3' ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
            {expandedSection === 'faq3' && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>
                  Để thiết lập ngân sách hàng tháng, vào màn hình chính và nhấn vào phần "Ngân sách". Sau đó, nhấn "Thêm ngân sách mới" và chọn danh mục bạn muốn thiết lập ngân sách. Nhập số tiền giới hạn cho danh mục đó và chọn khoảng thời gian (ngày, tuần, tháng). Ứng dụng sẽ tự động theo dõi chi tiêu của bạn và cảnh báo khi bạn gần đạt đến giới hạn ngân sách.
                </Text>
                <Text style={styles.faqAnswerTextBold}>
                  Lưu ý: Bạn có thể thiết lập nhiều ngân sách cho các danh mục khác nhau.
                </Text>
                <View style={styles.iconExampleContainer}>
                  <Icon name="account-balance-wallet" size={50} color="#5e3a6c" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.faqItem}
            onPress={() => toggleSection('faq4')}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Làm thế nào để khôi phục mật khẩu?</Text>
              <Icon 
                name={expandedSection === 'faq4' ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
            {expandedSection === 'faq4' && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>
                  Để khôi phục mật khẩu, tại màn hình đăng nhập, nhấn vào "Quên mật khẩu". Nhập địa chỉ email bạn đã đăng ký và nhấn "Gửi". Hệ thống sẽ gửi một email có chứa liên kết đặt lại mật khẩu. Nhấp vào liên kết này và làm theo hướng dẫn để tạo mật khẩu mới.
                </Text>
                <Text style={styles.faqAnswerTextBold}>
                  Nếu bạn không nhận được email, vui lòng kiểm tra thư mục spam hoặc liên hệ với bộ phận hỗ trợ.
                </Text>
                <View style={styles.iconExampleContainer}>
                  <Icon name="lock-open" size={50} color="#5e3a6c" />
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.faqItem}
            onPress={() => toggleSection('faq5')}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Dữ liệu của tôi có được bảo mật không?</Text>
              <Icon 
                name={expandedSection === 'faq5' ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
            {expandedSection === 'faq5' && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>
                  Có, chúng tôi rất coi trọng bảo mật dữ liệu của người dùng. Tất cả dữ liệu được mã hóa và lưu trữ an toàn trên máy chủ của chúng tôi. Chúng tôi không chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào mà không có sự đồng ý của bạn. Bạn cũng có thể kích hoạt xác thực hai yếu tố để tăng cường bảo mật cho tài khoản của mình.
                </Text>
                <View style={styles.iconExampleContainer}>
                  <Icon name="security" size={50} color="#5e3a6c" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Tips */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mẹo quản lý tài chính</Text>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <View style={styles.tipNumberContainer}>
                <Text style={styles.tipNumber}>1</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Theo dõi mọi khoản chi tiêu</Text>
                <Text style={styles.tipDescription}>
                  Ghi lại tất cả các khoản chi tiêu, dù nhỏ như một ly cà phê. Những khoản nhỏ cộng lại có thể tạo ra sự khác biệt lớn trong ngân sách của bạn.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipItem}>
              <View style={styles.tipNumberContainer}>
                <Text style={styles.tipNumber}>2</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Thiết lập mục tiêu tiết kiệm</Text>
                <Text style={styles.tipDescription}>
                  Xác định mục tiêu tiết kiệm cụ thể và thực tế. Ví dụ: tiết kiệm 20% thu nhập mỗi tháng hoặc tiết kiệm cho một kỳ nghỉ cụ thể.
                </Text>
              </View>
            </View>
            
            <View style={styles.tipItem}>
              <View style={styles.tipNumberContainer}>
                <Text style={styles.tipNumber}>3</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Kiểm tra báo cáo thường xuyên</Text>
                <Text style={styles.tipDescription}>
                  Dành thời gian mỗi tuần để xem xét chi tiêu của bạn và điều chỉnh ngân sách nếu cần. Việc kiểm tra thường xuyên giúp bạn duy trì kiểm soát tài chính.
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* About */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Về ứng dụng</Text>
          
          <View style={styles.aboutContainer}>
            <Text style={styles.versionInfo}>Phiên bản: 1.0.0</Text>
            <Text style={styles.aboutText}>
              Finance App là công cụ quản lý tài chính cá nhân giúp bạn theo dõi thu chi, thiết lập ngân sách và đạt được mục tiêu tài chính của mình.
            </Text>
            <Text style={styles.aboutText}>
              Được phát triển bởi Finance App Team với tâm huyết mang đến trải nghiệm quản lý tài chính đơn giản và hiệu quả cho người dùng Việt Nam.
            </Text>
            <Text style={styles.copyRight}>© 2025 Finance App. Tất cả quyền được bảo lưu.</Text>
          </View>
        </View>

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
  bannerContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactContainer: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIcon: {
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  contactButton: {
    backgroundColor: '#5e3a6c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    marginTop: 8,
    paddingVertical: 8,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  faqAnswerTextBold: {
    fontSize: 14,
    color: '#5e3a6c',
    fontWeight: 'bold',
    marginTop: 8,
  },
  iconExampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  tipsContainer: {
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5e3a6c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  aboutContainer: {
    alignItems: 'center',
  },
  versionInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  copyRight: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
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

export default HelpCenterScreen;