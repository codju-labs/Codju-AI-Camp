import os
import re

# Files to update
HTML_FILES = [
    "index.html",
    "contact.html",
    "privacy-policy.html",
    "refund-cancellation-policy.html",
    "terms-and-conditions.html"
]

# List of image files to convert references for
IMAGES_TO_WEBP = [
    "chatgpt.png",
    "elevenlabs.png",
    "canva.png",
    "notebooklm.png",
    "suno.png",
    "lovable.png",
    "make.png",
    "ideogram.png",
    "perplexity.png",
    "google_labs.png",
    "capcut.png",
    "gemini.png",
    "pika.png",
    "day1.png",
    "day2.png",
    "day3.png",
    "day4.png",
    "day5.png",
    "day6.png",
    "day7.png",
    "image.png",
    "codju_certificate.png",
    "codju_support_update.png",
    "codju_support_cohort.png",
    "codju_support_mentor.png",
    "logo.png",
    "rohit_profile.jpeg",
    "rohit_profile.jpg"
]

def update_file(filepath):
    print(f"Updating: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Replace the images
    for img in IMAGES_TO_WEBP:
        # Match "assets/filename.ext" or "assets/filename.ext" with encoded or simple characters
        # But ensure we don't match og:image or similar things unless intended.
        # Actually, og:image should NOT be replaced. It contains "https://codju.com/assets/DP%20panda.png" which we don't touch anyway.
        # We can just replace "assets/filename" where filename has the specific extension
        base, ext = os.path.splitext(img)
        target = f"assets/{img}"
        replacement = f"assets/{base}.webp"
        content = content.replace(target, replacement)
        
        # Also check for any url-encoded references or double backslash
        target_escaped = f"assets/{base}\\\\.{ext[1:]}"
        replacement_escaped = f"assets/{base}\\\\.webp"
        content = content.replace(target_escaped, replacement_escaped)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Successfully updated image references in {filepath}")
    else:
        print(f"  No changes needed in {filepath}")

if __name__ == "__main__":
    for html_file in HTML_FILES:
        if os.path.exists(html_file):
            update_file(html_file)
        else:
            print(f"File not found: {html_file}")
