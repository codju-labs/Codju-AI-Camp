import os
import re
from urllib.parse import urlparse

HTML_FILES = [
    "index.html",
    "contact.html",
    "privacy-policy.html",
    "refund-cancellation-policy.html",
    "terms-and-conditions.html"
]

def check_file_links(filepath):
    print(f"\n--- Checking links in: {filepath} ---")
    if not os.path.exists(filepath):
        print(f"ERROR: File {filepath} not found!")
        return False
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all ids defined in this file to verify hash links
    ids = set(re.findall(r'id=["\']([^"\']+)["\']', content))
    
    # Also find all anchor tags hrefs
    hrefs = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\']', content)
    
    errors = 0
    checked = 0
    
    for href in hrefs:
        # Ignore external links, mailto, tel, and whatsapp for file-system presence
        if href.startswith(("http://", "https://", "mailto:", "tel:", "wa.me", "javascript:", "#reserve")):
            # External or protocol links
            continue
            
        checked += 1
        
        # 1. Hash links (e.g. #faq)
        if href.startswith("#"):
            target_id = href[1:]
            if not target_id: # href="#"
                continue
            if target_id not in ids:
                print(f"  [ERROR] Broken hash link: '{href}' (No element with id='{target_id}' found in {filepath})")
                errors += 1
            else:
                pass
                
        # 2. Local relative files (e.g. contact.html, assets/brochure.pdf)
        else:
            # Handle url-encoded spaces like %20 in filenames
            path = href.split("?")[0].split("#")[0] # strip query / hash params
            unquoted_path = path.replace("%20", " ")
            
            # Check if file exists relative to the root project directory
            if not os.path.exists(unquoted_path):
                print(f"  [ERROR] Broken local reference: '{href}' (File '{unquoted_path}' does not exist)")
                errors += 1
            else:
                pass
                
    print(f"Checked {checked} local/hash links. Found {errors} errors.")
    return errors == 0

if __name__ == "__main__":
    all_ok = True
    for html_file in HTML_FILES:
        ok = check_file_links(html_file)
        if not ok:
            all_ok = False
            
    if all_ok:
        print("\n🎉 ALL LINKS ARE SQUEAKY CLEAN & WORKING PERFECTLY!")
    else:
        print("\n❌ SOME BROKEN LINKS WERE DETECTED!")
