import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { candidateQueries } from '@/lib/db/queries';
import { reindexCandidate } from '@/lib/embeddings/reindex-service';
import { enhancedCVParser } from '@/lib/services/cv-parser-enhanced';
import { FileTypeUtils } from '@/lib/universal-storage';
import { mapEducationLevel } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    // Accept multipart uploads only (explicit error for others)
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      return NextResponse.json({ success: false, error: 'Content-Type must be multipart/form-data' }, { status: 415 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const candidateId = formData.get('candidateId') as string | null;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (accept images and documents)
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html',
      'text/markdown',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    if (file.type && !validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Please upload PDF, DOCX, TXT, HTML, MD, or image files (PNG/JPEG/WEBP).' }, { status: 400 });
    }

    // Read file buffer and parse using enhanced CV parser (single Responses API flow)
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedData = await enhancedCVParser.parseFromFile(buffer, file.name, file.type);

    // If candidateId is provided, update existing candidate
    if (candidateId) {
      // Upload CV file
      const uploadResult = await FileTypeUtils.uploadCV(buffer, file.name, candidateId, authResult.userId || 'system');

      // Map all parsed data to database fields using enhanced parser
      const mappedData = enhancedCVParser.mapToDatabase(parsedData);
      
      // Update candidate with parsed data and CV URL
      const updateData: any = {
        ...mappedData,
        original_cv_url: uploadResult.url,
        original_cv_file_name: file.name,
        original_cv_uploaded_at: new Date(),
      };

      const updatedCandidate = await candidateQueries.update(candidateId, updateData);
      reindexCandidate(candidateId, 'cv-upload').catch(err => { console.error('Failed to reindex after CV upload:', err); });
      const refreshed = await candidateQueries.findById(candidateId);
      return NextResponse.json({ success: true, data: refreshed, message: 'CV uploaded and candidate updated successfully' });
    } else {
      // Create new candidate from parsed data
      const mappedData = enhancedCVParser.mapToDatabase(parsedData);
      
      const candidateData: any = {
        ...mappedData,
        // Ensure required fields have defaults
        first_name: mappedData.first_name || 'Unknown',
        last_name: mappedData.last_name || 'Candidate',
        email: mappedData.email || `candidate_${Date.now()}@example.com`,
        source: 'cv_upload',
        gdpr_consent: true,
        gdpr_consent_date: new Date(),
      };

      // Create candidate
      const newCandidate = await candidateQueries.create(candidateData);

      // Upload CV file
      const uploadResult = await FileTypeUtils.uploadCV(buffer, file.name, newCandidate.id, authResult.userId || 'system');

      // Update with CV URL
      await candidateQueries.update(newCandidate.id, {
        original_cv_url: uploadResult.url,
        original_cv_file_name: file.name,
        original_cv_uploaded_at: new Date(),
      });

      // Reindex
      reindexCandidate(newCandidate.id, 'create').catch(err => { console.error('Failed to reindex new candidate:', err); });
      const refreshed = await candidateQueries.findById(newCandidate.id);
      return NextResponse.json({ success: true, data: refreshed, message: 'Candidate created from CV successfully' });
    }

  } catch (error: any) {
    console.error('CV upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process CV' }, { status: 500 });
  }
}
