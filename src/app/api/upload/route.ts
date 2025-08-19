
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

// Helper function to convert a buffer to a readable stream
function bufferToStream(buffer: Buffer) {
    const readable = new Readable({
        read() {
            this.push(buffer);
            this.push(null);
        }
    });
    return readable;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine the resource type. For PDFs, it's 'raw'. Otherwise, 'auto' is fine.
    const resource_type = file.type === 'application/pdf' ? 'raw' : 'auto';

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jlks-paradip-uploads', 
          resource_type: resource_type,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      bufferToStream(buffer).pipe(uploadStream);
    });

    return NextResponse.json({ 
        success: true, 
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
    });

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
