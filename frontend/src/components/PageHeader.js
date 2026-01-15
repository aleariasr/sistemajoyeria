import React from 'react';
import SystemClock from './SystemClock';
import '../styles/PageHeader.css';

/**
 * PageHeader Component
 * Provides a consistent header layout for all pages with integrated system clock
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Optional page subtitle/description
 * @param {React.ReactNode} props.children - Optional additional content (breadcrumbs, actions, etc.)
 */
function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header with-actions">
      <div className="page-header-content">
        {title && <h2>{title}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header-actions">
        {children}
        <SystemClock />
      </div>
    </div>
  );
}

export default PageHeader;
