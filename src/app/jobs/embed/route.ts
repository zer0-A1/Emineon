import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company') || 'Emineon';
  const theme = searchParams.get('theme') || 'light';
  const maxJobs = parseInt(searchParams.get('max') || '5');

  const embedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    .emineon-jobs-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#000000'};
    }
    .emineon-job-item {
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 0;
      margin-bottom: 16px;
    }
    .emineon-job-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .emineon-job-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #2563eb;
    }
    .emineon-job-meta {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .emineon-job-description {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .emineon-apply-btn {
      background: #2563eb;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      display: inline-block;
    }
    .emineon-apply-btn:hover {
      background: #1d4ed8;
    }
    .emineon-widget-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .emineon-widget-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .emineon-powered-by {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="emineon-jobs-widget">
    <div class="emineon-widget-header">
      <div class="emineon-widget-title">Join ${companyName}</div>
      <div>Current Open Positions</div>
    </div>
    <div id="emineon-jobs-list">Loading...</div>
    <div class="emineon-powered-by">
      Powered by <a href="https://emineon.com" target="_blank">Emineon ATS</a>
    </div>
  </div>

  <script>
    (function() {
      fetch('${process.env.NEXT_PUBLIC_SITE_URL || 'https://app-emineon.vercel.app'}/api/public/jobs.json')
        .then(response => response.json())
        .then(data => {
          const container = document.getElementById('emineon-jobs-list');
          if (data.jobs && data.jobs.length > 0) {
            const jobsToShow = data.jobs.slice(0, ${maxJobs});
            container.innerHTML = jobsToShow.map(job => \`
              <div class="emineon-job-item">
                <div class="emineon-job-title">\${job.title}</div>
                <div class="emineon-job-meta">\${job.department} • \${job.location}</div>
                <div class="emineon-job-description">\${job.description.substring(0, 150)}...</div>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://app-emineon.vercel.app'}\${job.applicationUrl}" 
                   class="emineon-apply-btn" target="_blank">Apply Now</a>
              </div>
            \`).join('');
          } else {
            container.innerHTML = '<div style="text-align: center; color: #6b7280;">No open positions at this time.</div>';
          }
        })
        .catch(error => {
          console.error('Error loading jobs:', error);
          document.getElementById('emineon-jobs-list').innerHTML = 
            '<div style="text-align: center; color: #ef4444;">Error loading jobs. Please try again later.</div>';
        });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(embedHTML, {
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
} 