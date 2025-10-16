interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface PortalInvitation {
  recipientEmail: string;
  recipientName?: string;
  portalUrl: string;
  clientName: string;
  inviterName: string;
  role: 'VIEWER' | 'COLLABORATOR' | 'ADMIN';
  jobTitle?: string;
  jobId?: string;
}

interface JobPipelineInvitation {
  recipientEmail: string;
  recipientName?: string;
  portalUrl: string;
  clientName: string;
  jobTitle: string;
  jobId: string;
  inviterName: string;
  role: 'VIEWER' | 'COLLABORATOR' | 'ADMIN';
}

class EmailService {
  private getPortalInvitationTemplate(invitation: PortalInvitation): EmailTemplate {
    const roleDescriptions = {
      VIEWER: 'view candidates and track progress',
      COLLABORATOR: 'view, rate, and comment on candidates',
      ADMIN: 'full access including settings management'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Client Portal Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .role-badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
    .feature-list { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .feature-item { margin: 8px 0; padding-left: 20px; position: relative; }
    .feature-item:before { content: "✓"; position: absolute; left: 0; color: #059669; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Welcome to Your Client Portal</h1>
      <p>You've been invited to collaborate on talent acquisition</p>
    </div>
    
    <div class="content">
      <p>Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},</p>
      
      <p><strong>${invitation.inviterName}</strong> has invited you to access the <strong>${invitation.clientName}</strong> talent portal on Emineon.</p>
      
      <p>Your access level: <span class="role-badge">${invitation.role}</span></p>
      
      <div class="feature-list">
        <h3>With your ${invitation.role} access, you can:</h3>
        ${invitation.role === 'VIEWER' ? `
          <div class="feature-item">View candidate profiles and progress</div>
          <div class="feature-item">Track pipeline stages and timelines</div>
          <div class="feature-item">Access professional competence files</div>
          <div class="feature-item">Watch candidate video presentations</div>
        ` : invitation.role === 'COLLABORATOR' ? `
          <div class="feature-item">View and rate candidate profiles</div>
          <div class="feature-item">Add comments and feedback</div>
          <div class="feature-item">Track pipeline progress in real-time</div>
          <div class="feature-item">Request interviews and assessments</div>
          <div class="feature-item">Download professional competence files</div>
          <div class="feature-item">Watch and interact with candidate videos</div>
        ` : `
          <div class="feature-item">Full candidate management and rating</div>
          <div class="feature-item">Complete commenting and feedback system</div>
          <div class="feature-item">Advanced pipeline analytics</div>
          <div class="feature-item">User management and invitations</div>
          <div class="feature-item">Portal configuration and settings</div>
          <div class="feature-item">Assessment requirement management</div>
        `}
      </div>
      
      <div style="text-align: center;">
        <a href="${invitation.portalUrl}" class="btn">Access Your Portal</a>
      </div>
      
      <p><strong>🎬 New Feature: Candidate Video Shorts</strong><br>
      Experience our innovative TikTok-style candidate presentations! Swipe through candidate videos on mobile or desktop to get a personal introduction from each potential hire.</p>
      
      <p>This portal provides a collaborative environment where you can track talent pipeline progress, evaluate candidates, and make informed hiring decisions with real-time insights.</p>
      
      <p>If you have any questions about using the portal, please don't hesitate to reach out to your recruitment team.</p>
      
      <p>Best regards,<br>
      <strong>The Emineon Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This invitation was sent on behalf of ${invitation.clientName}.<br>
        If you did not expect this invitation, please contact your recruitment team.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Welcome to Your Client Portal - ${invitation.clientName}

Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},

${invitation.inviterName} has invited you to access the ${invitation.clientName} talent portal on Emineon.

Your access level: ${invitation.role} - You can ${roleDescriptions[invitation.role]}.

Access your portal: ${invitation.portalUrl}

New Feature: Candidate Video Shorts
Experience our innovative TikTok-style candidate presentations! Swipe through candidate videos on mobile or desktop to get a personal introduction from each potential hire.

This portal provides a collaborative environment where you can track talent pipeline progress, evaluate candidates, and make informed hiring decisions with real-time insights.

If you have any questions about using the portal, please don't hesitate to reach out to your recruitment team.

Best regards,
The Emineon Team

---
This invitation was sent on behalf of ${invitation.clientName}.
If you did not expect this invitation, please contact your recruitment team.
    `;

    return {
      subject: `🎯 Portal Access Invitation - ${invitation.clientName} Talent Pipeline`,
      htmlContent,
      textContent
    };
  }

  private getJobPipelineInvitationTemplate(invitation: JobPipelineInvitation): EmailTemplate {
    const roleDescriptions = {
      VIEWER: 'view candidates and track progress',
      COLLABORATOR: 'view, rate, and comment on candidates',
      ADMIN: 'full access including settings management'
    };

    const specificJobUrl = `${invitation.portalUrl}/jobs/${invitation.jobId}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Job Pipeline Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .btn-secondary { background: #6b7280; }
    .job-card { background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .role-badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Job Pipeline Invitation</h1>
      <p>Review candidates for a specific position</p>
    </div>
    
    <div class="content">
      <p>Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},</p>
      
      <p><strong>${invitation.inviterName}</strong> has invited you to review the candidate pipeline for a specific position at <strong>${invitation.clientName}</strong>.</p>
      
      <div class="job-card">
        <h3>📋 Position: ${invitation.jobTitle}</h3>
        <p>Access level: <span class="role-badge">${invitation.role}</span></p>
        <p>You can ${roleDescriptions[invitation.role]} for this specific position.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${specificJobUrl}" class="btn">View Job Pipeline</a>
        <br>
        <a href="${invitation.portalUrl}" class="btn btn-secondary">Full Portal Access</a>
      </div>
      
      <p><strong>🎬 Experience Candidate Video Shorts</strong><br>
      Get to know candidates personally through our innovative video presentation feature. Swipe through candidate introductions just like social media - mobile optimized for convenience!</p>
      
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>📊 Track candidates through each pipeline stage</li>
        <li>⭐ Rate candidates based on fit and qualifications</li>
        <li>💬 Add comments and feedback for team collaboration</li>
        <li>📄 Download professional competence files</li>
        <li>🎥 Watch candidate video presentations</li>
        <li>📱 Mobile-optimized for on-the-go reviews</li>
      </ul>
      
      <p>This focused invitation gives you direct access to evaluate candidates for the <strong>${invitation.jobTitle}</strong> position while maintaining full visibility into the hiring process.</p>
      
      <p>Questions? Contact your recruitment team for assistance.</p>
      
      <p>Best regards,<br>
      <strong>The Emineon Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This invitation was sent for the ${invitation.jobTitle} position at ${invitation.clientName}.<br>
        If you did not expect this invitation, please contact your recruitment team.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
New Job Pipeline Invitation - ${invitation.jobTitle}

Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},

${invitation.inviterName} has invited you to review the candidate pipeline for the ${invitation.jobTitle} position at ${invitation.clientName}.

Your access level: ${invitation.role} - You can ${roleDescriptions[invitation.role]}.

Direct job pipeline access: ${specificJobUrl}
Full portal access: ${invitation.portalUrl}

Experience Candidate Video Shorts
Get to know candidates personally through our innovative video presentation feature. Swipe through candidate introductions just like social media - mobile optimized for convenience!

What you can do:
- Track candidates through each pipeline stage
- Rate candidates based on fit and qualifications  
- Add comments and feedback for team collaboration
- Download professional competence files
- Watch candidate video presentations
- Mobile-optimized for on-the-go reviews

This focused invitation gives you direct access to evaluate candidates for the ${invitation.jobTitle} position while maintaining full visibility into the hiring process.

Questions? Contact your recruitment team for assistance.

Best regards,
The Emineon Team

---
This invitation was sent for the ${invitation.jobTitle} position at ${invitation.clientName}.
If you did not expect this invitation, please contact your recruitment team.
    `;

    return {
      subject: `🎯 Job Pipeline Access - ${invitation.jobTitle} at ${invitation.clientName}`,
      htmlContent,
      textContent
    };
  }

  async sendPortalInvitation(invitation: PortalInvitation): Promise<boolean> {
    try {
      const template = this.getPortalInvitationTemplate(invitation);
      
      // In a real implementation, you would integrate with your email service
      // Examples: SendGrid, Mailgun, AWS SES, etc.
      
      console.log('📧 Sending portal invitation email:', {
        to: invitation.recipientEmail,
        subject: template.subject,
        portalUrl: invitation.portalUrl,
        clientName: invitation.clientName,
        role: invitation.role
      });

      // Mock successful email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to send portal invitation:', error);
      return false;
    }
  }

  async sendJobPipelineInvitation(invitation: JobPipelineInvitation): Promise<boolean> {
    try {
      const template = this.getJobPipelineInvitationTemplate(invitation);
      
      console.log('📧 Sending job pipeline invitation email:', {
        to: invitation.recipientEmail,
        subject: template.subject,
        jobTitle: invitation.jobTitle,
        portalUrl: invitation.portalUrl,
        clientName: invitation.clientName,
        role: invitation.role
      });

      // Mock successful email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to send job pipeline invitation:', error);
      return false;
    }
  }

  async sendBulkInvitations(invitations: (PortalInvitation | JobPipelineInvitation)[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    for (const invitation of invitations) {
      try {
        let success = false;
        
        if ('jobId' in invitation && 'jobTitle' in invitation) {
          success = await this.sendJobPipelineInvitation(invitation as JobPipelineInvitation);
        } else {
          success = await this.sendPortalInvitation(invitation as PortalInvitation);
        }

        if (success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            email: invitation.recipientEmail,
            error: 'Failed to send email'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: invitation.recipientEmail,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Generate shareable portal link with tracking
  generateShareableLink(portalUrl: string, source: string = 'direct'): string {
    const url = new URL(portalUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'portal_share');
    url.searchParams.set('utm_campaign', 'client_collaboration');
    url.searchParams.set('shared_at', new Date().toISOString());
    
    return url.toString();
  }

  // Generate quick copy text for manual sharing
  generateQuickShareText(clientName: string, portalUrl: string, jobTitle?: string): string {
    const shareableUrl = this.generateShareableLink(portalUrl, 'manual_share');
    
    if (jobTitle) {
      return `🎯 You're invited to review candidates for the ${jobTitle} position at ${clientName}!

Access the candidate pipeline here: ${shareableUrl}

Features:
• Watch candidate video presentations 📹
• Rate and comment on candidates ⭐
• Track progress in real-time 📊
• Mobile-optimized experience 📱

Questions? Contact your recruitment team.`;
    }

    return `🎯 You're invited to access the ${clientName} talent portal!

Access your portal here: ${shareableUrl}

Features:
• Candidate video shorts (TikTok-style) 📹
• Real-time pipeline tracking 📊
• Professional competence files 📄
• Mobile-optimized collaboration 📱

Questions? Contact your recruitment team.`;
  }
}

// Singleton instance
export const emailService = new EmailService();

// Export types for use in other files
export type { PortalInvitation, JobPipelineInvitation, EmailTemplate }; 