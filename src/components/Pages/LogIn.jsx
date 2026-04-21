import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaRegKeyboard } from 'react-icons/fa';
import './LogIn.css';

const LogIn = ({ onSwitchTo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({}); 

  const handleLogin = (e) => {
    e.preventDefault();
    let newErrors = {};

    // Kiểm tra dữ liệu trống
    if (!username.trim()) newErrors.username = 'Vui lòng nhập SĐT hoặc Email *';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu *';

    setErrors(newErrors);

    // Nếu không có lỗi thì mới cho đăng nhập
    if (Object.keys(newErrors).length === 0) {
      console.log("Đang đăng nhập với:", username, password);
      alert("Đăng nhập thành công!");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Đăng nhập</h2>

        <form onSubmit={handleLogin}>
          <div className="input-container" style={{ borderColor: errors.username ? 'red' : '' }}>
            <FaRegKeyboard className="input-icon-left text-blue" />
            <input
              type="text"
              placeholder="Nhập SĐT hoặc Email *"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: '' }); // Tự xóa lỗi khi gõ
              }}
            />
          </div>
          {errors.username && <span className="error-text">{errors.username}</span>}

          <div className="input-container" style={{ borderColor: errors.password ? 'red' : '' }}>
            <FaLock className="input-icon-left text-blue" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu *"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
              }}
            />
            <button type="button" className="eye-btn text-blue" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}

          <div className="links-group">
            <span onClick={() => onSwitchTo('register')} className="link-register" style={{cursor: 'pointer'}}>Chưa có tài khoản?</span>
            <span onClick={() => onSwitchTo('forgot')} className="link-forgot" style={{cursor: 'pointer'}}>Quên mật khẩu?</span>
          </div>

          <button type="submit" className="btn-main-login">Đăng nhập</button>
        </form>

        <div className="divider"><span>Hoặc</span></div>

        <button type="button" className="btn-social btn-google">
          <img src="/icons8-google-48.png" alt="Google" className="social-icon-left" />
          Tiếp tục với Google
        </button>

        <button type="button" className="btn-social btn-facebook">
          <img src="/icons8-facebook-48.png" alt="Facebook" className="social-icon-left" />
          Tiếp tục với Facebook
        </button>
      </div>
    </div>
  );
};

export default LogIn;