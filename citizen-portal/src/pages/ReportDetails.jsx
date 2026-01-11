import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { formatDate } from '../shared/utils';
import './ReportDetails.css';

function ReportDetails() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      navigate('/dashboard');
      return;
    }

    const reportRef = doc(db, 'reports', reportId);
    
    // Real-time listener
    const unsubscribe = onSnapshot(reportRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setReport({ id: docSnapshot.id, ...docSnapshot.data() });
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [reportId, navigate]);

  const getClassificationBadge = (classification) => {
    if (!classification || classification === 'none' || classification === 'unknown') {
      return <span className="badge badge-gray">Unknown</span>;
    }
    const colors = {
      dry: '#3B82F6',
      wet: '#10B981',
      mixed: '#F59E0B'
    };
    return (
      <span className="badge" style={{ backgroundColor: colors[classification.toLowerCase()] || '#6B7280' }}>
        {classification.toUpperCase()}
      </span>
    );
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      red: '#EF4444',
      yellow: '#F59E0B',
      green: '#10B981'
    };
    return (
      <span className="severity-badge" style={{ backgroundColor: colors[severity?.toLowerCase()] || '#6B7280' }}>
        {severity?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="report-details-container">
        <div className="loading">Loading report details...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-details-container">
        <div className="error">Report not found</div>
      </div>
    );
  }

  const aiAnalysis = report.aiAnalysisDetails || {};
  // Show AI analysis if it exists, regardless of status
  const hasAIAnalysis = report.aiAnalyzedAt || 
                        report.aiAnalysisDetails || 
                        report.classification || 
                        report.level || 
                        report.wasteType ||
                        report.imageValid !== undefined;
  const isVerified = report.status === 'verified' || report.status === 'assigned' || hasAIAnalysis;

  return (
    <div className="report-details-container">
      <div className="report-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1>Report Details</h1>
      </div>

      <div className="report-content">
        {/* Image Section */}
        <div className="image-section">
          <h2>Reported Image</h2>
          {report.imageBefore && (
            <img src={report.imageBefore} alt="Waste report" className="report-image" />
          )}
          {report.imageAfter && (
            <div className="after-image">
              <h3>After Cleaning</h3>
              <img src={report.imageAfter} alt="After cleaning" className="report-image" />
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="ai-analysis-section">
          <h2>🤖 AI Analysis Results</h2>
          
          {hasAIAnalysis ? (
            <div className="ai-results">
              <div className="ai-result-card">
                <div className="ai-label">Image Validation:</div>
                <div className="ai-value">
                  {report.imageValid !== undefined ? (report.imageValid ? '✅ Valid' : '❌ Invalid') : '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Real Photo:</div>
                <div className="ai-value">
                  {report.isRealPhoto !== undefined ? (report.isRealPhoto ? '✅ Yes' : '❌ No') : '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Fake Detection:</div>
                <div className="ai-value">
                  {report.isFake !== undefined ? (report.isFake ? '❌ Fake/Stock Photo' : '✅ Real Photo') : '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Waste Detected:</div>
                <div className="ai-value">
                  {report.wasteDetected ? (report.wasteDetected === 'yes' ? '✅ Yes' : '❌ No') : '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Waste Type:</div>
                <div className="ai-value">{report.wasteType || aiAnalysis.wasteType || '⏳ Pending'}</div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Waste Amount:</div>
                <div className="ai-value">{report.wasteAmount || aiAnalysis.wasteAmount || '⏳ Pending'}</div>
              </div>

              <div className="ai-result-card highlight">
                <div className="ai-label">Classification:</div>
                <div className="ai-value">
                  {report.classification || aiAnalysis.classification ? 
                    getClassificationBadge(report.classification || aiAnalysis.classification) : 
                    <span style={{ color: '#6b7280' }}>⏳ Pending</span>}
                </div>
              </div>

              <div className="ai-result-card highlight">
                <div className="ai-label">Severity:</div>
                <div className="ai-value">
                  {report.level || aiAnalysis.severity ? 
                    getSeverityBadge(report.level || aiAnalysis.severity) : 
                    <span style={{ color: '#6b7280' }}>⏳ Pending</span>}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">Priority:</div>
                <div className="ai-value">
                  {report.priority ? 
                    (report.priority === 1 ? '🔴 High' : report.priority === 2 ? '🟡 Medium' : '🟢 Low') : 
                    '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">AI Confidence:</div>
                <div className="ai-value">
                  {report.aiConfidence || aiAnalysis.confidence ? 
                    `${((report.aiConfidence || aiAnalysis.confidence || 0) * 100).toFixed(0)}%` : 
                    '⏳ Pending'}
                </div>
              </div>

              <div className="ai-result-card">
                <div className="ai-label">AI Description:</div>
                <div className="ai-value description">
                  {report.aiDescription || aiAnalysis.description || '⏳ AI analysis in progress...'}
                </div>
              </div>
              
              {report.locationValidation && (
                <div className="ai-result-card">
                  <div className="ai-label">Location Validation:</div>
                  <div className="ai-value">
                    {report.locationValidation.isValid ? '✅ Valid' : '⚠️ Warning'}
                    {report.locationValidation.warnings && report.locationValidation.warnings.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        {report.locationValidation.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ai-pending">
              <p>⏳ AI analysis in progress...</p>
              <p className="status-text">Status: {report.status}</p>
              <p className="status-text" style={{ fontSize: '12px', marginTop: '10px', color: '#6b7280' }}>
                The AI agent is analyzing your image. This usually takes 10-20 seconds.
                <br />
                If this persists, check if Cloud Functions are deployed and GEMINI_KEY is set.
              </p>
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="location-section">
          <h2>📍 Location Details</h2>
          <div className="location-info">
            <div className="info-item">
              <span className="info-label">Address:</span>
              <span className="info-value">{report.location?.address || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Coordinates:</span>
              <span className="info-value">
                {report.location?.lat?.toFixed(6)}, {report.location?.lng?.toFixed(6)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Reported:</span>
              <span className="info-value">{formatDate(report.createdAt)}</span>
            </div>
            {report.aiAnalyzedAt && (
              <div className="info-item">
                <span className="info-label">AI Analyzed:</span>
                <span className="info-value">{formatDate(report.aiAnalyzedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        <div className="status-section">
          <h2>📊 Report Status</h2>
          <div className="status-info">
            <div className="status-badge-large" data-status={report.status}>
              {report.status.toUpperCase()}
            </div>
            {report.assignedSweeper && (
              <div className="info-item">
                <span className="info-label">Assigned To:</span>
                <span className="info-value">Sweeper ID: {report.assignedSweeper.slice(0, 8)}...</span>
              </div>
            )}
            {report.cleanedAt && (
              <div className="info-item">
                <span className="info-label">Cleaned At:</span>
                <span className="info-value">{formatDate(report.cleanedAt)}</span>
              </div>
            )}
            {report.verifiedAt && (
              <div className="info-item">
                <span className="info-label">Verified At:</span>
                <span className="info-value">{formatDate(report.verifiedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;

