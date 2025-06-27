import { useState, useContext, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import AuthContext from '../context/AuthContext';
import {
  FaIdCard, FaUser, FaUserTie, FaPhone, FaMapMarkerAlt,
  FaGraduationCap, FaPrint, FaCalendarAlt, FaEdit,
  FaEnvelope, FaIdBadge, FaBuilding, FaSchool
} from 'react-icons/fa';
import '../styles/IDCardGenerator.css';

const IDCardGenerator = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    fatherName: '',
    rollNumber: '',
    phoneNumber: '',
    address: '',
    branch: user?.branch || '',
    academicYear: '2025-2028',
    email: user?.email || '',
    semester: user?.semester || '1'
  });
  const [previewMode, setPreviewMode] = useState(false);
  const idCardRef = useRef();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setPreviewMode(true);
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => idCardRef.current,
    documentTitle: `ID_Card_${formData.name}`,
  });

  // Get branch name from code
  const getBranchName = (code) => {
    const branches = {
      'CSE': 'Computer Science Engineering',
      'IT': 'Information Technology',
      'ME': 'Mechanical Engineering',
      'MEA': 'Mechanical Engineering Auto',
      'CE': 'Civil Engineering',
      'EE': 'Electronic Engineering',
      'PHARM': 'Pharmacy'
    };
    return branches[code] || code;
  };

  // Reset form and go back to edit mode
  const handleEdit = () => {
    setPreviewMode(false);
  };

  return (
    <div className="id-card-page">
      <div className="id-card-container">
        <h1><FaIdCard className="icon" /> Student ID Card Generator</h1>

        {!previewMode ? (
          <div className="id-card-form-container">
            <p className="id-card-instructions">
              <FaIdBadge style={{ marginRight: '8px' }} />
              Fill in the details below to generate a professional student ID card. All fields are required.
            </p>
            <div className="form-decoration-element"></div>

            <form onSubmit={handleSubmit} className="id-card-form">
              <div className="form-group">
                <label htmlFor="name"><FaUser className="icon" /> Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter student's full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fatherName"><FaUserTie className="icon" /> Father's Name</label>
                <input
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  required
                  placeholder="Enter father's name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rollNumber"><FaGraduationCap className="icon" /> Roll Number</label>
                  <input
                    type="text"
                    id="rollNumber"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter roll number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email"><FaEnvelope className="icon" /> Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber"><FaPhone className="icon" /> Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="semester"><FaSchool className="icon" /> Semester</label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address"><FaMapMarkerAlt className="icon" /> Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter address"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branch"><FaBuilding className="icon" /> Branch</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">Computer Science Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="MEA">Mechanical Engineering Auto</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="EE">Electronic Engineering</option>
                    <option value="PHARM">Pharmacy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="academicYear"><FaCalendarAlt className="icon" /> Academic Year</label>
                  <select
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Academic Year</option>
                    <option value="2025-2028">2025-2028</option>
                    <option value="2026-2029">2026-2029</option>
                    <option value="2027-2030">2027-2030</option>
                    <option value="2028-2031">2028-2031</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <span>Generate ID Card</span>
                  <FaIdCard style={{ fontSize: '1.1rem' }} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="id-card-preview-container">
            <div className="preview-decoration-element"></div>
            <div className="id-card-actions">
              <button className="btn btn-secondary" onClick={handleEdit}>
                <FaEdit className="icon" /> Edit Details
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <FaPrint className="icon" /> Print ID Card
              </button>
            </div>

            <div className="id-card-preview" ref={idCardRef}>
              <div className="id-cards-wrapper">
                {/* Front Side - Redesigned */}
                <div className="id-card id-card-front">
                  <div className="id-card-header">
                    <div className="college-name-container">
                      <h2>Government Polytechnic Dehradun</h2>
                    </div>
                  </div>

                  <div className="id-card-body front-body">
                    <div className="watermark-container">
                      <img
                        src="/logo.jpg"
                        alt="College Logo Watermark"
                        className="id-card-watermark"
                      />
                    </div>

                    <div className="front-content">
                      <div className="student-photo-container">
                        {user?.profilePicture ? (
                          <img
                            src={`http://localhost:5000${user.profilePicture}`}
                            alt={formData.name}
                            className="id-card-photo-front"
                          />
                        ) : (
                          <div className="id-card-photo-placeholder-front">
                            <FaUser className="placeholder-icon" />
                          </div>
                        )}
                        <div className="photo-border-decoration"></div>
                      </div>

                      <div className="front-details">
                        <h3 className="front-name">{formData.name}</h3>
                        <div className="student-info-container">
                          <p className="front-branch">{getBranchName(formData.branch)}</p>
                          <p className="front-roll">Roll No: {formData.rollNumber}</p>
                          <p className="front-semester">Semester: {formData.semester}</p>
                          <p className="front-academic-year">Academic Year: {formData.academicYear}</p>
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="id-card-footer front-footer">
                    <div className="front-footer-content">
                      <div className="id-card-signature">
                        <div className="signature-line"></div>
                        <p>Principal's Signature</p>
                      </div>
                      <p className="id-card-validity">Valid for Academic Year {formData.academicYear}</p>
                    </div>
                  </div>
                </div>

                {/* Back Side - Redesigned */}
                <div className="id-card id-card-back">
                  <div className="back-header">
                    <div className="college-name-container">
                      <h2>Government Polytechnic Dehradun</h2>
                    </div>
                  </div>

                  <div className="id-card-body back-body">
                    <div className="watermark-container">
                      <img
                        src="/logo.jpg"
                        alt="College Logo Watermark"
                        className="id-card-watermark"
                      />
                    </div>

                    <div className="id-card-details">
                      <div className="id-card-detail">
                        <span className="detail-label"><FaUser className="icon" /> Name:</span>
                        <span className="detail-value">{formData.name}</span>
                      </div>

                      <div className="id-card-detail">
                        <span className="detail-label"><FaUserTie className="icon" /> Father's Name:</span>
                        <span className="detail-value">{formData.fatherName}</span>
                      </div>


                      <div className="id-card-detail">
                        <span className="detail-label"><FaPhone className="icon" /> Phone:</span>
                        <span className="detail-value">{formData.phoneNumber}</span>
                      </div>

                      <div className="id-card-detail">
                        <span className="detail-label"><FaEnvelope className="icon" /> Email:</span>
                        <span className="detail-value">{formData.email}</span>
                      </div>

                      <div className="id-card-detail">
                        <span className="detail-label"><FaMapMarkerAlt className="icon" /> Address:</span>
                        <span className="detail-value address-value">{formData.address}</span>
                      </div>
                    </div>

                    <div className="back-qr-container">
                      <div className="back-qr">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `Name: ${formData.name}\nRoll No: ${formData.rollNumber}\nBranch: ${getBranchName(formData.branch)}\nSem: ${formData.semester}\nYear: ${formData.academicYear}\nPh: ${formData.phoneNumber}`
                          )}`}
                          alt="QR Code"
                          className="id-card-qr-image back-qr-image"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="id-card-footer back-footer">
                    <div className="back-footer-content">
                      <div className="id-card-signature">
                        <div className="signature-line"></div>
                        <p>Principal's Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IDCardGenerator;
