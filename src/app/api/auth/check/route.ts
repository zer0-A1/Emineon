import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'User not authenticated'
      }, { status: 401 });
    }

    // Get user details
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'User details not found'
      }, { status: 401 });
    }

    console.log('✅ Authentication check successful for user:', userId);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        imageUrl: user.imageUrl
      },
      message: 'User authenticated successfully'
    });

  } catch (error) {
    console.error('❌ Authentication check error:', error);
    
    return NextResponse.json({
      authenticated: false,
      error: 'Authentication check failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 