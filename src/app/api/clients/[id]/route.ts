import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { clientQueries, projectQueries, clientContactQueries } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for updating a client
const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

// GET /api/clients/[id] - Get client details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const clientId = params.id;
    const client = await clientQueries.findById(clientId);

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 });
    }

    // Get projects for this client
    const projects = await projectQueries.findAll({ client_id: clientId });
    const contacts = await clientContactQueries.findByClientId(clientId);

    const clientWithRelations = {
      ...client,
      projects,
      contacts,
      _count: { projects: projects.length, contacts: contacts.length }
    };

    return NextResponse.json({
      success: true,
      data: clientWithRelations
    });

  } catch (error) {
    logger.error('Error fetching client:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch client'
    }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const clientId = params.id;
    const body = await request.json();
    
    const validatedData = updateClientSchema.parse(body);

    // Map field names to database columns
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.contactPerson !== undefined) updateData.contact_person = validatedData.contactPerson;
    if (validatedData.contactEmail !== undefined) updateData.contact_email = validatedData.contactEmail;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry;
    if (validatedData.website !== undefined) updateData.website = validatedData.website;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Update the client
    const updatedClient = await clientQueries.update(clientId, updateData);

    if (!updatedClient) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedClient
    });

  } catch (error: any) {
    logger.error('Error updating client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update client'
    }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const clientId = params.id;
    
    // Check if client exists and has projects
    const client = await clientQueries.findById(clientId);
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 });
    }

    const projects = await projectQueries.findAll({ client_id: clientId });
    if (projects.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete client with existing projects'
      }, { status: 400 });
    }

    // For now, we'll prevent deletion. In a real app, you might soft delete.
    return NextResponse.json({
      success: false,
      error: 'Client deletion is not currently supported'
    }, { status: 405 });

  } catch (error) {
    logger.error('Error deleting client:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete client'
    }, { status: 500 });
  }
}