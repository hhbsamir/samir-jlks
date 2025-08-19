
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const { publicId, resourceType = 'image' } = await request.json();

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'No publicId provided' }, { status: 400 });
    }

    // Use the Cloudinary admin API to delete the resource
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(result.result);
    }
    
    return NextResponse.json({ success: true, message: `Successfully deleted ${publicId}` });

  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Deletion failed: ${errorMessage}` }, { status: 500 });
  }
}
