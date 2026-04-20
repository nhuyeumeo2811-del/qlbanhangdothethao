import React, { useState } from 'react';
import { FaKey, FaEye, FaEyeSlash, FaRegKeyboard, FaUserCircle, FaCalendarAlt } from 'react-icons/fa';
import './Register.css';

const Register = ({ onSwitchTo }) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRegister = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập Họ và tên *';
    if (!dob) newErrors.dob = 'Vui lòng chọn Ngày sinh *';
    if (!username.trim()) newErrors.username = 'Vui lòng nhập SĐT hoặc Email *';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu *';
    if (!confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu *';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (!agreeTerms) {
        alert("Bạn cần đồng ý với Điều khoản sử dụng!");
        return;
      }
      console.log("Đăng ký với:", fullName, dob, username, password);
      alert("Đăng ký thành công!");
    }
  };

  const handleClearError = (field) => setErrors({ ...errors, [field]: '' });

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">Đăng ký tài khoản</h2>

        <form onSubmit={handleRegister}>
          <div className="input-container" style={{ borderColor: errors.fullName ? 'red' : '' }}>
            <FaUserCircle className="input-icon-left text-blue" />
            <input type="text" placeholder="Họ và tên *" value={fullName} onChange={(e) => { setFullName(e.target.value); handleClearError('fullName'); }} />
          </div>
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}

          <div className="input-container" style={{ borderColor: errors.dob ? 'red' : '' }}>
            <FaCalendarAlt className="input-icon-left text-blue" />
            <input type="date" value={dob} style={{ color: dob ? '#333' : '#999' }} onChange={(e) => { setDob(e.target.value); handleClearError('dob'); }} />
          </div>
          {errors.dob && <span className="error-text">{errors.dob}</span>}

          <div className="input-container" style={{ borderColor: errors.username ? 'red' : '' }}>
            <FaRegKeyboard className="input-icon-left text-blue" />
            <input type="text" placeholder="Nhập SĐT hoặc Email *" value={username} onChange={(e) => { setUsername(e.target.value); handleClearError('username'); }} />
          </div>
          {errors.username && <span className="error-text">{errors.username}</span>}

          <div className="input-container" style={{ borderColor: errors.password ? 'red' : '' }}>
            <FaKey className="input-icon-left text-blue" />
            <input type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu *" value={password} onChange={(e) => { setPassword(e.target.value); handleClearError('password'); }} />
            <button type="button" className="eye-btn text-blue" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}

          <div className="input-container" style={{ borderColor: errors.confirmPassword ? 'red' : '' }}>
            <FaKey className="input-icon-left text-blue" />
            <input type={showConfirmPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu *" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); handleClearError('confirmPassword'); }} />
            <button type="button" className="eye-btn text-blue" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}

          <div className="checkbox-group">
            <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            <label htmlFor="terms">Tôi đã đọc và đồng ý với Điều khoản sử dụng & Chính sách bảo mật.</label>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
             <span onClick={() => onSwitchTo('login')} style={{cursor: 'pointer', color: '#0b5394', fontSize: '14px'}}>Đã có tài khoản? Đăng nhập ngay</span>
          </div>

          <button type="submit" className="btn-main-register">Đăng ký</button>
        </form>

        <div className="divider"><span>Hoặc</span></div>

        <button type="button" className="btn-social btn-google"><img src="/icons8-google-48.png" alt="Google" className="social-icon-left" /> Tiếp tục với Google</button>
        <button type="button" className="btn-social btn-facebook"><img src="/icons8-facebook-48.png" alt="Facebook" className="social-icon-left" /> Tiếp tục với Facebook</button>
      </div>
    </div>
  );
};

export default Register;