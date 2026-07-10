//C:\quran-similarity-app\frontend\src\features\auth\components\DashboardCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const DashboardCard = ({ title, description, linkTo, buttonText, color, isExternal }) => {
  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    borderTop: `5px solid ${color}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const titleStyle = { fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '10px' };
  const descStyle = { fontSize: '14px', color: '#6B7280', lineHeight: '1.5', marginBottom: '20px', flex: 1 };
  const btnStyle = {
    background: color,
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    textAlign: 'center',
    display: 'block'
  };

  if (isExternal) {
    return (
      <a href={linkTo} target="_blank" rel="noopener noreferrer" style={cardStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descStyle}>{description}</p>
        <div style={btnStyle}>{buttonText}</div>
      </a>
    );
  }

  return (
    <Link to={linkTo} style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      <div style={btnStyle}>{buttonText}</div>
    </Link>
  );
};

export default DashboardCard;