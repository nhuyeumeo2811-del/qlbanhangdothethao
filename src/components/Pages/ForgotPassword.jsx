import React, { useState } from 'react';
import { FaRegKeyboard, FaChevronLeft } from 'react-icons/fa';
import './ForgotPassword.css';

const ForgotPassword = ({ onSwitchTo }) => {
  const [contactInfo, setContactInfo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contactInfo.trim()) {
      setError('Vui lòng nhập Số điện thoại hoặc Email *');
      return;
    }
    setError('');
    console.log("Yêu cầu gửi mã OTP đến:", contactInfo);
    alert(`Hệ thống đang gửi mã OTP đến: ${contactInfo}`);
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h2 className="forgot-title">Khôi phục mật khẩu</h2>
        <p className="forgot-subtitle">(Vui lòng nhập Số điện thoại hoặc Email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận (OTP) để đặt lại mật khẩu.)</p>

        <form onSubmit={handleSubmit}>
          <div className="input-container" style={{ borderColor: error ? 'red' : '' }}>
            <FaRegKeyboard className="input-icon-left text-blue" />
            <input
              type="text"
              placeholder="Nhập SĐT hoặc Email *"
              value={contactInfo}
              onChange={(e) => { setContactInfo(e.target.value); setError(''); }}
            />
          </div>
          {error && <span className="error-text">{error}</span>}

          <button type="submit" className="btn-main-forgot">Nhận mã</button>
        </form>

        <div className="back-to-login">
          <span onClick={() => onSwitchTo('login')} className="back-link" style={{cursor: 'pointer'}}>
            <FaChevronLeft className="back-icon" /> Quay lại đăng nhập
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;