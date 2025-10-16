import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { clientQueries } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for creating a new client
const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const clients = await clientQueries.findAll();

    return NextResponse.json({
      success: true,
      data: clients
    });

  } catch (error) {
    logger.error('Error fetching clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch clients'
    }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Map fields to database columns
    const clientData = {
      name: validatedData.name,
      contact_person: validatedData.contactPerson,
      contact_email: validatedData.contactEmail,
      phone: validatedData.phone,
      address: validatedData.address,
      industry: validatedData.industry,
      website: validatedData.website,
      notes: validatedData.notes,
    };

    // Create the client
    const client = await clientQueries.create(clientData);

    logger.info('Client created successfully:', client.id);

    return NextResponse.json({
      success: true,
      data: client
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'A client with this name already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create client'
    }, { status: 500 });
  }
}