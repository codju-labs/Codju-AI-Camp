import os
import io
from pypdf import PdfReader, PdfWriter
from PIL import Image

def compress_pdf(input_path, output_path, max_dim=1200, quality=50):
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    # Copy pages to writer first so they belong to a PdfWriter context
    for page in reader.pages:
        writer.add_page(page)
        
    print("Iterating pages to compress and resize images...")
    # Now replace images on the pages in the writer context
    for page_num, page in enumerate(writer.pages):
        page.compress_content_streams()
        
        for img in page.images:
            try:
                original_img = img.image
                
                # Resize if the image is extremely large
                width, height = original_img.width, original_img.height
                if max(width, height) > max_dim:
                    ratio = max_dim / max(width, height)
                    new_size = (int(width * ratio), int(height * ratio))
                    # Resize using LANCZOS filter for high quality downscaling
                    original_img = original_img.resize(new_size, Image.Resampling.LANCZOS)
                    print(f"  Page {page_num+1}: Resized image from {width}x{height} to {new_size[0]}x{new_size[1]}")
                
                # Compress image
                if original_img.mode in ('RGBA', 'LA') or (original_img.mode == 'P' and 'transparency' in original_img.info):
                    # For transparent images, compress PNG
                    img.replace(original_img, optimize=True)
                else:
                    # Convert to RGB and compress as JPEG
                    rgb_img = original_img.convert('RGB')
                    img.replace(rgb_img, quality=quality, optimize=True)
                print(f"  Page {page_num+1}: Compressed image {img.name}")
            except Exception as e:
                print(f"  Page {page_num+1}: Skipping image {getattr(img, 'name', 'unknown')} due to error: {e}")

    with open(output_path, 'wb') as f:
        writer.write(f)

if __name__ == '__main__':
    input_file = "assets/Codju - AI Creator Camp Brochure.pdf"
    output_file = "assets/Codju - AI Creator Camp Brochure.pdf.tmp"
    
    if os.path.exists(input_file):
        initial_size = os.path.getsize(input_file)
        print(f"Original file size: {initial_size / (1024*1024):.2f} MB")
        
        # Max dimension of 1200px and JPEG quality 50 is perfect for screens
        compress_pdf(input_file, output_file, max_dim=1200, quality=50)
        
        if os.path.exists(output_file):
            compressed_size = os.path.getsize(output_file)
            print(f"Compressed file size: {compressed_size / (1024*1024):.2f} MB")
            print(f"Savings: {(initial_size - compressed_size) / (1024*1024):.2f} MB ({100 * (initial_size - compressed_size) / initial_size:.1f}%)")
            
            # Replace original file with compressed one if it is smaller
            if compressed_size < initial_size:
                os.replace(output_file, input_file)
                print("Successfully overwritten original brochure with the compressed version.")
            else:
                os.remove(output_file)
                print("Compressed file was not smaller, discarded.")
    else:
        print(f"Brochure not found at {input_file}")
