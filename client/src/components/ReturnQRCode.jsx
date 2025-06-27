import React, { useEffect, useState } from 'react';
import { FaTimes, FaQrcode, FaDownload } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/ReturnQRCode.css';

const ReturnQRCode = ({ bookIssue, onClose }) => {
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    if (bookIssue) {
      // Create QR code data for book return
      const data = {
        issueId: bookIssue._id,
        bookTitle: bookIssue.book.title,
        studentName: bookIssue.studentName || 'Student',
        issueDate: bookIssue.issueDate,
        type: 'book-return'
      };

      setQrData(JSON.stringify(data));
    }
  }, [bookIssue]);

  const handleDownloadQR = () => {
    const canvas = document.getElementById('return-qr-code');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `return-qr-${bookIssue._id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (!bookIssue || !qrData) return null;

  return (
    <div className="return-qr-overlay">
      <div className="return-qr-container">
        <div className="return-qr-header">
          <h2><FaQrcode className="icon" /> Return QR Code</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="return-qr-content">
          <div className="book-info">
            <h3>{bookIssue.book.title}</h3>
            <p>Due Date: {new Date(bookIssue.dueDate).toLocaleDateString()}</p>
            <p className={`status ${bookIssue.status}`}>
              Status: {bookIssue.status.charAt(0).toUpperCase() + bookIssue.status.slice(1)}
            </p>
          </div>

          <div className="qr-code-container">
            <QRCodeCanvas
              id="return-qr-code"
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="return-instructions">
            <p>Show this QR code to the librarian to return the book.</p>
            <button className="btn btn-primary" onClick={handleDownloadQR}>
              <FaDownload className="icon" /> Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnQRCode;
